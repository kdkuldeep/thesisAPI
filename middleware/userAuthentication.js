const jwt = require("jsonwebtoken");
const roles = require("../roles");

const userAuthentication = (req, res, next) => {
  const header = req.headers.authorization;
  let token;
  // header form:
  // "Bearer sometokenhere"
  if (header) token = header.split(" ")[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        res.status(401).json({
          errors: {
            global: " Invalid token. Cannot authenticate user"
          }
        });
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
    res.status(401).json({
      errors: {
        global: " No token provided. Cannot authenticate user"
      }
    });
  }
};

module.exports = userAuthentication;
