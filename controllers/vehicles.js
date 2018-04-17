const fetchVehicles = db => (req, res) => {
  const { email, company_id } = req.user;
  db
    .select("vehicle_id", "description")
    .from("vehicles")
    .where({ company_id })
    .then(data => res.json({ vehicles: data }));
};

const addVehicle = db => (req, res) => {
  const { description } = req.body.data;
  const { email, company_id } = req.user;

  // TODO: add more checks
  if (!description) {
    return res.status(400).json("incorrect form submission");
  }

  db
    .insert({ description, company_id })
    .into("vehicles")
    .returning("vehicle_id")
    .then(ids => res.json({ vehicle_id: ids[0], description }))
    .catch(err => {
      console.log(err);
      res.status(400).json({
        errors: {
          global: "Already have vehicle with the same description"
        }
      });
    });
};

const editVehicle = db => (req, res) => {
  const { vehicle_id, description } = req.body.data;
  const { email, company_id } = req.user;

  db
    .select("company_id")
    .from("vehicles")
    .where({ vehicle_id })
    .first()
    .then(vehicleData => {
      const vehicleCompanyId = vehicleData.company_id;
      if (company_id === vehicleCompanyId) {
        db("vehicles")
          .where({ vehicle_id })
          .update({ description })
          .then(() => res.json({ vehicle_id, description }))
          .catch(err => {
            res.status(500).json({
              errors: {
                global: "Already have vehicle with the same description"
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
          global: "something went wrong when updating"
        }
      });
    });
};

const deleteVehicle = db => (req, res) => {
  const vehicle_id = req.params.id;

  const { email, company_id } = req.user;

  db
    .select("company_id")
    .from("vehicles")
    .where({ vehicle_id })
    .first()
    .then(vehicleData => {
      const vehicleCompanyId = vehicleData.company_id;
      if (company_id === vehicleCompanyId) {
        db("vehicles")
          .where({ vehicle_id })
          .del()
          .then(() => res.json({ vehicle_id }))
          .catch(err => {
            res.status(500).json({
              errors: {
                global: "Something went wrong. No vehicle exists"
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
  fetchVehicles,
  addVehicle,
  editVehicle,
  deleteVehicle
};
