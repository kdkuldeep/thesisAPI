const router = require("express").Router();

const products = require("./controllers/productController");
const orders = require("./controllers/orderController");

const roles = require("../../roles");

const authorizeUser = require("../../middleware/userAuthorization");

const validateRequestBody = require("../../middleware/requestBodyValidation");
const newOrderSchema = require("../../request_schemas/newOrderSchema");

router.use(authorizeUser(roles.CUSTOMER));

// Product fetching/managment

router.get("/products", products.fetchProducts);
router.get("/options", products.fetchOptions);

// Orders fetching/management

router.get("/orders", orders.fetchOrders);
router.post("/orders", validateRequestBody(newOrderSchema), orders.addOrder);

module.exports = router;
