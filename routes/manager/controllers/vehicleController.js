const db = require("../../../db/knex");

const { driverEventEmitter } = require("../../../EventEmitters");

const ApplicationError = require("../../../errors/ApplicationError");

const getVehicleReserve = vehicle_id =>
  db
    .select("products.product_id", "name", "quantity", "min_quantity")
    .from("products")
    .innerJoin("reserves", "products.product_id", "reserves.product_id")
    .where({ vehicle_id });

const fetchVehicles = (req, res, next) => {
  const { company_id } = req.user;
  db.select("vehicle_id", "licence_plate", "capacity", "driver_id")
    .from("vehicles")
    .where({ company_id })
    .then(data => res.json({ vehicles: data }))
    .catch(() => next(new ApplicationError()));
};

const fetchReserves = (req, res, next) => {
  const { company_id } = req.user;
  db.table("vehicles")
    .pluck("vehicle_id")
    .where({ company_id })
    .map(vehicle_id =>
      getVehicleReserve(vehicle_id).then(
        reserve => reserve.length !== 0 && { vehicle_id, reserve }
      )
    )
    .then(data => res.json({ reserves: data }))
    .catch(() => next(new ApplicationError()));
};

const fetchRoutes = (req, res, next) => {
  const { company_id } = req.user;
  db.select("vehicle_id", "route_polyline")
    .from("vehicles")
    .where({ company_id })
    .whereNotNull("route_polyline")
    .then(data => res.json({ routes: data }))
    .catch(() => next(new ApplicationError()));
};

const getReservesTotalVolume = reserve =>
  Promise.all(
    reserve.map(product =>
      db("products")
        .where({ product_id: product.product_id })
        .first()
        .then(({ volume }) => volume * product.quantity)
    )
  ).then(volumes => volumes.reduce((a, b) => a + b));

const editReserve = (req, res, next) => {
  const vehicle_id = req.params.id;
  const { company_id } = req.user;
  const newReserve = req.validatedData.data;

  db.select("*")
    .from("vehicles")
    .where({ vehicle_id })
    .first()
    .then(vehicleData => {
      if (vehicleData.company_id !== company_id)
        return next(new ApplicationError("Unauthorized access", 403));
      return vehicleData.capacity;
    })
    .then(capacity =>
      Promise.all([capacity, getReservesTotalVolume(newReserve)])
    )
    .then(([capacity, volume]) => {
      if (capacity < volume)
        return next(
          new ApplicationError("Reserve exceeds vehicle capacity", 400)
        );

      return db.transaction(trx =>
        Promise.all(
          newReserve.map(product =>
            db("reserves")
              .where({ vehicle_id, product_id: product.product_id })
              .first()
              .then(previousReserve => {
                // if product not in reserve, add with check (quantity > 0)
                if (!previousReserve) {
                  if (product.quantity > 0)
                    return db
                      .insert({
                        vehicle_id,
                        product_id: product.product_id,
                        quantity: product.quantity,
                        min_quantity: 0
                      })
                      .into("reserves")
                      .transacting(trx);
                  return;
                }

                // if product already in reserve, update with checks
                if (previousReserve.min_quantity <= product.quantity) {
                  if (product.quantity === 0)
                    return db("reserves")
                      .where({ vehicle_id, product_id: product.product_id })
                      .del()
                      .transacting(trx);
                  return db("reserves")
                    .where({ vehicle_id, product_id: product.product_id })
                    .update({ quantity: product.quantity })
                    .transacting(trx);
                }

                return next(
                  new ApplicationError(
                    "Unable to edit reserve. Product quantity cannot be lower than min_quantity",
                    400
                  )
                );
              })
          )
        )
          .then(trx.commit)
          .catch(trx.rollback)
      );
    })
    .then(() => getVehicleReserve(vehicle_id))
    .then(reserve => {
      driverEventEmitter.emit(`newReserves_${company_id}`);
      return res.json({ vehicle_id, reserve });
    })
    .catch(err => {
      console.log(err);
      next(new ApplicationError());
    });
};

const addVehicle = (req, res, next) => {
  const { licence_plate, capacity } = req.validatedData.data;
  const { company_id } = req.user;

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
      if (vehicleData.company_id !== company_id)
        return next(new ApplicationError("Unauthorized access", 403));
      const { driver_id } = vehicleData;

      db("vehicles")
        .where({ vehicle_id })
        .update({ licence_plate, capacity })
        .then(() => {
          driverEventEmitter.emit(`newVehicle_${driver_id}`);
          return res.json({ vehicle_id, licence_plate, capacity, driver_id });
        })
        .catch(err => {
          console.log(err);
          return next(
            new ApplicationError(
              "Already have vehicle with the same licence plate",
              400
            )
          );
        });
    })
    .catch(err => {
      console.log(err);
      return next(new ApplicationError());
    });
};

const deleteVehicle = (req, res, next) => {
  const vehicle_id = req.params.id;

  const { company_id } = req.user;

  db.select("company_id", "driver_id")
    .from("vehicles")
    .where({ vehicle_id })
    .first()
    .then(vehicleData => {
      if (vehicleData.company_id !== company_id)
        return next(new ApplicationError("Unauthorized access", 403));
      db("vehicles")
        .where({ vehicle_id })
        .del()
        .then(() => {
          driverEventEmitter.emit(`newVehicle_${vehicleData.driver_id}`);
          return res.json({ vehicle_id });
        })
        .catch(err => {
          console.log(err);
          return next(new ApplicationError());
        });
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
      if (vehicleData.company_id !== company_id)
        return next(new ApplicationError("Unauthorized access", 403));
      const { licence_plate, capacity } = vehicleData;

      db("vehicles")
        .where({ vehicle_id })
        .update({ driver_id })
        .then(() => {
          driverEventEmitter.emit(`newVehicle_${driver_id}`);
          return res.json({ vehicle_id, licence_plate, capacity, driver_id });
        })
        .catch(err => {
          console.log(err);
          return next(new ApplicationError());
        });
    })
    .catch(err => {
      console.log(err);
      return next(new ApplicationError());
    });
};

module.exports = {
  fetchVehicles,
  fetchReserves,
  fetchRoutes,
  editReserve,
  addVehicle,
  editVehicle,
  deleteVehicle,
  assignDriver
};
