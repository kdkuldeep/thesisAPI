const router = require("express").Router();

const { handleSignin } = require("./controllers/signin");
const handleRegistration = require("./controllers/register");

const validateRequestBody = require("../../middleware/requestBodyValidation");

const signinCredentialsSchema = require("../../request_schemas/signinCredentialsSchema");
const newCustomerSchema = require("../../request_schemas/newCustomerSchema");
const newManagerSchema = require("../../request_schemas/newManagerSchema");

router.post(
  "/signin",
  validateRequestBody(signinCredentialsSchema),
  handleSignin
);
router.post(
  "/register/manager",
  validateRequestBody(newManagerSchema),
  handleRegistration.managerRegistration
);
router.post(
  "/register/customer",
  validateRequestBody(newCustomerSchema),
  handleRegistration.customerRegistration
);

module.exports = router;
