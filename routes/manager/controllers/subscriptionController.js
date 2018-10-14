const {
  orderEventEmitter,
  routeEventEmitter,
  reserveEventEmitter
} = require("../../../EventEmitters");

const { fetchOrders } = require("./orderController");
const { fetchRoutes } = require("./vehicleController");
const { fetchReserves } = require("./vehicleController");

const subscribeToOrders = (req, res, next) => {
  const { company_id } = req.user;

  orderEventEmitter.once(`newOrder_${company_id}`, () =>
    fetchOrders(req, res, next)
  );
};

const subscribeToRoutes = (req, res, next) => {
  const { company_id } = req.user;

  routeEventEmitter.once(`newRoutes_${company_id}`, () =>
    fetchRoutes(req, res, next)
  );
};

const subscribeToReserves = (req, res, next) => {
  const { company_id } = req.user;

  reserveEventEmitter.once(`newReserves_${company_id}`, () =>
    fetchReserves(req, res, next)
  );
};

module.exports = { subscribeToOrders, subscribeToRoutes, subscribeToReserves };
