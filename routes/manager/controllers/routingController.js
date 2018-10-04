const db = require("../../../db/knex");
const ApplicationError = require("../../../errors/ApplicationError");

const { calculateInitialRoutes } = require("../../../vrp_utils/vrpSolvers");

const clearOrderRouting = (trx, company_id) =>
  db("orders")
    .where({ company_id })
    .update({ vehicle_id: null, route_index: null, eta: null })
    .transacting(trx);

const clearRoutes = (trx, company_id) =>
  db("vehicles")
    .where({ company_id })
    .update({ route: null })
    .transacting(trx);

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
  calculateInitialRoutes(company_id)
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
      return next(new ApplicationError(err.message));
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
