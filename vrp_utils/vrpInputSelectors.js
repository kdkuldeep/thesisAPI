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
//    - this index + 1 is the Routing node index used in previous VRP Solution (+1 for depot)

const createStartingLocations = (vehicleIDs, orderIDs) =>
  vehicleIDs.map(vehicle_id =>
    db("orders")
      .where({ vehicle_id, completed: false })
      .orderBy("route_index")
      .first()
      .then(({ order_id }) => orderIDs.indexOf(order_id) + 1)
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
            .table("reserve")
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

// Return DURATION MATRIX input as a N x M array where:
// N = number of orders + 1
// M = number of orders + 1
// diagonal filled with 0 for same location duration
const createDurationMatrix = coordData =>
  matrixService
    .getMatrix({ points: coordData, profile: "driving" })
    .send()
    .then(response => response.body.durations);

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
  createReservesInput,
  createDemandsInput
};
