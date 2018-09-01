const bcrypt = require("bcrypt");

const db = require("../../../db/knex");
const roles = require("../../../roles");

const ApplicationError = require("../../../errors/ApplicationError");

const registerDriver = (req, res, next) => {
  const {
    email,
    username,
    password,
    first_name,
    last_name
  } = req.validatedData.data;

  const { company_id } = req.user;

  return db
    .transaction(trx =>
      db
        .insert({
          email,
          username,
          password: bcrypt.hashSync(password, 10),
          first_name,
          last_name,
          role: roles.DRIVER
        })
        .into("users")
        .transacting(trx)
        .returning("user_id")
        .then(userData =>
          db
            .insert({
              user_id: userData[0],
              company_id
            })
            .into("drivers")
            .transacting(trx)
            .returning("user_id")
        )
        .then(trx.commit)
        .catch(trx.rollback)
    )
    .then(driverData =>
      // transaction suceeded, database tables changed
      res.json({
        user: {
          driver_id: driverData[0],
          email,
          username,
          first_name,
          last_name
        }
      })
    )
    .catch(err =>
      // transanction failed, no database changes
      {
        // TODO: parse err to send better message to client
        console.log(err);
        next(new ApplicationError("Email/username already exists"));
      }
    );
};

const fetchDrivers = (req, res, next) => {
  const { company_id } = req.user;
  db("drivers")
    .join("users", "drivers.user_id", "=", "users.user_id")
    .select(
      "users.user_id as driver_id",
      "users.email",
      "users.username",
      "users.first_name",
      "users.last_name"
    )
    .where({ company_id })
    .then(data => {
      res.json({ drivers: data });
    })
    .catch(err => {
      console.log(err);
      next(new ApplicationError("Cannot fetch drivers"));
    });
};

// const editDriver = (req, res, next) => {};

const deleteDriver = (req, res, next) => {
  const driver_id = req.params.id;
  const { company_id } = req.user;

  db.select("company_id")
    .from("drivers")
    .where("user_id", driver_id)
    .first()
    .then(driverData => {
      const driverCompanyId = driverData.company_id;

      if (company_id === driverCompanyId) {
        db("users")
          .where("user_id", driver_id)
          .del()
          .then(() => res.json({ driver_id }))
          .catch(err => {
            console.log(err);
            next(new ApplicationError("Driver is assigned to vehicle", 400));
          });
      } else {
        next(new ApplicationError("Unauthorized access", 403));
      }
    })
    .catch(err => {
      console.log(err);
      next(new ApplicationError());
    });
};

module.exports = {
  registerDriver,
  fetchDrivers,
  // editDriver,
  deleteDriver
};
