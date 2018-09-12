const db = require("../../../db/knex");

const { matrixService } = require("../../../mapboxServices");

const VRPSolver = require("../../../build/Release/VRPSolver.node");

const { TEST_MATRIX } = require("./TEST_MATRIX");
// https://www.mapbox.com/api-documentation/?language=JavaScript#retrieve-a-matrix

// https://www.mapbox.com/api-documentation/pages/traffic-countries.html

// TODO:
// - Make multiple calls to matrix service if point count > 25 and update data accordingly

const getAvailableVehicleCount = company_id =>
  db
    .select()
    .from("vehicles")
    .where({ company_id })
    .whereNot("driver_id", null)
    .count()
    .first()
    .then(data => data.count);

const getDepotCoords = company_id =>
  db
    .select("latitude", "longitude")
    .from("companies")
    .where({ company_id })
    .first()
    .then(data => ({
      coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)]
    }));

const getCustomerCoords = company_id =>
  db
    .table("orders")
    .where({ company_id })
    .innerJoin("customers", "orders.customer_id", "customers.user_id")
    .distinct("orders.customer_id")
    .select("latitude", "longitude")
    .then(data =>
      data.map(order => ({
        coordinates: [parseFloat(order.longitude), parseFloat(order.latitude)]
      }))
    );

// Creates an Array of type:
// [
//   {coordinates: [lng, lat]},
//   {coordinates: [lng, lat]},
//    ...
// ]
// This array is used as input to the Mapbox API Matrix service

const getDurationMatrix = company_id =>
  Promise.all([getDepotCoords(company_id), getCustomerCoords(company_id)]).then(
    ([depotCoords, customerCoords]) => {
      const points = [depotCoords, ...customerCoords];
      // console.log(points);
      return matrixService
        .getMatrix({ points, profile: "driving" })
        .send()
        .then(response => response.body);
    }
  );

const getRoutingData = company_id =>
  Promise.all([
    getAvailableVehicleCount(company_id),
    getDurationMatrix(company_id)
  ]);

const solve = (req, res) => {
  const { company_id } = req.user;
  // getRoutingData(company_id).then(([numberOfVehicles, matrix]) => {
  //     console.log(VRPSolver.solve(parseInt(numberOfVehicles, 10), matrix.durations));
  // });
  getAvailableVehicleCount(company_id).then(numberOfVehicles => {
    console.log(VRPSolver.solve(parseInt(numberOfVehicles, 10), TEST_MATRIX));
    res.json({ TEST_MATRIX });
  });
};

module.exports = {
  solve
};
