const db = require("../../../db");

const fetchOrders = (req, res) => {
  const { company_id } = req.user;
  db.select()
    .from("orders")
    .where({ company_id })
    .innerJoin("customers", "orders.customer_email", "customers.email")
    .then(orders => {
      const promises = orders.map(order => {
        const { order_id } = order;
        return db
          .select()
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
    });
};

module.exports = {
  fetchOrders
};
