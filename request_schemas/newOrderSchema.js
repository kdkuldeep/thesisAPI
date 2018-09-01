const Joi = require("joi");

module.exports = Joi.object().keys({
  basketContent: Joi.object()
    .pattern(
      /^[0-9]+$/,
      Joi.number()
        .min(1)
        .required()
    )
    .required()
});
