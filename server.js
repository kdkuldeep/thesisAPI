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
const vehicles = require("./controllers/vehicles");
const drivers = require("./controllers/drivers");
const orders = require("./controllers/orders");

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

app.post(
  "/register/driver",
  auth.authenticate,
  auth.checkAuthorization(["manager"]),
  manager.registerDriver(db, bcrypt)
);

app.get(
  "/products",
  auth.authenticate,
  auth.checkAuthorization(["manager", "customer"]),
  products.fetchProducts(db)
);

app.post(
  "/products",
  auth.authenticate,
  auth.checkAuthorization(["manager"]),
  products.addProduct(db)
);

app.put(
  "/products",
  auth.authenticate,
  auth.checkAuthorization(["manager"]),
  products.editProduct(db)
);

app.delete(
  "/products/:id",
  auth.authenticate,
  auth.checkAuthorization(["manager"]),
  products.deleteProduct(db)
);

app.get(
  "/vehicles",
  auth.authenticate,
  auth.checkAuthorization(["manager"]),
  vehicles.fetchVehicles(db)
);

app.post(
  "/vehicles",
  auth.authenticate,
  auth.checkAuthorization(["manager"]),
  vehicles.addVehicle(db)
);

app.post(
  "/vehicles/assign",
  auth.authenticate,
  auth.checkAuthorization(["manager"]),
  vehicles.assignDriver(db)
);

app.put(
  "/vehicles",
  auth.authenticate,
  auth.checkAuthorization(["manager"]),
  vehicles.editVehicle(db)
);

app.delete(
  "/vehicles/:id",
  auth.authenticate,
  auth.checkAuthorization(["manager"]),
  vehicles.deleteVehicle(db)
);

app.get(
  "/drivers",
  auth.authenticate,
  auth.checkAuthorization(["manager"]),
  drivers.fetchDrivers(db)
);

app.put(
  "/drivers",
  auth.authenticate,
  auth.checkAuthorization(["manager"]),
  drivers.editDriver(db)
);

app.delete(
  "/drivers/:email",
  auth.authenticate,
  auth.checkAuthorization(["manager"]),
  drivers.deleteDriver(db)
);

app.get(
  "/options",
  auth.authenticate,
  auth.checkAuthorization(["customer"]),
  customer.fetchOptions(db)
);

app.get(
  "/orders",
  auth.authenticate,
  auth.checkAuthorization(["customer", "manager"]),
  orders.fetchOrders(db)
);

app.post(
  "/orders",
  auth.authenticate,
  auth.checkAuthorization(["customer"]),
  orders.addOrder(db)
);

app.listen(5000, () => {
  console.log("Server listening on port 5000");
});
