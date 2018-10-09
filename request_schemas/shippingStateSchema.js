const Joi = require("joi");

module.exports = Joi.object().keys({
  shippingState: Joi.boolean().required()
});
