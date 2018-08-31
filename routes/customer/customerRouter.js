const router = require("express").Router();

const products = require("./controllers/productController");
const orders = require("./controllers/orderController");

const roles = require("../../roles");

// Check user authorization

router.use((req, res, next) => {
  if (req.user.role === roles.CUSTOMER) {
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
router.get("/options", products.fetchOptions);

// Orders fetching/management

router.get("/orders", orders.fetchOrders);
router.post("/orders", orders.addOrder);

module.exports = router;
