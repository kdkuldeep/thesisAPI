exports.up = knex =>
  knex.schema.createTable("orders", table => {
    table.increments("order_id");
    table
      .integer("vehicle_id")
      .references("vehicle_id")
      .inTable("vehicles")
      .onDelete("SET NULL")
      .index();
    table
      .integer("customer_id")
      .references("user_id")
      .inTable("customers")
      .onDelete("SET NULL")
      .index();
    table
      .integer("company_id")
      .notNullable()
      .references("company_id")
      .inTable("companies")
      .onDelete("CASCADE")
      .index();
    table.float("value", 8, 2);
    table.integer("total_volume").unsigned()
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("eta");
  });

exports.down = knex => knex.schema.dropTable("orders");
