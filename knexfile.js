const path = require("path");
require("dotenv").config();

module.exports = {
  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    },
    migrations: {
      directory: path.join(__dirname, "db/migrations")
    },
    seeds: {
      directory: path.join(__dirname, "db/seeds")
    }
  },
  production: {}
};
