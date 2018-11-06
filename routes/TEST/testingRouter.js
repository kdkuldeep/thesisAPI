const router = require("express").Router();
const roles = require("../../roles");
const authorizeUser = require("../../middleware/userAuthorization");

const db = require("../../db/knex");
const ApplicationError = require("../../errors/ApplicationError");

const { driverEventEmitter } = require("../../EventEmitters");

const clearOrderRouting = (trx, company_id) =>
  db("orders")
    .where({ company_id })
    .update({ vehicle_id: null, route_index: null, eta: null })
    .transacting(trx);

const clearRoutes = (trx, company_id) =>
  db("vehicles")
    .where({ company_id })
    .update({ route_polyline: null })
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

const setShippingToFalse = (trx, company_id) =>
  db("companies")
    .where({ company_id })
    .update({ shipping_initialized: false });

const reset = (req, res, next) => {
  const { company_id } = req.user;

  db.transaction(trx =>
    Promise.all([
      clearOrderRouting(trx, company_id),
      clearReserves(trx, company_id),
      clearRoutes(trx, company_id),
      setShippingToFalse(trx, company_id)
    ])
      .then(trx.commit)
      .catch(trx.rollback)
  )
    .then(() => {
      driverEventEmitter.emit(`newOrders_${company_id}`);
      driverEventEmitter.emit(`newRoutes_${company_id}`);
      driverEventEmitter.emit(`newReserves_${company_id}`);
      driverEventEmitter.emit(`newShippingState_${company_id}`);
      return res.json({});
    })
    .catch(err => {
      console.log(err);
      return next(new ApplicationError("Cannot clear routing data"));
    });
};

// TESTING ENDPOINTS
router.delete("/reset_routing", authorizeUser(roles.MANAGER), reset);

module.exports = router;
