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
        .required()
    })
    .required()
});
