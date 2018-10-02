const Joi = require("joi");

module.exports = Joi.object().keys({
  data: Joi.array()
    .items(
      Joi.object().keys({
        product_id: Joi.number()
          .integer()
          .required(),
        quantity: Joi.number()
          .integer()
          .min(0)
          .required()
      })
    )
    .required()
});
