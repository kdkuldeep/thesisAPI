exports.up = knex =>
  knex.schema.createTable("managers", table => {
    table
      .integer("user_id")
      .primary()
      .references("user_id")
      .inTable("users")
      .onDelete("CASCADE")
      .index();
    table
      .integer("company_id")
      .notNullable()
      .references("company_id")
      .inTable("companies")
      .onDelete("RESTRICT")
      .index();
  });

exports.down = knex => knex.schema.dropTable("managers");
