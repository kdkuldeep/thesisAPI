const db = require("../../../db/knex");

const ApplicationError = require("../../../errors/ApplicationError");

const fetchVehicles = (req, res, next) => {
  const { company_id } = req.user;
  db.select("vehicle_id", "licence_plate", "capacity", "driver_id", "route")
    .from("vehicles")
    .where({ company_id })
    .then(data => res.json({ vehicles: data }))
    .catch(() => next(new ApplicationError()));
};

const addVehicle = (req, res, next) => {
  const { licence_plate, capacity } = req.validatedData.data;
  const { company_id } = req.user;

  db.insert({ licence_plate, capacity, company_id })
    .into("vehicles")
    .returning(["vehicle_id", "driver_id", "route"])
    .then(data =>
      res.json({
        vehicle_id: data[0].vehicle_id,
        licence_plate,
        capacity,
        driver_id: data[0].driver_id,
        route: data[0].route
      })
    )
    .catch(err => {
      console.log(err);
      return next(
        new ApplicationError(
          "You already have a vehicle with the same licence plate",
          400
        )
      );
    });
};

const editVehicle = (req, res, next) => {
  const { vehicle_id, licence_plate, capacity } = req.validatedData.data;
  const { company_id } = req.user;

  db.select("*")
    .from("vehicles")
    .where({ vehicle_id })
    .first()
    .then(vehicleData => {
      const vehicleCompanyId = vehicleData.company_id;
      const { driver_id, route } = vehicleData;
      if (company_id === vehicleCompanyId) {
        db("vehicles")
          .where({ vehicle_id })
          .update({ licence_plate, capacity })
          .then(() =>
            res.json({ vehicle_id, licence_plate, capacity, driver_id, route })
          )
          .catch(err => {
            console.log(err);
            return next(
              new ApplicationError(
                "Already have vehicle with the same licence plate",
                400
              )
            );
          });
      } else {
        return next(new ApplicationError("Unauthorized access", 403));
      }
    })
    .catch(err => {
      console.log(err);
      return next(new ApplicationError());
    });
};

const deleteVehicle = (req, res, next) => {
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
            console.log(err);
            return next(new ApplicationError());
          });
      } else {
        return next(new ApplicationError("Unauthorized access", 403));
      }
    })
    .catch(err => {
      console.log(err);
      return next(new ApplicationError());
    });
};

const assignDriver = (req, res, next) => {
  const { company_id } = req.user;
  const { driver_id, vehicle_id } = req.validatedData.data;

  db.select("*")
    .from("vehicles")
    .where({ vehicle_id })
    .first()
    .then(vehicleData => {
      const vehicleCompanyId = vehicleData.company_id;
      const { licence_plate, capacity, route } = vehicleData;
      if (company_id === vehicleCompanyId) {
        db("vehicles")
          .where({ vehicle_id })
          .update({ driver_id })
          .then(() =>
            res.json({ vehicle_id, licence_plate, capacity, driver_id, route })
          )
          .catch(err => {
            console.log(err);
            return next(new ApplicationError());
          });
      } else {
        return next(new ApplicationError("Unauthorized access", 403));
      }
    })
    .catch(err => {
      console.log(err);
      return next(new ApplicationError());
    });
};

module.exports = {
  fetchVehicles,
  addVehicle,
  editVehicle,
  deleteVehicle,
  assignDriver
};
