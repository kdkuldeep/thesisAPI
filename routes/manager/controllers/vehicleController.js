const db = require("../../../db/knex");

const fetchVehicles = (req, res) => {
  const { company_id } = req.user;
  db.select("vehicle_id", "licence_plate", "capacity", "driver_id")
    .from("vehicles")
    .where({ company_id })
    .then(data => res.json({ vehicles: data }));
};

const addVehicle = (req, res) => {
  const { licence_plate, capacity } = req.body.data;
  const { company_id } = req.user;

  // TODO: add more checks
  if (!licence_plate || !capacity) {
    return res.status(400).json("incorrect form submission");
  }

  db.insert({ licence_plate, capacity, company_id })
    .into("vehicles")
    .returning(["vehicle_id", "driver_id"])
    .then(data =>
      res.json({
        vehicle_id: data[0].vehicle_id,
        licence_plate,
        capacity,
        driver_id: data[0].driver_id
      })
    )
    .catch(err => {
      console.log(err);
      res.status(400).json({
        errors: {
          global: "Already have vehicle with the same description"
        }
      });
    });
};

const editVehicle = (req, res) => {
  const { vehicle_id, licence_plate, capacity } = req.body.data;
  const { company_id } = req.user;

  db.select("*")
    .from("vehicles")
    .where({ vehicle_id })
    .first()
    .then(vehicleData => {
      const vehicleCompanyId = vehicleData.company_id;
      const { driver_id } = vehicleData;
      if (company_id === vehicleCompanyId) {
        db("vehicles")
          .where({ vehicle_id })
          .update({ licence_plate, capacity })
          .then(() =>
            res.json({ vehicle_id, licence_plate, capacity, driver_id })
          )
          .catch(err => {
            res.status(500).json({
              errors: {
                global: "Already have vehicle with the same licence plate"
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

const deleteVehicle = (req, res) => {
  const vehicle_id = req.params.id;

  const { company_id } = req.user;

  db.select("company_id")
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

const assignDriver = (req, res) => {
  const { company_id } = req.user;
  const { driver_id, vehicle_id } = req.body.data;

  db.select("*")
    .from("vehicles")
    .where({ vehicle_id })
    .first()
    .then(vehicleData => {
      const vehicleCompanyId = vehicleData.company_id;
      const { licence_plate } = vehicleData;
      if (company_id === vehicleCompanyId) {
        db("vehicles")
          .where({ vehicle_id })
          .update({ driver_id })
          .then(() => res.json({ vehicle_id, licence_plate, driver_id }))
          .catch(err => {
            res.status(500).json({
              errors: {
                global: "Already have vehicle with the same driver"
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

module.exports = {
  fetchVehicles,
  addVehicle,
  editVehicle,
  deleteVehicle,
  assignDriver
};
