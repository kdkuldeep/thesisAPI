const db = require("../../../db/knex");

const { matrixService } = require("../../../mapboxServices");

const { VRPSolverWrapper } = require("../../../build/Release/VRPSolver.node");

// https://www.mapbox.com/api-documentation/?language=JavaScript#retrieve-a-matrix

// https://www.mapbox.com/api-documentation/pages/traffic-countries.html

// TODO:
// - Make multiple calls to matrix service if point count > 25 and update data accordingly

// Create an Object that will be passed to the C++ Routing Solver
// Required Data (object type):

//  {
//    numberOfVehicles: ... ,
//    matrix: [],
//    ...
// }

// FIXME: Find better way to use Promise return value !!FOUND__CHECK ALL

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
    .select("latitude", "longitude")
    .from("orders")
    .where({ company_id })
    .innerJoin("customers", "orders.customer_id", "customers.user_id")
    .distinct("orders.customer_id")
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
      console.log(points);
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
  getRoutingData(company_id).then(([numberOfVehicles, matrix]) => {
    const vrpInstance = new VRPSolverWrapper(
      parseInt(numberOfVehicles, 10),
      matrix.durations
    );
    console.log(vrpInstance.getNumOfVehicles());
    console.log(vrpInstance.getMatrix());
    res.json({ numberOfVehicles, matrix });
  });

  // const vrpInstance = new VRPSolverWrapper(5, [
  //   [4, 2, 3],
  //   [5, 1, 4],
  //   [6, 1, 6],
  //   [7, 8, 9]
  // ]);
  // console.log(vrpInstance.getNumOfVehicles());
  // console.log(vrpInstance.getMatrix());
  // res.json({});
};

module.exports = {
  solve
};
