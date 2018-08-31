const router = require("express").Router();

const roles = require("../../roles");

// Check user authorization

router.use((req, res, next) => {
  if (req.user.role === roles.DRIVER) {
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

module.exports = router;
