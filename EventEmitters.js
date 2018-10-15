const { EventEmitter } = require("events");

const orderEventEmitter = new EventEmitter();
const routeEventEmitter = new EventEmitter();
const reserveEventEmitter = new EventEmitter();
const vehicleEventEmitter = new EventEmitter();
const shippingStateEventEmitter = new EventEmitter();

module.exports = {
  orderEventEmitter,
  routeEventEmitter,
  reserveEventEmitter,
  vehicleEventEmitter,
  shippingStateEventEmitter
};
