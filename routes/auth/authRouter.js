const router = require("express").Router();

const { handleSignin } = require("./controllers/signin");
const handleRegistration = require("./controllers/register");

router.post("/signin", handleSignin);
router.post("/register/manager", handleRegistration.managerRegistration);
router.post("/register/customer", handleRegistration.customerRegistration);

module.exports = router;
