const { EventEmitter } = require("events");

const driverEventEmitter = new EventEmitter();
const managerEventEmitter = new EventEmitter();

module.exports = {
  driverEventEmitter,
  managerEventEmitter
};
