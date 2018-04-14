const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const knex = require("knex");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const auth = require("./controllers/auth");
const manager = require("./controllers/manager");
const customer = require("./controllers/customer");
const products = require("./controllers/products");

dotenv.config();

const db = knex({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  }
});

// db.select('*').from('users').then(data => {
//   console.log(data);
// });

const app = express();

app.use(cors());
app.options("*", cors());
app.use(bodyParser.json());

// Endpoints

app.post("/auth", auth.handleSignin(db, bcrypt));

app.post("/register/customer", customer.register(db, bcrypt));

app.post("/register/manager", manager.register(db, bcrypt));

app.get(
  "/products",
  auth.authenticate,
  auth.checkAuthorization(["manager", "customer"]),
  products.fetch(db)
);

app.post(
  "/products",
  auth.authenticate,
  auth.checkAuthorization(["manager"]),
  manager.addProduct(db)
);

app.put(
  "/products",
  auth.authenticate,
  auth.checkAuthorization(["manager"]),
  manager.editProduct(db)
);

app.delete(
  "/products",
  auth.authenticate,
  auth.checkAuthorization(["manager"]),
  manager.editProduct(db)
);

app.listen(5000, () => {
  console.log("Server listening on port 5000");
});
