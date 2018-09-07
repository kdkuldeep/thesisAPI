const faker = require("faker");

// Every customer makes one order to each of the companies

const MAX_QUANTITY_PER_PRODUCT = 10;

const getRandomProducts = (knex, company_id) =>
  knex("products")
    .where({ company_id })
    .then(products => {
      const maxNumProd = faker.random.number({ min: 1, max: products.length });
      const selection = [];
      for (
        let productCounter = 0;
        productCounter < maxNumProd;
        productCounter += 1
      ) {
        const selectedProduct = {
          ...products.splice(
            faker.random.number({ min: 0, max: products.length - 1 }),
            1
          )["0"]
        };

        selectedProduct.quantity = faker.random.number({
          min: 1,
          max: MAX_QUANTITY_PER_PRODUCT
        });
        selection.push(selectedProduct);
      }

      return selection;
    });

const insertOrder = (knex, company_id, customer_id) =>
  knex("orders")
    .insert({ company_id, customer_id })
    .returning("order_id")
    .then(orderData =>
      getRandomProducts(knex, company_id).then(selection =>
        Promise.all(
          selection.map(({ product_id, price, quantity }) =>
            knex("order_product_rel")
              .insert({
                product_id,
                order_id: orderData[0],
                quantity
              })
              .then(() => price * quantity)
          )
        )
          .then(productTotals => productTotals.reduce((a, b) => a + b, 0))
          .then(orderValue =>
            knex("orders")
              .where({ order_id: orderData[0] })
              .update({ value: orderValue })
          )
      )
    );

exports.seed = knex =>
  knex("orders")
    .del()
    .then(() =>
      Promise.all([
        knex("customers").pluck("user_id"),
        knex("companies").pluck("company_id")
      ])
    )
    .then(([customerIds, companyIds]) =>
      Promise.all(
        customerIds.map(customer_id =>
          Promise.all(
            companyIds.map(company_id =>
              insertOrder(knex, company_id, customer_id)
            )
          )
        )
      )
    );
