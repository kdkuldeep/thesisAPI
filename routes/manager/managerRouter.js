const router = require("express").Router();

const products = require("./controllers/productController");
const vehicles = require("./controllers/vehicleController");
const drivers = require("./controllers/driverController");
const orders = require("./controllers/orderController");
const routing = require("./controllers/routingController");

const roles = require("../../roles");

// Check user authorization

router.use((req, res, next) => {
  if (req.user.role === roles.MANAGER) {
    // console.log(`user authorized as ${req.user.role}`);
    next();
  } else {
    res.status(403).json({
      errors: {
        global: "Unauthorized user"
      }
    });
  }
});

// Product fetching/managment

router.get("/products", products.fetchProducts);
router.post("/products", products.addProduct);
router.put("/products", products.editProduct);
router.delete("/products/:id", products.deleteProduct);

// Vehicle fetching/management

router.get("/vehicles", vehicles.fetchVehicles);
router.post("/vehicles", vehicles.addVehicle);
router.post("/vehicles/assign", vehicles.assignDriver);
router.put("/vehicles", vehicles.editVehicle);
router.delete("/vehicles/:id", vehicles.deleteVehicle);

// Driver fetching/management

router.post("/drivers", drivers.registerDriver);
router.get("/drivers", drivers.fetchDrivers);
router.put("/drivers", drivers.editDriver);
router.delete("/drivers/:email", drivers.deleteDriver);

// Orders fetching/management

router.get("/orders", orders.fetchOrders);

// Routing related

// router.get("/routes", routing.solve(matrixService));

module.exports = router;
