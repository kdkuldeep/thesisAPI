exports.up = knex =>
  knex.schema.createTable("reserves", table => {
    table
      .integer("product_id")
      .notNullable()
      .references("product_id")
      .inTable("products")
      .onDelete("CASCADE")
      .index();
    table
      .integer("vehicle_id")
      .notNullable()
      .references("vehicle_id")
      .inTable("vehicles")
      .onDelete("CASCADE")
      .index();
    table
      .integer("quantity")
      .unsigned()
      .notNullable();
    table
      .integer("min_quantity")
      .unsigned()
      .notNullable();
    table.primary(["product_id", "vehicle_id"]);
  });

exports.down = knex => knex.schema.dropTable("reserves");
