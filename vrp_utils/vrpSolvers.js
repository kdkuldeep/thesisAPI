const VRPSolver = require("../build/Release/VRPSolver.node");

const METAHEURISTIC_TIME_LIMIT = 10000; // millisecond

const {
  getVehicleData,
  getVehicleIds,
  getProductData,
  getOrderData,
  getOrderIds,
  createCoordData,
  createCapacitiesInput,
  createDemandsInput,
  createVolumesInput,
  createDurationMatrix
} = require("./vrpInputSelectors");

const { handleOutput } = require("./vrpOutputHandler");

const calculateInitialRoutes = company_id =>
  Promise.all([getVehicleData(company_id), getOrderData(company_id)])
    .then(([vehicleData, orderData]) =>
      Promise.all([
        vehicleData,
        orderData,
        createCoordData(company_id, orderData)
      ])
    )

    .then(([vehicleData, orderData, coordData]) =>
      Promise.all([
        getVehicleIds(vehicleData),
        getOrderIds(orderData),
        coordData,
        createCapacitiesInput(vehicleData),
        createVolumesInput(orderData),
        createDurationMatrix(coordData)
      ])
    )
    .then(
      ([vehicleIDs, orderIDs, coordData, capacities, volumes, durations]) => {
        console.log("\nOrder IDs");
        console.log(orderIDs);
        console.log("\nVehicle IDs");
        console.log(vehicleIDs);
        console.log("\nCoordinates");
        console.log(coordData);
        console.log("\nVehicle capacities");
        console.log(capacities);
        console.log("\nOrder volumes");
        console.log(volumes);
        return Promise.all([
          vehicleIDs,
          orderIDs,
          coordData,
          VRPSolver.solveAsyncWithCapacityConstraints(
            capacities,
            volumes,
            durations,
            METAHEURISTIC_TIME_LIMIT
          )
        ]);
      }
    )
    .then(([vehicleIDs, orderIDs, coordData, routingData]) =>
      handleOutput(company_id, vehicleIDs, orderIDs, coordData, routingData)
    );

module.exports = {
  calculateInitialRoutes
};
