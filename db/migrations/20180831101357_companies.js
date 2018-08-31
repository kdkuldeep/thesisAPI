const lengths = require("../lengths");

exports.up = knex =>
  knex.schema.createTable("companies", table => {
    table.increments("company_id");
    table
      .string("company_name", lengths.COMPANY_NAME)
      .notNullable()
      .unique();
    table.string("country", lengths.COUNTRY_NAME).notNullable();
    table.string("city", lengths.CITY_NAME).notNullable();
    table.string("street", lengths.STREET_NAME).notNullable();
    table.string("number", lengths.STREET_NUMBER).notNullable();
    table.decimal("latitude", 10, 6).notNullable();
    table.decimal("longitude", 10, 6).notNullable();
  });

exports.down = knex => knex.schema.dropTable("companies");
