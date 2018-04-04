const auth = require("./auth");

const register = (db, bcrypt) => (req, res) => {
  const {
    email,
    username,
    password,
    first_name,
    last_name,
    company_name,
    country,
    city,
    street,
    number
  } = req.body.data;

  // TODO: add more checks
  if (!email || !username || !password || !company_name) {
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
          role: "manager"
        })
        .into("users")
        .transacting(trx)
        .then(() => {
          return db
            .insert({
              company_name,
              country,
              city,
              street,
              number
            })
            .into("companies")
            .transacting(trx)
            .returning("company_id")
            .then(ids => {
              return db
                .insert({
                  email,
                  company_id: ids[0]
                })
                .into("managers")
                .transacting(trx);
            });
        })
        .then(trx.commit)
        .catch(trx.rollback);
    })
    .then(() =>
      // transaction suceeded, database tables changed
      res.json({ user: auth.toAuthJSON({ email, username, role: "manager" }) })
    )
    .catch(err =>
      // transanction failed, no database changes
      {
        console.log(err);
        res.status(400).json({ errors: { global: "unable to register" } });
      }
    );
};

const addProduct = db => (req, res) => {
  const { name, price, type } = req.body.data;
  const { email } = req.user;

  // TODO: add more checks
  if (!name || !price) {
    return res.status(400).json("incorrect form submission");
  }

  db
    .select("company_id")
    .from("managers")
    .where({ email })
    .first()
    .then(data => {
      const { company_id } = data;
      db
        .insert({ company_id, name, price, type })
        .into("products")
        .then(() => res.json({ name, price, type }))
        .catch(err => {
          res.status(400).json({
            errors: {
              global: "You already have a product with the same name"
            }
          });
        });
    })
    .catch(err => {
      res.status(400).json({
        errors: {
          global: "something went wrong when (SELECT company_id WHERE email)"
        }
      });
    });
};

module.exports = {
  register,
  addProduct
};
