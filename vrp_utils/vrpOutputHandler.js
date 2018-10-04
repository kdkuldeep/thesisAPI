const groupBy = require("lodash/groupBy");
const db = require("../db/knex");
const { directionsService } = require("../mapboxServices");

// *******************************************************
// *            Order Related Updates                    *
// *******************************************************

const clearOrderRouting = (trx, company_id) =>
  db("orders")
    .where({ company_id })
    .update({ vehicle_id: null, route_index: null, eta: null });

// Update the appropriate rows in ORDERS table for orders routed in VRP solution where:
// vehicle_id = the id of the vehicle handling the order
// eta = estimated time of arrival
// route_index = index of order in vehicle's delivery route

// TODO: update eta
const updateOrders = (trx, orderIDs, vehicleIDs, routes) =>
  Promise.all(
    routes.map((route, vehicleIndex) => {
      // Get order IDS for each vehicle route from route indexes
      // Remove first and last index that refer to depot
      const routeOrders = route
        .slice(1, route.length - 1)
        .map(orderIndex => orderIDs[orderIndex - 1]);

      return Promise.all(
        routeOrders.map((order_id, indexInRoute) =>
          db("orders")
            .where({ order_id })
            .update({
              vehicle_id: vehicleIDs[vehicleIndex],
              route_index: indexInRoute + 1
            })
            .transacting(trx)
        )
      );
    })
  );

// *******************************************************
// *            Vehicle Route Updates                  *
// *******************************************************

const clearRoutes = (trx, company_id) =>
  db("vehicles")
    .where({ company_id })
    .update({ route: null })
    .transacting(trx);

const updateRoutes = (trx, company_id, vehicleIDs, coords, routes) =>
  clearRoutes(trx, company_id).then(() =>
    Promise.all(
      routes.map((route, vehicleIndex) => {
        const vehicle_id = vehicleIDs[vehicleIndex];
        const waypoints = route.map(orderIndex => coords[orderIndex]);

        return directionsService
          .getDirections({
            waypoints,
            geometries: "polyline6",
            overview: "full"
          })
          .send()
          .then(response => response.body.routes[0].geometry)
          .then(encodedPolyline =>
            db("vehicles")
              .where({ vehicle_id })
              .update({ route: encodedPolyline })
              .transacting(trx)
          );
      })
    )
  );

// *******************************************************
// *            Vehicle Reserve Updates                 *
// *******************************************************

const clearReserves = (trx, company_id) =>
  db("vehicles")
    .where({ company_id })
    .pluck("vehicle_id")
    .then(vehicleIDs =>
      db("reserves")
        .whereIn("vehicle_id", vehicleIDs)
        .del()
        .transacting(trx)
    );

const initReserves = (trx, company_id, orderIDs, vehicleIDs, routes) =>
  clearReserves(trx, company_id).then(() =>
    Promise.all(
      routes.map((route, vehicleIndex) => {
        const vehicle_id = vehicleIDs[vehicleIndex];
        const routeOrders = route
          .slice(1, route.length - 1)
          .map(orderIndex => orderIDs[orderIndex - 1]);

        return db
          .select("product_id", "quantity")
          .from("order_product_rel")
          .whereIn("order_id", routeOrders)
          .then(products => groupBy(products, "product_id"))
          .then(productsById =>
            Promise.all(
              Object.keys(productsById).map(product_id => {
                const totalQuantity = productsById[product_id]
                  .map(product => product.quantity)
                  .reduce((a, b) => a + b);

                return db
                  .insert({
                    product_id,
                    vehicle_id,
                    min_quantity: totalQuantity,
                    quantity: totalQuantity
                  })
                  .into("reserves")
                  .transacting(trx);
              })
            )
          );
      })
    )
  );

// *******************************************************
// *              VRP Output Handler                     *
// *******************************************************

// This function's main  parameter is routingOutput that is returned by the VRPSolver addon
// routingOutput is a N-dimensional array where:
// N = number of vehicles used to solve VRP
// and routingOuput[i] is an M-dimensional array where:
// M = number of locations visited by vehicle {i} + 2 (for start and end locations)

const handleOutput = (
  company_id,
  vehicleIDs,
  orderIDs,
  coordData,
  routingOutput
) =>
  db.transaction(trx =>
    Promise.all([
      updateOrders(trx, orderIDs, vehicleIDs, routingOutput),
      updateRoutes(trx, company_id, vehicleIDs, coordData, routingOutput),
      initReserves(trx, company_id, orderIDs, vehicleIDs, routingOutput)
    ])
      .then(trx.commit)
      .catch(trx.rollback)
  );

module.exports = { handleOutput };
