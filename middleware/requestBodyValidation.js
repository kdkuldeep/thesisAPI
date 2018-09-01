const Joi = require("joi");

const requestBodyValidation = schema => (req, res, next) => {
  Joi.validate(
    req.body,
    schema,
    { abortEarly: false },
    (error, schemaResult) => {
      if (error) {
        console.log(error.details);

        const details = error.details.map(d => ({
          message: d.message,
          path: d.path
        }));
        console.log("\n----------------details-----------------");
        console.log(details);
        console.log("----------------------------------------\n");

        return next(error);
      }
      req.validatedData = schemaResult;
      console.log("\n----------------shema result-----------------");
      console.log(schemaResult);
      console.log("---------------------------------------------\n");
      next();
    }
  );
};

module.exports = requestBodyValidation;
