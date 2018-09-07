const faker = require("faker");

const PRODUCTS_PER_COMPANY = 10;

const insertProduct = (knex, company_id) =>
  knex("products").insert({
    name: faker.commerce.productName(),
    price: parseFloat(faker.commerce.price(0.1, 200.0, 2)),
    company_id,
    type: faker.commerce.department()
  });

exports.seed = knex =>
  // Deletes ALL existing entries
  knex("products")
    .del()
    .then(() =>
      // Insert products for each company
      knex("companies")
        .pluck("company_id")
        .map(company_id => {
          const innerPromises = [];
          for (
            let productCounter = 0;
            productCounter < PRODUCTS_PER_COMPANY;
            productCounter += 1
          ) {
            innerPromises.push(insertProduct(knex, company_id));
          }
          return Promise.all(innerPromises);
        })
    );
