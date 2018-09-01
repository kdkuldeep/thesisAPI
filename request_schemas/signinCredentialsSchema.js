const Joi = require("joi");
const lengths = require("../db/lengths");

module.exports = Joi.object().keys({
  credentials: Joi.object()
    .keys({
      email: Joi.string()
        .email({ minDomainAtoms: 2 })
        .max(lengths.EMAIL)
        .required(),
      password: Joi.string().required()
    })
    .required()
});
