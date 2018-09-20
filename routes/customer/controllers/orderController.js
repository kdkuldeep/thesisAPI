const db = require("../../../db/knex");

const ApplicationError = require("../../../errors/ApplicationError");

const fetchOrders = (req, res, next) => {
  const { user_id } = req.user;
  db.select()
    .from("orders")
    .where("customer_id", user_id)
    .innerJoin("companies", "orders.company_id", "companies.company_id")
    .map(order => {
      const {
        order_id,
        company_name,
        value,
        created_at,
        eta,
        country,
        city,
        street,
        number
      } = order;
      const address = `${country}, ${city}, ${street} ${number}`;
      return db
        .select("products.product_id", "name", "price", "type", "quantity")
        .from("products")
        .innerJoin(
          "order_product_rel",
          "products.product_id",
          "order_product_rel.product_id"
        )
        .where({ order_id })
        .then(orderedProducts => ({
          order_id,
          company_name,
          value,
          created_at,
          eta,
          address,
          products: orderedProducts
        }));
    })
    .then(orders => {
      res.json({ orders });
    })
    .catch(err => {
      console.log(err);
      return next(new ApplicationError("Cannot fetch orders"));
    });
};

const addOrder = (req, res, next) => {
  const { basketContent } = req.validatedData;
  const { user_id } = req.user;

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
        const { company_id, product_id, price, volume } = product;
        if (typeof contentByCompany[company_id] === "undefined")
          contentByCompany[company_id] = [];
        contentByCompany[company_id].push({
          product_id,
          price,
          volume,
          quantity: basketContent[product_id]
        });
      });

      return contentByCompany;
    })
    .then(contentByCompany => {
      const newOrderIds = [];

      db.transaction(trx => {
        // Create promises for all insertions in ORDERS
        const promises = Object.keys(contentByCompany).map(company_id =>
          db
            .insert({ company_id, customer_id: user_id })
            .into("orders")
            .transacting(trx)
            .returning("order_id")
            .then(ids => {
              const order_id = ids[0];
              let orderValue = 0;
              let orderVolume = 0;
              newOrderIds.push(order_id);

              // Create promises for all insertions in ORDER_PRODUCT_REL per order
              const innerPromises = contentByCompany[company_id].map(
                product => {
                  const { product_id, quantity, price, volume } = product;
                  orderValue += quantity * price;
                  orderVolume += quantity * volume;
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

              return Promise.all(innerPromises).then(() =>
                // When insertions into ORDER_PRODUCT_REL complete
                // update the order value in ORDERS
                db("orders")
                  .where({ order_id })
                  .update({ value: orderValue, total_volume: orderVolume })
                  .transacting(trx)
              );
            })
        );

        Promise.all(promises)
          .then(trx.commit)
          .catch(trx.rollback);
      })
        .then(() =>
          // transaction suceeded, database tables changed
          // return new orders
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

                return Promise.all(promises).then(orderFragments => {
                  res.json({ orderFragments });
                });
              });
          }
        )
        .catch(err =>
          // transanction failed, no database changes
          {
            console.log(err);
            return next(new ApplicationError("Unable to place order"));
          }
        );
    })
    .catch(err => {
      console.log(err);
      return next(new ApplicationError("Unable to place order"));
    });
};

module.exports = {
  fetchOrders,
  addOrder
};
