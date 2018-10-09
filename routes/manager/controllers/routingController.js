const db = require("../../../db/knex");
const ApplicationError = require("../../../errors/ApplicationError");

const { calculateInitialRoutes } = require("../../../vrp_utils/vrpSolvers");
const { recalculateRoutes } = require("../../../vrp_utils/vrpSolvers");

const getOrderDataAfterRouting = company_id =>
  db
    .select("order_id", "vehicle_id", "route_index")
    .from("orders")
    .where({ company_id });

const getVehicleRoutesAfterRouting = company_id =>
  db
    .select("vehicle_id", "route")
    .from("vehicles")
    .where({ company_id })
    .whereNotNull("route");

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
      getVehicleReserve(vehicle_id).then(
        reserve => reserve.length !== 0 && { vehicle_id, reserve }
      )
    );

const calculate = (req, res, next) => {
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
    // *********** TEST **************
    .then(() => recalculateRoutes(company_id))
    .catch(err => {
      console.log(err);
      return next(new ApplicationError(err.message));
    });
};

module.exports = {
  calculate
};
