const router = require("express").Router();

const products = require("./controllers/productController");
const vehicles = require("./controllers/vehicleController");
const drivers = require("./controllers/driverController");
const orders = require("./controllers/orderController");
const vehicleRoutes = require("./controllers/routingController");
const shipping = require("./controllers/shippingController");
const subscriptions = require("./controllers/subscriptionController");

const roles = require("../../roles");

const authorizeUser = require("../../middleware/userAuthorization");

const validateRequestBody = require("../../middleware/requestBodyValidation");
const productSchema = require("../../request_schemas/productSchema");
const vehicleSchema = require("../../request_schemas/vehicleSchema");
const newDriverSchema = require("../../request_schemas/newDriverSchema");
const reserveSchema = require("../../request_schemas/reserveSchema");
const shippingStateSchema = require("../../request_schemas/shippingStateSchema");

// Use authorization middleware for MANAGER role
router.use(authorizeUser(roles.MANAGER));

// ********************************
// *      Product Management      *
// ********************************
router.get("/products", products.fetchProducts);

router.post(
  "/products",
  validateRequestBody(productSchema.create),
  products.addProduct
);

router.put(
  "/products",
  validateRequestBody(productSchema.update),
  products.editProduct
);

router.delete("/products/:id", products.deleteProduct);

// ********************************
// *      Vehicle Management      *
// ********************************

router.get("/vehicles", vehicles.fetchVehicles);

router.get("/vehicles/reserves", vehicles.fetchReserves);

router.get("/vehicles/routes", vehicles.fetchRoutes);

router.put(
  "/reserves/:id",
  validateRequestBody(reserveSchema),
  vehicles.editReserve
);

router.post(
  "/vehicles",
  validateRequestBody(vehicleSchema.create),
  vehicles.addVehicle
);

router.put(
  "/vehicles",
  validateRequestBody(vehicleSchema.update),
  vehicles.editVehicle
);

router.post(
  "/vehicles/assign",
  validateRequestBody(vehicleSchema.assign),
  vehicles.assignDriver
);

router.delete("/vehicles/:id", vehicles.deleteVehicle);

// ********************************
// *        Driver Management     *
// ********************************

router.get("/drivers", drivers.fetchDrivers);

router.post(
  "/drivers",
  validateRequestBody(newDriverSchema),
  drivers.registerDriver
);

router.delete("/drivers/:id", drivers.deleteDriver);

// ********************************
// *      Order Management        *
// ********************************
router.get("/orders", orders.fetchOrders);

// ********************************
// *        VRP Management        *
// ********************************
router.get("/routes", vehicleRoutes.calculate);

// *********************************
// *   Shipping State Management   *
// *********************************
router.get("/shipping", shipping.fetchState);
router.put(
  "/shipping",
  validateRequestBody(shippingStateSchema),
  shipping.setState
);

router.get("/orders/subscribe", subscriptions.subscribeToOrders);
router.get("/vehicles/routes/subscribe", subscriptions.subscribeToRoutes);
router.get("/vehicles/reserves/subscribe", subscriptions.subscribeToReserves);

module.exports = router;
