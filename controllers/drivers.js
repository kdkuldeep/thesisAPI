const fetchDrivers = db => (req, res) => {
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

const editDriver = db => (req, res) => {};

const deleteDriver = db => (req, res) => {
  const email = req.params.email;
  const { company_id } = req.user;

  db
    .select("company_id")
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
  fetchDrivers,
  editDriver,
  deleteDriver
};
