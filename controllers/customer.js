const auth = require("./auth");

const register = (db, bcrypt) => (req, res) => {
  const {
    email,
    username,
    password,
    first_name,
    last_name,
    country,
    city,
    street,
    number
  } = req.body.data;

  // TODO: add more checks
  if (!email || !username || !password) {
    return res.status(400).json("incorrect form submission");
  }

  return db
    .transaction(trx => {
      return db
        .insert({
          email,
          username,
          password: bcrypt.hashSync(password, 10),
          first_name,
          last_name,
          role: "customer"
        })
        .into("users")
        .transacting(trx)
        .then(() => {
          return db
            .insert({
              email,
              country,
              city,
              street,
              number
            })
            .into("customers")
            .transacting(trx);
        })
        .then(trx.commit)
        .catch(trx.rollback);
    })
    .then(() =>
      // transaction suceeded, database tables changed
      res.json({ user: auth.toAuthJSON({ email, username, role: "customer" }) })
    )
    .catch(err =>
      // transanction failed, no database changes
      res.status(400).json({ errors: { global: "unable to register" } })
    );
};

const fetchTypes = (db, query, options) => {
  return db
    .select("type")
    .from("products")
    .where("type", "ilike", `%${query}%`)
    .distinct("type")
    .pluck("type")
    .then(data => {
      options.types = data;
    });
};

const fetchCompanies = (db, query, options) => {
  return db
    .select("company_name")
    .from("companies")
    .where("company_name", "ilike", `%${query}%`)
    .distinct("company_name")
    .pluck("company_name")
    .then(data => {
      options.companies = data;
    });
};

const fetchLocations = (db, query, options) => {
  return db
    .select("city")
    .from("companies")
    .distinct("city")
    .where("city", "ilike", `%${query}%`)
    .pluck("city")
    .then(data => {
      options.locations = data;
    });
};

const fetchOptions = db => (req, res) => {
  const query = req.query.q;
  const options = { types: [], companies: [], locations: [] };

  Promise.all([
    fetchTypes(db, query, options),
    fetchCompanies(db, query, options),
    fetchLocations(db, query, options)
  ]).then(() => res.json(options));
};

module.exports = {
  register,
  fetchOptions
};
