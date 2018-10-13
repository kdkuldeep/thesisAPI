const db = require("../../../db/knex");

const ApplicationError = require("../../../errors/ApplicationError");

const fetchState = (req, res, next) => {
  const { company_id } = req.user;

  db.select("shipping_initialized")
    .from("companies")
    .where({ company_id })
    .first()
    .then(data => res.json(data))
    .catch(err => next(new ApplicationError(err.message)));
};

const setState = (req, res, next) => {
  const { company_id } = req.user;
  const { shippingState } = req.validatedData;

  db("companies")
    .where({ company_id })
    .update({ shipping_initialized: shippingState })
    .then(() => res.json({}))
    .catch(err => next(new ApplicationError(err.message)));
};

module.exports = {
  fetchState,
  setState
};
