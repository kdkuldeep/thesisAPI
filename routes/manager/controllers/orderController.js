const db = require("../../../db/knex");

const ApplicationError = require("../../../errors/ApplicationError");

const fetchOrders = (req, res, next) => {
  const { company_id } = req.user;
  db.select()
    .from("orders")
    .where({ company_id })
    .innerJoin("customers", "orders.customer_id", "customers.user_id")
    .innerJoin("users", "orders.customer_id", "users.user_id")
    .map(order => {
      const {
        order_id,
        value,
        created_at,
        vehicle_id,
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
          created_at,
          vehicle_id,
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

    .catch(err => {
      console.log(err);
      return next(new ApplicationError());
    });
};

module.exports = {
  fetchOrders
};
