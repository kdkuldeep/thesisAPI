require("dotenv").config();

// dotenv.config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");

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
app.use(morgan("dev"));

app.use("/auth", authRouter);
app.use("/manager", userAuthentication, managerRouter);
app.use("/customer", userAuthentication, customerRouter);
app.use("/driver", userAuthentication, driverRouter);

app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  // console.log(error);

  // If you call next() with an error after you have started writing the response
  // the Express default error handler closes the connection and fails the request.
  // So when you add a custom error handler, you must delegate to the default Express error handler,
  // when the headers have already been sent to the client

  if (res.headersSent) {
    return next(error);
  }
  res.status(error.status || 500);
  res.json({
    errors: {
      global: error.message
    }
  });
});

app.listen(5000, () => {
  console.log("Server listening on port 5000");
});
