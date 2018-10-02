const groupBy = require("lodash/groupBy");

const db = require("../../../db/knex");
const ApplicationError = require("../../../errors/ApplicationError");

const { matrixService, directionsService } = require("../../../mapboxServices");

const VRPSolver = require("../../../build/Release/VRPSolver.node");

const { TEST_MATRIX } = require("./TEST_MATRIX");
// https://www.mapbox.com/api-documentation/?language=JavaScript#retrieve-a-matrix

// https://www.mapbox.com/api-documentation/pages/traffic-countries.html

// TODO:
// - Make multiple calls to matrix service if point count > 25 and update data accordingly

const getVehicleData = company_id =>
  db
    .table("vehicles")
    .where({ company_id })
    .whereNot("driver_id", null)
    .orderBy("vehicle_id");

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
// This array is used as input to the Mapbox APIs

const getAllCoords = (company_id, orderData) =>
  Promise.all([getDepotCoords(company_id), getCustomerCoords(orderData)]).then(
    ([depotCoords, customerCoords]) => [depotCoords, ...customerCoords]
  );

const getDurationMatrix = (company_id, orderData) =>
  getAllCoords(company_id, orderData).then(points =>
    matrixService
      .getMatrix({ points, profile: "driving" })
      .send()
      .then(response => response.body.durations)
  );

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

const getOrderDataAfterRouting = company_id =>
  db
    .select("order_id", "vehicle_id", "route_index")
    .from("orders")
    .where({ company_id });

const getVehicleRoutesAfterRouting = company_id =>
  db
    .select("vehicle_id", "route")
    .from("vehicles")
    .where({ company_id });

const getVehicleReserve = vehicle_id =>
  db
    .select("products.product_id", "name", "quantity", "min_quantity")
    .from("products")
    .innerJoin("reserves", "products.product_id", "reserves.product_id")
    .where({ vehicle_id });

const getReserveDataAfterRouting = company_id =>
  db
    .table("vehicles")
    .pluck("vehicle_id")
    .where({ company_id })
    .map(vehicle_id =>
      getVehicleReserve(vehicle_id).then(reserve => ({ vehicle_id, reserve }))
    );

const solve = (req, res, next) => {
  const { company_id } = req.user;
  getOrderData(company_id)
    .then(orderData =>
      Promise.all([
        getOrderData(company_id).pluck("order_id"),
        getVehicleData(company_id).pluck("vehicle_id"),
        getAllCoords(company_id, orderData),
        getVehicleData(company_id).pluck("capacity"),
        getOrderVolumes(orderData),
        getDemands(company_id, orderData),
        // getDurationMatrix(company_id, orderData)
        TEST_MATRIX
      ])
    )
    .then(
      ([
        orderIDs,
        vehicleIDs,
        coords,
        capacities,
        volumes,
        demands,
        durations
      ]) => {
        console.log("\nOrder IDs");
        console.log(orderIDs);
        console.log("\nVehicle IDs");
        console.log(vehicleIDs);
        console.log("\nCoordinates");
        console.log(coords);
        console.log("\nVehicle capacities");
        console.log(capacities);
        console.log("\nOrder volumes");
        console.log(volumes);
        console.log("\nProduct demands");
        console.log(demands);
        // console.log("\nDuration matrix");
        // console.log(durations);
        return Promise.all([
          orderIDs,
          vehicleIDs,
          coords,
          VRPSolver.solve(capacities, volumes, demands, durations)
        ]);
      }
    )
    .then(([orderIDs, vehicleIDs, coords, routes]) =>
      db.transaction(trx =>
        Promise.all([
          updateOrders(trx, orderIDs, vehicleIDs, routes),
          updateRoutes(trx, company_id, vehicleIDs, coords, routes),
          initReserves(trx, company_id, orderIDs, vehicleIDs, routes)
        ])
          .then(trx.commit)
          .catch(trx.rollback)
      )
    )
    .then(() =>
      Promise.all([
        getOrderDataAfterRouting(company_id),
        getVehicleRoutesAfterRouting(company_id),
        getReserveDataAfterRouting(company_id)
      ])
    )
    .then(([orders, routes, reserves]) =>
      res.json({ orders, routes, reserves })
    )
    .catch(err => {
      console.log(err);
      return next(new ApplicationError());
    });
};

const reset = (req, res, next) => {
  const { company_id } = req.user;

  db.transaction(trx =>
    Promise.all([
      clearOrderRouting(trx, company_id),
      clearReserves(trx, company_id),
      clearRoutes(trx, company_id)
    ])
      .then(trx.commit)
      .catch(trx.rollback)
  )
    .then(() => res.json({}))
    .catch(err => {
      console.log(err);
      return next(new ApplicationError("Cannot clear routing data"));
    });
};

module.exports = {
  solve,
  reset
};
