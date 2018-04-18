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

const deleteDriver = db => (req, res) => {};

module.exports = {
  fetchDrivers,
  editDriver,
  deleteDriver
};
