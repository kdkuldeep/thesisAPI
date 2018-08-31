const bcrypt = require("bcrypt");

const db = require("../../../db");
const roles = require("../../../roles");

const registerDriver = (req, res) => {
  const { email, username, password, first_name, last_name } = req.body.data;

  const { company_id } = req.user;

  // TODO: add more checks
  if (!email || !username || !password) {
    return res.status(400).json("incorrect form submission");
  }

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
        .then(() => db
            .insert({
              email,
              company_id
            })
            .into("drivers")
            .transacting(trx))
        .then(trx.commit)
        .catch(trx.rollback)
    )
    .then(() =>
      // transaction suceeded, database tables changed
      res.json({ user: { email, username, first_name, last_name } })
    )
    .catch(err =>
      // transanction failed, no database changes
      {
        console.log(err);
        res.status(400).json({ errors: { global: "unable to register" } });
      }
    );
};

const fetchDrivers = (req, res) => {
  const { company_id } = req.user;
  db("drivers")
    .join("users", "drivers.email", "=", "users.email")
    .select(
      "users.email",
      "users.username",
      "users.first_name",
      "users.last_name"
    )
    .where({ company_id })
    .then(data => {
      res.json({ drivers: data });
    })
    .catch(err => console.log(err));
};

const editDriver = (req, res) => {};

const deleteDriver = (req, res) => {
  const { email } = req.params;
  const { company_id } = req.user;

  db.select("company_id")
    .from("drivers")
    .where({ email })
    .first()
    .then(driverData => {
      const driverCompanyId = driverData.company_id;

      if (company_id === driverCompanyId) {
        db("users")
          .where({ email })
          .del()
          .then(() => res.json({ email }))
          .catch(err => {
            res.status(500).json({
              errors: {
                global: "Driver is assigned to vehicle"
              }
            });
          });
      } else {
        res.status(401).json({
          errors: {
            global: "unauthorized access"
          }
        });
      }
    })
    .catch(err => {
      res.status(500).json({
        errors: {
          global: "something went wrong when deleting"
        }
      });
    });
};

module.exports = {
  registerDriver,
  fetchDrivers,
  editDriver,
  deleteDriver
};
