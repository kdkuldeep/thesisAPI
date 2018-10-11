const lengths = require("../lengths");

exports.up = knex =>
  knex.schema.createTable("vehicles", table => {
    table.increments("vehicle_id");
    table
      .string("licence_plate", lengths.LICENCE_PLATE)
      .notNullable()
      .unique();
    table
      .integer("capacity")
      .unsigned()
      .notNullable();
    table
      .integer("driver_id")
      .references("user_id")
      .inTable("drivers")
      .onDelete("SET NULL")
      .index();
    table
      .integer("company_id")
      .notNullable()
      .references("company_id")
      .inTable("companies")
      .onDelete("CASCADE")
      .index();
    table.decimal("latitude", 10, 6);
    table.decimal("longitude", 10, 6);
    table.text("route_polyline");
  });

exports.down = knex => knex.schema.dropTable("vehicles");
