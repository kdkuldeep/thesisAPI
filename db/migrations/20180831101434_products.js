const lengths = require("../lengths");

exports.up = knex =>
  knex.schema.createTable("products", table => {
    table.increments("product_id");
    table.string("name", lengths.PRODUCT_NAME).notNullable();
    table
      .integer("company_id")
      .notNullable()
      .references("company_id")
      .inTable("companies")
      .onDelete("CASCADE")
      .index();
    table.float("price", 8, 2).notNullable();
    table.string("type", lengths.PRODUCT_TYPE).notNullable();
    table.unique(["company_id", "name"]);
  });

exports.down = knex => knex.schema.dropTable("products");
