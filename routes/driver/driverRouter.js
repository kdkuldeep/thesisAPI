const router = require("express").Router();

const subscriptions = require("./controllers/subscriptionController");
const driver = require("./controllers/driverDataController");

const roles = require("../../roles");

const authorizeUser = require("../../middleware/userAuthorization");

router.use(authorizeUser(roles.DRIVER));

router.get("/vehicle", driver.fetchVehicle);
router.get("/vehicle/route", driver.fetchRoute);
router.get("/vehicle/reserve", driver.fetchReserve);
router.get("/vehicle/orders", driver.fetchOrders);
router.get("/shipping", driver.fetchShippingState);

router.get("/vehicle/subscribe", subscriptions.subscribeToVehicle);
router.get("/vehicle/route/subscribe", subscriptions.subscribeToRoute);
router.get("/vehicle/reserve/subscribe", subscriptions.subscribeToReserve);
router.get("/vehicle/orders/subscribe", subscriptions.subscribeToOrders);
router.get("/shipping/subscribe", subscriptions.subscribeToShippingState);

module.exports = router;
