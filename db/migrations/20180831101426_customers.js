const lengths = require("../lengths");

exports.up = knex =>
  knex.schema.createTable("customers", table => {
    table
      .integer("user_id")
      .primary()
      .references("user_id")
      .inTable("users")
      .onDelete("CASCADE")
      .index();
    table.string("country", lengths.COUNTRY_NAME).notNullable();
    table.string("city", lengths.CITY_NAME).notNullable();
    table.string("street", lengths.STREET_NAME).notNullable();
    table.string("number", lengths.STREET_NUMBER).notNullable();
    table.decimal("latitude", 10, 6).notNullable();
    table.decimal("longitude", 10, 6).notNullable();
  });

exports.down = knex => knex.schema.dropTable("customers");
