const jwt = require("jsonwebtoken");

// if user is manager or driver, include company_id in JWT
const generateJWT = (email, username, role, company_id) => {
  if (company_id) {
    return jwt.sign(
      {
        email,
        username,
        role,
        company_id
      },
      process.env.JWT_SECRET
    );
  } else {
    return jwt.sign(
      {
        email,
        username,
        role
      },
      process.env.JWT_SECRET
    );
  }
};

const toAuthJSON = ({ email, username, role, company_id }) => {
  return {
    email,
    token: generateJWT(email, username, role, company_id),
    username,
    role
  };
};

const handleSignin = (db, bcrypt) => (req, res) => {
  const { email, password } = req.body.credentials;

  // TODO: add more checks
  if (!email || !password) {
    return res
      .status(400)
      .json({ errors: { global: "invalid Credentials 3" } });
  }
  db
    .select("*")
    .from("users")
    .where({ email })
    .first()
    .then(data => {
      if (bcrypt.compareSync(password, data.password)) {
        // if manager of driver pass company_id to encode in JWT
        if (data.role === "manager" || data.role === "driver") {
          db
            .select("company_id")
            .from(`${data.role}s`)
            .where({ email })
            .first()
            .then(idData => {
              data.company_id = idData.company_id;
              return res.json({ user: toAuthJSON(data) });
            });
        } else {
          return res.json({ user: toAuthJSON(data) });
        }
      } else {
        // error for invalid password
        res.status(400).json({
          errors: {
            global: "invalid Credentials (invalid password)"
          }
        });
      }
    })
    // error for invalid email
    .catch(err =>
      res.status(400).json({
        errors: {
          global: "invalid Credentials (email does not exist)"
        }
      })
    );
};

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  let token;
  // header form:
  //"Bearer sometokenhere"
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
          email: decoded.email,
          role: decoded.role,
          username: decoded.username
        };
        if (req.user.role === "manager" || req.user.role === "driver") {
          req.user.company_id = decoded.company_id;
        }
        // console.log("user authenticated");
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

const checkAuthorization = authorizedRoles => (req, res, next) => {
  if (authorizedRoles.includes(req.user.role)) {
    // console.log(`user authorized as ${req.user.role}`);
    next();
  } else {
    res.status(403).json({
      errors: {
        global: "Unauthorized user"
      }
    });
  }
};

module.exports = {
  handleSignin,
  toAuthJSON,
  authenticate,
  checkAuthorization
};
