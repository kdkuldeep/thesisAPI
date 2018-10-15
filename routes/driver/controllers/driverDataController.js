const db = require("../../../db/knex");

const ApplicationError = require("../../../errors/ApplicationError");

const fetchVehicle = (req, res, next) => {
  const { company_id, user_id } = req.user;

  db.select()
    .from("vehicles")
    .where({ company_id, driver_id: user_id })
    .first()
    .then(data => res.json({ vehicle: data }))
    .catch(err => next(new ApplicationError(err.message)));
};

const fetchRoute = (req, res, next) => {
  const { company_id, user_id } = req.user;
  db.table("vehicles")
    .pluck("vehicle_id")
    .where({ company_id, driver_id: user_id })
    .then(ids => {
      if (ids.length === 0) res.json({ route: {} });
      return ids[0];
    })
    .then(vehicle_id =>
      db
        .select("vehicle_id", "route_polyline")
        .from("vehicles")
        .where({ vehicle_id })
        .first()
    )
    .then(route => res.json({ route }))
    .catch(err => next(new ApplicationError(err.message)));
};

const getVehicleReserve = vehicle_id =>
  db
    .select("products.product_id", "name", "quantity", "min_quantity")
    .from("products")
    .innerJoin("reserves", "products.product_id", "reserves.product_id")
    .where({ vehicle_id });

const fetchReserve = (req, res, next) => {
  const { company_id, user_id } = req.user;
  db.table("vehicles")
    .pluck("vehicle_id")
    .where({ company_id, driver_id: user_id })
    .then(ids => {
      if (ids.length === 0) res.json({ reserve: {} });
      return ids[0];
    })
    .then(vehicle_id =>
      getVehicleReserve(vehicle_id).then(reserve =>
        res.json({ reserve: { vehicle_id, reserve } })
      )
    )
    .catch(err => next(new ApplicationError(err.message)));
};

const fetchOrders = (req, res, next) => {
  const { company_id, user_id } = req.user;
  db.table("vehicles")
    .pluck("vehicle_id")
    .where({ company_id, driver_id: user_id })
    .then(ids => {
      if (ids.length === 0) res.json({ orders: {} });
      return ids[0];
    })
    .then(vehicle_id =>
      db
        .select()
        .from("orders")
        .where({ vehicle_id, completed: false })
        .innerJoin("customers", "orders.customer_id", "customers.user_id")
        .innerJoin("users", "orders.customer_id", "users.user_id")
        .map(order => {
          const {
            order_id,
            value,
            route_index,
            eta,
            latitude,
            longitude,
            email,
            first_name,
            last_name,
            country,
            city,
            street,
            number
          } = order;
          const address = `${country}, ${city}, ${street} ${number}`;
          return db
            .select("products.product_id", "name", "type", "price", "quantity")
            .from("products")
            .innerJoin(
              "order_product_rel",
              "products.product_id",
              "order_product_rel.product_id"
            )
            .where({ order_id })
            .then(orderedProducts => ({
              order_id,
              value,
              route_index,
              eta,
              latitude,
              longitude,
              customer_email: email,
              first_name,
              last_name,
              address,
              products: orderedProducts
            }));
        })
        .then(orders => {
          res.json({ orders });
        })

        .catch(err => next(new ApplicationError(err.message)))
    );
};

const fetchShippingState = (req, res, next) => {
  const { company_id } = req.user;

  db.select("shipping_initialized")
    .from("companies")
    .where({ company_id })
    .first()
    .then(data => res.json(data))
    .catch(err => next(new ApplicationError(err.message)));
};

module.exports = {
  fetchVehicle,
  fetchRoute,
  fetchReserve,
  fetchOrders,
  fetchShippingState
};
