const groupBy = require("lodash/groupBy");
const db = require("../db/knex");
const { directionsService } = require("../mapboxServices");

const clearOrderRouting = (trx, company_id) =>
  db("orders")
    .where({ company_id })
    .update({ vehicle_id: null, route_index: null, eta: null });

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
        routeOrders.map((order_id, orderIndex) =>
          db("orders")
            .where({ order_id })
            .update({
              vehicle_id: vehicleIDs[vehicleIndex],
              route_index: orderIndex + 1
            })
            .transacting(trx)
        )
      );
    })
  );

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

const handleOutput = (
  company_id,
  vehicleIDs,
  orderIDs,
  coordData,
  routingData
) =>
  db.transaction(trx =>
    Promise.all([
      updateOrders(trx, orderIDs, vehicleIDs, routingData),
      updateRoutes(trx, company_id, vehicleIDs, coordData, routingData),
      initReserves(trx, company_id, orderIDs, vehicleIDs, routingData)
    ])
      .then(trx.commit)
      .catch(trx.rollback)
  );

module.exports = { handleOutput };
