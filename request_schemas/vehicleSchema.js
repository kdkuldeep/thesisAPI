const Joi = require("joi");
const lengths = require("../db/lengths");

module.exports = {
  create: Joi.object().keys({
    data: Joi.object()
      .keys({
        licence_plate: Joi.string()
          .alphanum()
          .max(lengths.LICENCE_PLATE)
          .required(),
        capacity: Joi.number()
          .integer()
          .min(1)
          .required()
      })
      .required()
  }),
  update: Joi.object().keys({
    data: Joi.object()
      .keys({
        vehicle_id: Joi.number()
          .integer()
          .min(1)
          .required(),
        licence_plate: Joi.string()
          .alphanum()
          .max(lengths.LICENCE_PLATE)
          .required(),
        capacity: Joi.number()
          .integer()
          .min(1)
          .required()
      })
      .required()
  }),
  assign: Joi.object().keys({
    data: Joi.object()
      .keys({
        vehicle_id: Joi.number()
          .integer()
          .min(1)
          .required(),
        driver_id: Joi.number()
          .integer()
          .min(1)
          .required()
          .allow(null)
      })
      .required()
  })
};
