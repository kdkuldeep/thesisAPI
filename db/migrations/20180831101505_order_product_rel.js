exports.up = knex =>
  knex.schema.createTable("order_product_rel", table => {
    table
      .integer("product_id")
      .notNullable()
      .references("product_id")
      .inTable("products")
      .onDelete("CASCADE")
      .index();
    table
      .integer("order_id")
      .notNullable()
      .references("order_id")
      .inTable("orders")
      .onDelete("CASCADE")
      .index();
    table
      .integer("quantity")
      .unsigned()
      .notNullable();
    table.primary(["product_id", "order_id"]);
  });

exports.down = knex => knex.schema.dropTable("order_product_rel");
