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
const reserveSchema = require("../../request_schemas/reserveSchema");

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

router.get("/vrp", routing.solve);

router.delete("/vrp", routing.reset);

module.exports = router;
