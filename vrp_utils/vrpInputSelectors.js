const db = require("../db/knex");
const { matrixService } = require("../mapboxServices");

// *******************************************************
// *             Vehicle Related Data                    *
// *******************************************************

// base function to get all MANNED vehicles of specified company
// ORDERED by vehicle_id

// this data is used to create the CAPACITIES and RESERVES
// used as input to the vrp solvers

const getVehicleData = company_id =>
  db
    .table("vehicles")
    .where({ company_id })
    .whereNot("driver_id", null)
    .orderBy("vehicle_id");

const getVehicleIds = vehicleData =>
  vehicleData.map(vehicle => vehicle.vehicle_id);

// Return CAPACITIES input as a N x 1 array where:
// N = number of manned vehicles

const createCapacitiesInput = vehicleData =>
  vehicleData.map(vehicle => vehicle.capacity);

// Return a N x 1 array where:
// N = number of vehicles
// takes as parameters the ORDERED ids of vehicles and orders used in VRPSolver
// return the starting location of each vehicle:
//    - find the order_id of the order with minimum route_index
//    - find the index of this order_id in orderIDs array

const createStartingLocations = (vehicleIDs, orderIDs) =>
  Promise.all(
    vehicleIDs.map(vehicle_id =>
      db("orders")
        .where({ vehicle_id, completed: false })
        .orderBy("route_index")
        .first()
        .then(({ order_id }) => orderIDs.indexOf(order_id) + 1)
    )
  );

// Return a N x M(i) array where:
// N = number of vehicles
// M(i) = number or incomplete orders in the current route of vehicle {i}
// takes as parameters the ORDERED ids of vehicles and orders used in VRPSolver
// return the current route of each vehicle:
//    - get the order IDs of orders served by each vehicle ORDERED BY route_index
//    - find the index of every order_id in orderIDs array

const createCurrentRoutes = (vehicleIDs, orderIDs) =>
  Promise.all(
    vehicleIDs.map(vehicle_id =>
      db("orders")
        .where({ vehicle_id, completed: false })
        .orderBy("route_index")
        .map(({ order_id }) => orderIDs.indexOf(order_id) + 1)
    )
  );

// Return RESERVES input as a N x M array where:
// N = number of company products
// M = number of manned vehicles

const createReservesInput = (productData, vehicleData) =>
  Promise.all(
    productData.map(product =>
      Promise.all(
        vehicleData.map(vehicle =>
          db
            .table("reserves")
            .where({
              vehicle_id: vehicle.vehicle_id,
              product_id: product.product_id
            })
            .then(reserve => (reserve.length === 0 ? 0 : reserve[0].quantity))
        )
      )
    )
  );

// *******************************************************
// *            Product Related Data                     *
// *******************************************************

// base function to get all products of specified company ORDERED by product_id

// this data is used to create the DEMANDS and RESERVES
// used as input to the vrp solvers

const getProductData = company_id =>
  db
    .table("products")
    .where({ company_id })
    .orderBy("product_id");

// *******************************************************
// *            Order Related Data                       *
// *******************************************************

// base function to get all orders of specified company
// ORDERED by order_id
//
// this data is used to create the DURATION MATRIX, DEMANDS, and VOLUMES
// used as input to the vrp solvers

const getOrderData = company_id =>
  db
    .table("orders")
    .where({ company_id, completed: false })
    .innerJoin("customers", "orders.customer_id", "customers.user_id")
    .select("order_id", "latitude", "longitude", "total_volume")
    .orderBy("order_id");

const getOrderIds = orderData => orderData.map(order => order.order_id);

// Return DEMANDS input as a N x M array where:
// N = number of company products
// M = number of orders + 1
// first COLUMN filled with 0 for demands accumulated at depot

const createDemandsInput = (productData, orderData) =>
  Promise.all(
    productData.map(product =>
      Promise.all(
        orderData.map(order =>
          db
            .table("order_product_rel")
            .where({ order_id: order.order_id, product_id: product.product_id })
            .then(
              contents => (contents.length === 0 ? 0 : contents[0].quantity)
            )
        )
      ).then(arr => [0, ...arr])
    )
  );

// Return VOLUMES input as a N x 1 array where:
// N = number of orders + 1
// first element 0 for volume accumulated at depot

const createVolumesInput = orderData => [
  0,
  ...orderData.map(order => order.total_volume)
];

