const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const db = require("../../../db/knex");
const roles = require("../../../roles");

const ApplicationError = require("../../../errors/ApplicationError");

// if user is manager or driver, include company_id in JWT
const generateJWT = (
  user_id,
  email,
  username,
  role,
  company_id,
  coordinates
) => {
  if (company_id) {
    return jwt.sign(
      {
        user_id,
        email,
        username,
        role,
        company_id,
        coordinates
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

const toAuthJSON = ({
  user_id,
  email,
  username,
  role,
  company_id,
  coordinates
}) => ({
  email,
  token: generateJWT(user_id, email, username, role, company_id, coordinates),
  username,
  role,
  coordinates
});

const handleSignin = (req, res, next) => {
  const { email, password } = req.validatedData.credentials;

  db.select("*")
    .from("users")
    .where({ email })
    .first()
    .then(userData => {
      const userRole = parseInt(userData.role, 10);
      const { user_id } = userData;
      if (bcrypt.compareSync(password, userData.password)) {
        // if manager of driver pass company_id to encode in JWT
        if (userRole === roles.MANAGER || userRole === roles.DRIVER) {
          db.select("company_id")
            .from(userRole === roles.MANAGER ? "managers" : "drivers")
            .where({ user_id })
            .first()
            .then(({ company_id }) =>
              db
                .select("latitude", "longitude")
                .from("companies")
                .where({ company_id })
                .first()
                .then(coordinates =>
                  res.json({
                    user: toAuthJSON({
                      ...userData,
                      company_id,
                      role: userRole,
                      coordinates
                    })
                  })
                )
            );
        } else {
          db.select("latitude", "longitude")
            .from("customers")
            .where({ user_id })
            .then(coordinates =>
              res.json({
                user: toAuthJSON({ ...userData, role: userRole, coordinates })
              })
            );
        }
      } else {
        // error for invalid password
        return next(new ApplicationError("invalid Credentials", 400));
      }
    })
    // error for invalid email
    .catch(err => {
      console.log(err);
      return next(new ApplicationError("invalid Credentials", 400));
    });
};

module.exports = {
  handleSignin,
  toAuthJSON
};
