const { EventEmitter } = require("events");

const orderEventEmitter = new EventEmitter();
const routeEventEmitter = new EventEmitter();
const reserveEventEmitter = new EventEmitter();

module.exports = { orderEventEmitter, routeEventEmitter, reserveEventEmitter };
