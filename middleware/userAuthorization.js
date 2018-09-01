const userAuthorization = role => (req, res, next) => {
  if (req.user.role === role) {
    console.log(`user authorized (${role})`);
    next();
  } else {
    res.status(403).json({
      errors: {
        global: "Unauthorized user"
      }
    });
  }
};

module.exports = userAuthorization;
