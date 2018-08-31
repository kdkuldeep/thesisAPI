const dotenv = require("dotenv").config();

// dotenv.config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Mapbox service clients
const mbxClient = require("@mapbox/mapbox-sdk");
const mbxMatrix = require("@mapbox/mapbox-sdk/services/matrix");

const userAuthentication = require("./middleware/userAuthentication");
const authRouter = require("./routes/auth/authRouter");
const managerRouter = require("./routes/manager/managerRouter");
const customerRouter = require("./routes/customer/customerRouter");
const driverRouter = require("./routes/driver/driverRouter");

const baseClient = mbxClient({ accessToken: process.env.MAPBOX_TOKEN });
const matrixService = mbxMatrix(baseClient);

const app = express();

app.use(cors());
app.options("*", cors());
app.use(bodyParser.json());

app.use("/auth", authRouter);
app.use("/manager", userAuthentication, managerRouter);
app.use("/customer", userAuthentication, customerRouter);
app.use("/driver", userAuthentication, driverRouter);

app.listen(5000, () => {
  console.log("Server listening on port 5000");
});
