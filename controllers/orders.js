const addOrder = db => (req, res) => {
  const { basketContent } = req.body;
  const customer_email = req.user.email;

  // Separate content's products by companies
  // to create the corresponding orders

  // contentByCompany :
  //
  //  { '6':
  //      [ { product_id: 60, price: 12345, quantity: 1 },
  //       { product_id: 52, price: 123, quantity: 1 },
  //       { product_id: 64, price: 3252, quantity: 1 } ],
  //    '7':
  //     [ { product_id: 50, price: 1, quantity: 1 },
  //       { product_id: 51, price: 2, quantity: 1 } ]
  //  }
  //

  db.select()
    .from("products")
    .whereIn("product_id", Object.keys(basketContent))
    .then(products => {
      const contentByCompany = {};
      products.forEach(product => {
        const { company_id, product_id, price } = product;
        if (typeof contentByCompany[company_id] === "undefined")
          contentByCompany[company_id] = [];
        contentByCompany[company_id].push({
          product_id,
          price,
          quantity: basketContent[product_id]
        });
      });

      return contentByCompany;
    })
    .then(contentByCompany => {
      const newOrderIds = [];

      db.transaction(trx => {
        const promises = [];
        for (let company_id in contentByCompany) {
          // Create promises for all insertions in ORDERS
          promises.push(
            db
              .insert({ company_id, customer_email })
              .into("orders")
              .transacting(trx)
              .returning("order_id")
              .then(ids => {
                const order_id = ids[0];
                let orderValue = 0;
                newOrderIds.push(order_id);

                // Create promises for all insertions in ORDER_PRODUCT_REL per order
                const innerPromises = contentByCompany[company_id].map(
                  product => {
                    const { product_id, quantity, price } = product;
                    orderValue += quantity * price;
                    return db
                      .insert({
                        product_id,
                        order_id,
                        quantity
                      })
                      .into("order_product_rel")
                      .transacting(trx);
                  }
                );

                return Promise.all(innerPromises).then(() => {
                  // When insertions into ORDER_PRODUCT_REL complete
                  // update the order value in ORDERS
                  return db("orders")
                    .where({ order_id })
                    .update({ value: orderValue })
                    .transacting(trx);
                });
              })
          );
        }
        Promise.all(promises)
          .then(trx.commit)
          .catch(trx.rollback);
      })
        .then(() =>
          // transaction suceeded, database tables changed
          //return new orders
          {
            db.select()
              .from("orders")
              .whereIn("order_id", newOrderIds)
              .innerJoin(
                "companies",
                "orders.company_id",
                "companies.company_id"
              )
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
                  res.json({ orderFragments: orders });
                });
              });
          }
        )
        .catch(err =>
          // transanction failed, no database changes
          {
            res
              .status(500)
              .json({ errors: { global: "Unable to place order" } });
          }
        );
    })
    .catch(err => {
      res.status(500).json({ errors: { global: "Unable to place order 2" } });
    });
};

const fetchOrders = db => (req, res) => {
  switch (req.user.role) {
    case "manager":
      break;
    case "customer":
      const customer_email = req.user.email;
      db.select()
        .from("orders")
        .where({ customer_email })
        .innerJoin("companies", "orders.company_id", "companies.company_id")
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
      break;
  }
};

module.exports = {
  addOrder,
  fetchOrders
};