// *******************************************************
// *            Location Related Data                    *
// *******************************************************

const getDepotCoords = company_id =>
  db
    .select("latitude", "longitude")
    .from("companies")
    .where({ company_id })
    .first()
    .then(data => ({
      coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)]
    }));

const getCustomerCoords = orderData =>
  orderData.map(order => ({
    coordinates: [parseFloat(order.longitude), parseFloat(order.latitude)]
  }));

// Return a N x 1 array where:
// N = number of orders + 1
//
// [{coordinates: [lng, lat]},
//  {coordinates: [lng, lat]},
//            ...           ]
// This array is used as input to the Mapbox APIs

const createCoordData = (company_id, orderData) =>
  Promise.all([getDepotCoords(company_id), getCustomerCoords(orderData)]).then(
    ([depotCoords, customerCoords]) => [depotCoords, ...customerCoords]
  );

// Functions for multiple Mapbox Matrix API calls
// when number of points > 25
const numsInRange = (start, end) =>
  [...Array(1 + end - start).keys()].map(key => key + start);

const isOuter = (numberOfLocations, i, j) =>
  i * 24 + 24 > numberOfLocations || j * 24 + 24 > numberOfLocations;

const handleDiagonalPartition = (coordData, i, j) => {
  const allPoints = isOuter(coordData.length, i, j)
    ? coordData.slice(i * 24, coordData.length)
    : coordData.slice(i * 24, i * 24 + 24);

  return getDurationMatrix({ points: allPoints });
};

const handleLowerTriaglePartition = (coordData, i, j) => {
  const allSourcePoints = isOuter(coordData.length, i, j)
    ? coordData.slice(i * 24, coordData.length)
    : coordData.slice(i * 24, i * 24 + 24);
  const allDestinationPoints = coordData.slice(j * 24, j * 24 + 24);

  const firstDestPts = allDestinationPoints.slice(0, 12);
  const secondDestPts = allDestinationPoints.slice(12, 24);

  if (allSourcePoints.length <= 12) {
    return Promise.all([
      getDurationMatrix({
        points: allSourcePoints.concat(firstDestPts),
        sources: numsInRange(0, allSourcePoints.length - 1),
        destinations: numsInRange(
          allSourcePoints.length,
          allSourcePoints.length + firstDestPts.length - 1
        )
      }),
      getDurationMatrix({
        points: allSourcePoints.concat(secondDestPts),
        sources: numsInRange(0, allSourcePoints.length - 1),
        destinations: numsInRange(
          allSourcePoints.length,
          allSourcePoints.length + secondDestPts.length - 1
        )
      })
    ]).then(([left, right]) => mergeHorizontally(left, right));
  }

  const firstSrcPts = allSourcePoints.slice(0, 12);
  const secondSrcPts = allSourcePoints.slice(12, allSourcePoints.length);
  return handlePartitionWithPoints(
    firstSrcPts,
    secondSrcPts,
    firstDestPts,
    secondDestPts
  );
};

const handleUpperTriaglePartition = (coordData, i, j) => {
  const allSourcePoints = coordData.slice(i * 24, i * 24 + 24);
  const allDestinationPoints = isOuter(coordData.length, i, j)
    ? coordData.slice(j * 24, coordData.length)
    : coordData.slice(j * 24, j * 24 + 24);

  const firstSrcPts = allSourcePoints.slice(0, 12);
  const secondSrcPts = allSourcePoints.slice(12, 24);

  if (allDestinationPoints.length <= 12) {
    return Promise.all([
      Promise.all([
        getDurationMatrix({
          points: firstSrcPts.concat(allDestinationPoints),
          sources: numsInRange(0, firstSrcPts.length - 1),
          destinations: numsInRange(
            firstSrcPts.length,
            firstSrcPts.length + allDestinationPoints.length - 1
          )
        })
      ]).then(([upper]) => upper),
      Promise.all([
        getDurationMatrix({
          points: secondSrcPts.concat(allDestinationPoints),
          sources: numsInRange(0, secondSrcPts.length - 1),
          destinations: numsInRange(
            secondSrcPts.length,
            secondSrcPts.length + allDestinationPoints.length - 1
          )
        })
      ]).then(([lower]) => lower)
    ]).then(([upper, lower]) => mergeVertically(upper, lower));
  }
  const firstDestPts = allDestinationPoints.slice(0, 12);
  const secondDestPts = allDestinationPoints.slice(
    12,
    allDestinationPoints.length
  );
  return handlePartitionWithPoints(
    firstSrcPts,
    secondSrcPts,
    firstDestPts,
    secondDestPts
  );
};

