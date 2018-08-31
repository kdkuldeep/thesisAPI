const knex = require("knex");
const config = require("./config");

const db = knex(config.database);

module.exports = db;
