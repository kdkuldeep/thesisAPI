const db = require("../../../db/knex");

const ApplicationError = require("../../../errors/ApplicationError");

const fetchOrders = (req, res, next) => {
  const { company_id } = req.user;
  db.select(
    "order_id",
    "customer_id",
    "email as customer_email",
    "first_name",
    "last_name",
    "country",
    "city",
    "street",
    "number",
    "value",
    "created_at",
    "vehicle_id"
  )
    .from("orders")
    .where({ company_id })
    .innerJoin("customers", "orders.customer_id", "customers.user_id")
    .innerJoin("users", "orders.customer_id", "users.user_id")
    .then(orders => {
      const promises = orders.map(order => {
        const { order_id } = order;
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
            ...order,
            products: orderedProducts
          }));
      });

      return Promise.all(promises).then(orders => {
        res.json({ orders });
      });
    })
    .catch(err => {
      console.log(err);
      return next(new ApplicationError());
    });
};

module.exports = {
  fetchOrders
};
