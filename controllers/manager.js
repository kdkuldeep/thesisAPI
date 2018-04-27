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

  let company_id;

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
              company_id = ids[0];
              return db
                .insert({
                  email,
                  company_id
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
      res.json({
        user: auth.toAuthJSON({ email, username, company_id, role: "manager" })
      })
    )
    .catch(err =>
      // transanction failed, no database changes
      {
        console.log(err);
        res.status(400).json({ errors: { global: "unable to register" } });
      }
    );
};

const registerDriver = (db, bcrypt) => (req, res) => {
  const { email, username, password, first_name, last_name } = req.body.data;

  const { company_id } = req.user;

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
          role: "driver"
        })
        .into("users")
        .transacting(trx)
        .then(() => {
          return db
            .insert({
              email,
              company_id
            })
            .into("drivers")
            .transacting(trx);
        })
        .then(trx.commit)
        .catch(trx.rollback);
    })
    .then(() =>
      // transaction suceeded, database tables changed
      res.json({ user: { email, username, first_name, last_name } })
    )
    .catch(err =>
      // transanction failed, no database changes
      {
        console.log(err);
        res.status(400).json({ errors: { global: "unable to register" } });
      }
    );
};

module.exports = {
  register,
  registerDriver
};
