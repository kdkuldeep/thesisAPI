const db = require("../../../db/knex");

const { matrixService } = require("../../../mapboxServices");

const VRPSolver = require("../../../build/Release/VRPSolver.node");

const { TEST_MATRIX } = require("./TEST_MATRIX");
// https://www.mapbox.com/api-documentation/?language=JavaScript#retrieve-a-matrix

// https://www.mapbox.com/api-documentation/pages/traffic-countries.html

// TODO:
// - Make multiple calls to matrix service if point count > 25 and update data accordingly

const getVehicleCapacities = company_id =>
  db
    .table("vehicles")
    .where({ company_id })
    .whereNot("driver_id", null)
    .orderBy("vehicle_id")
    .pluck("capacity");

const getOrderData = company_id =>
  db
    .table("orders")
    .where({ company_id })
    .innerJoin("customers", "orders.customer_id", "customers.user_id")
    .select("order_id", "latitude", "longitude", "total_volume")
    .orderBy("order_id");

const getProducts = company_id =>
  db
    .table("products")
    .where({ company_id })
    .orderBy("product_id");

// [[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],                 n x m array
// [ 2, 5, 0, 10, 8, 2, 4, 6, 8, 0 ],                 n = number of orders + 1
// [ 1, 0, 5, 5, 0, 1, 0, 1, 0, 4 ],                  m = number of company products
// [ 3, 0, 0, 3, 2, 2, 2, 6, 6, 4 ],                  first row filled with 0 for demands accumulated at depot
//              ......
// [ 0, 0, 0, 0, 0, 0, 0, 0, 2, 0 ],
// [ 10, 8, 1, 8, 7, 1, 1, 9, 8, 8 ]]

const getDemands = (company_id, orderData) =>
  getProducts(company_id).then(productData =>
    Promise.all(
      orderData.map(order =>
        Promise.all(
          productData.map(product =>
            db
              .table("order_product_rel")
              .where("order_id", order.order_id)
              .andWhere("product_id", product.product_id)
              .then(
                contents => (contents.length === 0 ? 0 : contents[0].quantity)
              )
          )
        )
      )
    ).then(arr => [Array(productData.length).fill(0), ...arr])
  );

// return an array of size number of orders + 1
// first element 0 for Volume accumulated at depot
const getOrderVolumes = orderData => [
  0,
  ...orderData.map(order => order.total_volume)
];

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

// Creates an Array of type:
// [
//   {coordinates: [lng, lat]},
//   {coordinates: [lng, lat]},
//    ...
// ]
// This array is used as input to the Mapbox API Matrix service

const getDurationMatrix = (company_id, orderData) =>
  Promise.all([getDepotCoords(company_id), getCustomerCoords(orderData)]).then(
    ([depotCoords, customerCoords]) => {
      const points = [depotCoords, ...customerCoords];
      // console.log(points);
      return matrixService
        .getMatrix({ points, profile: "driving" })
        .send()
        .then(response => response.body.durations);
    }
  );

const solve = (req, res) => {
  const { company_id } = req.user;
  getOrderData(company_id)
    .then(orderData =>
      Promise.all([
        getVehicleCapacities(company_id),
        getOrderVolumes(orderData),
        getDemands(company_id, orderData),
        // getDurationMatrix(company_id, orderData)
        TEST_MATRIX
      ])
    )
    .then(([capacities, volumes, demands, durations]) => {
      console.log("\nVehicle capacities");
      console.log(capacities);
      console.log("\nOrder volumes");
      console.log(volumes);
      console.log("\nProduct demands");
      console.log(demands);
      // console.log("\nDuration matrix");
      // console.log(durations);
      VRPSolver.solve(capacities, volumes, demands, durations).then(results => {
        console.log(results);
        res.json(durations);
      });
    });
};

module.exports = {
  solve
};
