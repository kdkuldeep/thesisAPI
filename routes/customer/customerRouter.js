const router = require("express").Router();

const products = require("./controllers/productController");
const orders = require("./controllers/orderController");

const roles = require("../../roles");

const authorizeUser = require("../../middleware/userAuthorization");

const validateRequestBody = require("../../middleware/requestBodyValidation");
const newOrderSchema = require("../../request_schemas/newOrderSchema");

const { onNewOrderConditionalReroute } = require("../../vrp_utils/vrpSolvers");

router.use(authorizeUser(roles.CUSTOMER));

// Product fetching/managment

router.get("/products", products.fetchProducts);
router.get("/options", products.fetchOptions);

// Orders fetching/management

router.get("/orders", orders.fetchOrders);

router.post(
  "/orders",
  validateRequestBody(newOrderSchema),
  orders.addOrder,
  // after addOrder middleware, new orders' company IDs are available in res.locals.companies array
  // pass the companies array to the function responsible for routing
  // using process.nextTick to end request-response licecycle first (?)
  (req, res) =>
    process.nextTick(() => {
      onNewOrderConditionalReroute(res.locals.companies);
    })
);
module.exports = router;
