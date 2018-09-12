const Joi = require("joi");
const lengths = require("../db/lengths");

module.exports = {
  create: Joi.object().keys({
    data: Joi.object()
      .keys({
        name: Joi.string()
          .alphanum()
          .max(lengths.PRODUCT_NAME)
          .required(),
        type: Joi.string()
          .alphanum()
          .max(lengths.PRODUCT_TYPE)
          .required(),
        price: Joi.number()
          .min(0.01)
          .required(),
        volume: Joi.number()
          .integer()
          .min(1)
          .required()
      })
      .required()
  }),
  update: Joi.object().keys({
    data: Joi.object()
      .keys({
        product_id: Joi.number()
          .integer()
          .min(1)
          .required(),
        name: Joi.string()
          .alphanum()
          .max(lengths.PRODUCT_NAME)
          .required(),
        type: Joi.string()
          .alphanum()
          .max(lengths.PRODUCT_TYPE)
          .required(),
        price: Joi.number()
          .min(0.01)
          .required(),
        volume: Joi.number()
          .integer()
          .min(1)
          .required()
      })
      .required()
  })
};
