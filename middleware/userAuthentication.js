const jwt = require("jsonwebtoken");

const roles = require("../roles");
const ApplicationError = require("../errors/ApplicationError");

const userAuthentication = (req, res, next) => {
  const header = req.headers.authorization;
  let token;
  // header form:
  // "Bearer sometokenhere"
  if (header) [, token] = header.split(" "); // token = header.split(" ")[1];  (prefer-destructuring eslint rule)

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        next(
          new ApplicationError("Invalid token. Cannot authenticate user", 401)
        );
      } else {
        req.user = {
          user_id: decoded.user_id,
          email: decoded.email,
          role: decoded.role,
          username: decoded.username
        };

        // FIXME: Find company_id in db not from jwt (or maybe it is safe??)
        if (req.user.role === roles.MANAGER || req.user.role === roles.DRIVER) {
          req.user.company_id = decoded.company_id;
        }
        next();
      }
    });
  } else {
    next(
      new ApplicationError("No token provided. Cannot authenticate user", 401)
    );
  }
};

module.exports = userAuthentication;
