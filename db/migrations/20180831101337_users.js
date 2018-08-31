const lengths = require("../lengths");
const { MANAGER, CUSTOMER, DRIVER } = require("../../roles");

exports.up = knex =>
  knex.schema.createTable("users", table => {
    table.increments("user_id");
    table
      .string("email", lengths.EMAIL)
      .notNullable()
      .unique();
    table.string("password", lengths.PASSWORD_HASH).notNullable();
    table
      .string("username", lengths.USERNAME)
      .notNullable()
      .unique();
    table.string("first_name", lengths.FIRST_NAME).notNullable();
    table.string("last_name", lengths.LAST_NAME).notNullable();
    table
      .enu("role", [MANAGER, CUSTOMER, DRIVER], {
        useNative: true,
        enumName: "user_roles"
      })
      .notNullable();
  });

// exports.down = knex => knex.schema.dropTable("users");

exports.down = knex =>
  knex.schema.raw("DROP TABLE users; DROP TYPE IF EXISTS user_roles; ");
