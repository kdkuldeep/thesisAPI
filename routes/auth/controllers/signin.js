const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const db = require("../../../db");
const roles = require("../../../roles");

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
  }
  return jwt.sign(
    {
      email,
      username,
      role
    },
    process.env.JWT_SECRET
  );
};

const toAuthJSON = ({ email, username, role, company_id }) => ({
  email,
  token: generateJWT(email, username, role, company_id),
  username,
  role
});

const handleSignin = (req, res) => {
  const { email, password } = req.body.credentials;

  // TODO: add more checks
  if (!email || !password) {
    return res
      .status(400)
      .json({ errors: { global: "invalid Credentials 3" } });
  }
  db.select("*")
    .from("users")
    .where({ email })
    .first()
    .then(data => {
      if (bcrypt.compareSync(password, data.password)) {
        // if manager of driver pass company_id to encode in JWT
        if (data.role === roles.MANAGER || data.role === roles.DRIVER) {
          db.select("company_id")
            .from(data.role === roles.MANAGER ? "managers" : "drivers")
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

module.exports = {
  handleSignin,
  toAuthJSON
};
