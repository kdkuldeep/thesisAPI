const router = require("express").Router();

const products = require("./controllers/productController");
const vehicles = require("./controllers/vehicleController");
const drivers = require("./controllers/driverController");
const orders = require("./controllers/orderController");
const routing = require("./controllers/routingController");

const roles = require("../../roles");

const authorizeUser = require("../../middleware/userAuthorization");

const validateRequestBody = require("../../middleware/requestBodyValidation");
const productSchema = require("../../request_schemas/productSchema");
const vehicleSchema = require("../../request_schemas/vehicleSchema");
const newDriverSchema = require("../../request_schemas/newDriverSchema");

router.use(authorizeUser(roles.MANAGER));

// Product fetching/managment

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

// Vehicle fetching/management

router.get("/vehicles", vehicles.fetchVehicles);

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

// Driver fetching/management

router.get("/drivers", drivers.fetchDrivers);

router.post(
  "/drivers",
  validateRequestBody(newDriverSchema),
  drivers.registerDriver
);

// router.put("/drivers", drivers.editDriver);

router.delete("/drivers/:id", drivers.deleteDriver);

// Orders fetching/management

router.get("/orders", orders.fetchOrders);

// Routing related

router.get("/routes", routing.solve);

module.exports = router;