const handlePartitionWithPoints = (
  firstSrcPts,
  secondSrcPts,
  firstDestPts,
  secondDestPts
) =>
  Promise.all([
    Promise.all([
      getDurationMatrix({
        points: firstSrcPts.concat(firstDestPts),
        sources: numsInRange(0, firstSrcPts.length - 1),
        destinations: numsInRange(
          firstSrcPts.length,
          firstSrcPts.length + firstDestPts.length - 1
        )
      }),
      getDurationMatrix({
        points: firstSrcPts.concat(secondDestPts),
        sources: numsInRange(0, firstSrcPts.length - 1),
        destinations: numsInRange(
          firstSrcPts.length,
          firstSrcPts.length + secondDestPts.length - 1
        )
      })
    ]).then(([left, right]) => mergeHorizontally(left, right)),
    Promise.all([
      getDurationMatrix({
        points: secondSrcPts.concat(firstDestPts),
        sources: numsInRange(0, secondSrcPts.length - 1),
        destinations: numsInRange(
          secondSrcPts.length,
          secondSrcPts.length + firstDestPts.length - 1
        )
      }),
      getDurationMatrix({
        points: secondSrcPts.concat(secondDestPts),
        sources: numsInRange(0, secondSrcPts.length - 1),
        destinations: numsInRange(
          secondSrcPts.length,
          secondSrcPts.length + secondDestPts.length - 1
        )
      })
    ]).then(([left, right]) => mergeHorizontally(left, right))
  ]).then(([upper, lower]) => mergeVertically(upper, lower));

const mergeHorizontally = (left, right) => {
  if (left.length !== right.length) console.log("ERROR MERGE HORIZONTALLY");
  const numRows = left.length;
  const merged = [];

  for (let row = 0; row < numRows; row += 1)
    merged.push(left[row].concat(right[row]));
  return merged;
};

const mergeVertically = (upper, lower) => {
  if (upper[0].length !== lower[0].length)
    console.log("ERROR MERGE VERTICALLY");

  return upper.concat(lower);
};

const getDurationMatrix = config =>
  matrixService
    .getMatrix({ ...config, profile: "driving" })
    .send()
    .then(response => response.body.durations);

// Return DURATION MATRIX input as a N x Ν array where:
// N = number of orders + 1
// diagonal filled with 0 for same location duration
const createDurationMatrix = coordData => {
  const numberOfLocations = coordData.length;

  if (numberOfLocations <= 25) return getDurationMatrix({ points: coordData });

  const numOfPartitions = Math.ceil(numberOfLocations / 12);
  const partitionedMatrixDimension = Math.ceil(numOfPartitions / 2);

  const promiseMatrix = [];
  let row = [];
  for (let i = 0; i < partitionedMatrixDimension; i += 1) {
    row = [];
    for (let j = 0; j < partitionedMatrixDimension; j += 1) {
      if (i === j) row.push(handleDiagonalPartition(coordData, i, j));
      else if (i > j) row.push(handleLowerTriaglePartition(coordData, i, j));
      else row.push(handleUpperTriaglePartition(coordData, i, j));
    }
    promiseMatrix.push(row);
  }

  return Promise.all(promiseMatrix.map(row => Promise.all(row))).then(
    partitionedMatrix =>
      partitionedMatrix.reduce((upper, lower) =>
        mergeVertically(
          upper.reduce((left, right) => mergeHorizontally(left, right)),
          lower.reduce((left, right) => mergeHorizontally(left, right))
        )
      )
  );
};
// const createDurationMatrix = coordData =>
//   matrixService
//     .getMatrix({ points: coordData, profile: "driving" })
//     .send()
//     .then(response => response.body.durations);

module.exports = {
  getVehicleData,
  getVehicleIds,
  getProductData,
  getOrderData,
  getOrderIds,
  createCoordData,
  createCapacitiesInput,
  createVolumesInput,
  createDurationMatrix,
  createStartingLocations,
  createCurrentRoutes,
  createReservesInput,
  createDemandsInput
};
