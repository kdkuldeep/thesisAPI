const { driverEventEmitter } = require("../../../EventEmitters");

const {
  fetchVehicle,
  fetchRoute,
  fetchReserve,
  fetchOrders,
  fetchShippingState
} = require("./driverDataController");

const subscribeToVehicle = (req, res, next) => {
  const { user_id } = req.user;

  driverEventEmitter.once(`newVehicle_${user_id}`, () =>
    fetchVehicle(req, res, next)
  );
};

const subscribeToRoute = (req, res, next) => {
  const { company_id } = req.user;

  driverEventEmitter.once(`newRoutes_${company_id}`, () =>
    fetchRoute(req, res, next)
  );
};

const subscribeToReserve = (req, res, next) => {
  const { company_id } = req.user;

  driverEventEmitter.once(`newReserves_${company_id}`, () =>
    fetchReserve(req, res, next)
  );
};

const subscribeToOrders = (req, res, next) => {
  const { company_id } = req.user;

  driverEventEmitter.once(`newOrders_${company_id}`, () =>
    fetchOrders(req, res, next)
  );
};

const subscribeToShippingState = (req, res, next) => {
  const { company_id } = req.user;

  driverEventEmitter.once(`newShippingState_${company_id}`, () =>
    fetchShippingState(req, res, next)
  );
};

module.exports = {
  subscribeToVehicle,
  subscribeToRoute,
  subscribeToReserve,
  subscribeToOrders,
  subscribeToShippingState
};
