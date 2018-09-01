const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const db = require("../../../db/knex");
const roles = require("../../../roles");

// if user is manager or driver, include company_id in JWT
const generateJWT = (user_id, email, username, role, company_id) => {
  if (company_id) {
    return jwt.sign(
      {
        user_id,
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
      user_id,
      email,
      username,
      role
    },
    process.env.JWT_SECRET
  );
};

const toAuthJSON = ({ user_id, email, username, role, company_id }) => ({
  email,
  token: generateJWT(user_id, email, username, role, company_id),
  username,
  role
});

const handleSignin = (req, res) => {
  const { email, password } = req.validatedData.credentials;

  db.select("*")
    .from("users")
    .where({ email })
    .first()
    .then(userData => {
      const userRole = parseInt(userData.role, 10);

      if (bcrypt.compareSync(password, userData.password)) {
        // if manager of driver pass company_id to encode in JWT
        if (userRole === roles.MANAGER || userRole === roles.DRIVER) {
          db.select("company_id")
            .from(userRole === roles.MANAGER ? "managers" : "drivers")
            .where("user_id", userData.user_id)
            .first()
            .then(({ company_id }) =>
              res.json({
                user: toAuthJSON({ ...userData, company_id, role: userRole })
              })
            );
        } else {
          return res.json({
            user: toAuthJSON({ ...userData, role: userRole })
          });
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
