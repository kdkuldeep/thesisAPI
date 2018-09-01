const router = require("express").Router();

const roles = require("../../roles");

const authorizeUser = require("../../middleware/userAuthorization");

router.use(authorizeUser(roles.DRIVER));

module.exports = router;
