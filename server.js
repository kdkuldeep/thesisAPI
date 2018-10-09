require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");

const userAuthentication = require("./middleware/userAuthentication");
const errorHandler = require("./middleware/errorHandler");
const authRouter = require("./routes/auth/authRouter");
const managerRouter = require("./routes/manager/managerRouter");
const customerRouter = require("./routes/customer/customerRouter");
const driverRouter = require("./routes/driver/driverRouter");

const app = express();

app.use(cors());
app.options("*", cors());
app.use(bodyParser.json());
app.use(morgan("dev"));

app.use("/auth", authRouter);
app.use("/manager", userAuthentication, managerRouter);
app.use("/customer", userAuthentication, customerRouter);
app.use("/driver", userAuthentication, driverRouter);

// TESTING-PRESENTATION ROUTE
const testingRouter = require("./routes/TEST/testingRouter");

app.use("/testing", userAuthentication, testingRouter);
// **************************

app.use("/*", (req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  return next(error);
});

app.use(errorHandler);

app.listen(5000, () => {
  console.log("Server listening on port 5000");
});
