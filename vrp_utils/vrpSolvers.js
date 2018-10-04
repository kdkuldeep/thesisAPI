const VRPSolver = require("../build/Release/VRPSolver.node");

const db = require("../db/knex");

const METAHEURISTIC_TIME_LIMIT = 10000; // millisecond

const {
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
        console.log("\n-----------------------------------------\n");
        console.log("\nCompany ID");
        console.log(company_id);
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
    .then(([vehicleIDs, orderIDs, coordData, routingOutput]) => {
      console.log("\n-----------------------------------------\n");
      return handleOutput(
        company_id,
        vehicleIDs,
        orderIDs,
        coordData,
        routingOutput
      );
    });

const recalculateRoutes = company_id =>
  Promise.all([
    getVehicleData(company_id),
    getOrderData(company_id),
    getProductData(company_id)
  ])
    .then(([vehicleData, orderData, productData]) =>
      Promise.all([
        vehicleData,
        orderData,
        productData,
        createCoordData(company_id, orderData),
        getVehicleIds(vehicleData),
        getOrderIds(orderData)
      ])
    )
    .then(
      ([
        vehicleData,
        orderData,
        productData,
        coordData,
        vehicleIDs,
        orderIDs
      ]) =>
        Promise.all([
          vehicleIDs,
          orderIDs,
          coordData,
          createStartingLocations(vehicleIDs, orderIDs),
          createReservesInput(productData, vehicleData),
          createDemandsInput(productData, orderData),
          createDurationMatrix(coordData)
        ])
    )
    .then(
      ([
        vehicleIDs,
        orderIDs,
        coordData,
        startingLocations,
        reserves,
        demands,
        durations
      ]) => {
        console.log("\n-----------------------------------------\n");
        console.log("\nCompany ID");
        console.log(company_id);
        console.log("\nOrder IDs");
        console.log(orderIDs);
        console.log("\nVehicle IDs");
        console.log(vehicleIDs);
        console.log("\nCoordinates");
        console.log(coordData);
        console.log("\nVehicle starting locations");
        console.log(startingLocations);
        console.log("\nVehicle reserves");
        console.log(reserves);
        console.log("\nOrder demands");
        console.log(demands);
        return Promise.all([
          vehicleIDs,
          orderIDs,
          coordData,
          VRPSolver.solveAsyncWithReserveConstraints(
            startingLocations,
            reserves,
            demands,
            durations,
            METAHEURISTIC_TIME_LIMIT
          )
        ]);
      }
    )
    .then(([vehicleIDs, orderIDs, coordData, routingOutput]) => {
      console.log("\n-----------------------------------------\n");
      return handleOutput(
        company_id,
        vehicleIDs,
        orderIDs,
        coordData,
        routingOutput
      );
    });

const onNewOrderConditionalReroute = companyIDs =>
  db("companies")
    .whereIn("company_id", companyIDs)
    .andWhere({ shipping_initialized: true })
    .pluck("company_id")
    .map(company_id => recalculateRoutes(company_id));

module.exports = {
  calculateInitialRoutes,
  onNewOrderConditionalReroute
};
