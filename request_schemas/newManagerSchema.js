const Joi = require("joi");
const lengths = require("../db/lengths");

module.exports = Joi.object().keys({
  data: Joi.object()
    .keys({
      email: Joi.string()
        .email({ minDomainAtoms: 2 })
        .max(lengths.EMAIL)
        .required(),
      username: Joi.string()
        .alphanum()
        .max(lengths.USERNAME)
        .required(),
      password: Joi.string().required(),
      first_name: Joi.string()
        .regex(/^[a-zA-Z]+$/)
        .max(lengths.FIRST_NAME)
        .required(),
      last_name: Joi.string()
        .regex(/^[a-zA-Z]+$/)
        .max(lengths.LAST_NAME)
        .required(),
      company_name: Joi.string()
        .max(lengths.COMPANY_NAME)
        .required(),
      country: Joi.string()
        .regex(/^[a-zA-Z\s]+$/)
        .max(lengths.COUNTRY_NAME)
        .required(),
      city: Joi.string()
        .regex(/^[a-zA-Z\s]+$/)
        .max(lengths.CITY_NAME)
        .required(),
      street: Joi.string()
        .regex(/^[a-zA-Z\s]+$/)
        .max(lengths.STREET_NAME)
        .required(),
      number: Joi.string()
        .max(lengths.STREET_NUMBER)
        .required(),
      coords: Joi.object()
        .keys({
          lat: Joi.number().required(),
          lng: Joi.number().required()
        })
        .required()
    })
    .required()
});
