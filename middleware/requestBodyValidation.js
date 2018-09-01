const Joi = require("joi");
const ApplicationError = require("../errors/ApplicationError");

const requestBodyValidation = schema => (req, res, next) => {
  Joi.validate(
    req.body,
    schema,
    { abortEarly: false },
    (error, schemaResult) => {
      if (error) {
        const details = error.details.map(d => ({
          message: d.message,
          path: d.path
        }));
        console.log("\n----------------details-----------------");
        console.log(details);
        console.log("----------------------------------------\n");

        return next(new ApplicationError("Invalid request data", 400));
      }
      req.validatedData = schemaResult;
      console.log("\n--------------- Validated Request Body ----------------");
      console.log(schemaResult);
      console.log("-------------------------------------------------------\n");
      next();
    }
  );
};

module.exports = requestBodyValidation;
