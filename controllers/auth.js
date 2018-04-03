const jwt = require("jsonwebtoken");

const generateJWT = (email, username, role) => {
  return jwt.sign(
    {
      email,
      username,
      role
    },
    process.env.JWT_SECRET
  );
};

const toAuthJSON = ({ email, username, role }) => {
  return {
    email,
    token: generateJWT(email, username, role),
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
        return res.json({ user: toAuthJSON(data) });
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
  authenticate
};
