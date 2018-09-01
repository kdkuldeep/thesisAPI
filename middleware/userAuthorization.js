const ApplicationError = require("../errors/ApplicationError");

const userAuthorization = role => (req, res, next) => {
  if (req.user.role === role) {
    // console.log(`user authorized (${role})`);
    next();
  } else {
    next(new ApplicationError("Unauthorized user", 403));
  }
};

module.exports = userAuthorization;
