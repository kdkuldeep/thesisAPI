const bcrypt = require("bcrypt");

const db = require("../../../db");
const roles = require("../../../roles");
const { toAuthJSON } = require("./signin");

const managerRegistration = (req, res) => {
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
    number,
    coords
  } = req.body.data;

  // TODO: add more checks
  if (!email || !username || !password || !company_name) {
    return res.status(400).json("incorrect form submission");
  }

  let company_id;

  db.transaction(trx =>
    db
      .insert({
        email,
        username,
        password: bcrypt.hashSync(password, 10),
        first_name,
        last_name,
        role: roles.MANAGER
      })
      .into("users")
      .transacting(trx)
      .then(() => db
          .insert({
            company_name,
            country,
            city,
            street,
            number,
            latitude: coords.lat,
            longitude: coords.lng
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
          }))
      .then(trx.commit)
      .catch(trx.rollback)
  )
    .then(() =>
      // transaction suceeded, database tables changed
      res.json({
        user: toAuthJSON({
          email,
          username,
          company_id,
          role: roles.MANAGER
        })
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

const customerRegistration = (req, res) => {
  const {
    email,
    username,
    password,
    first_name,
    last_name,
    country,
    city,
    street,
    number,
    coords
  } = req.body.data;

  // TODO: add more checks
  if (!email || !username || !password) {
    return res.status(400).json("incorrect form submission");
  }

  return db
    .transaction(trx =>
      db
        .insert({
          email,
          username,
          password: bcrypt.hashSync(password, 10),
          first_name,
          last_name,
          role: roles.CUSTOMER
        })
        .into("users")
        .transacting(trx)
        .then(() => db
            .insert({
              email,
              country,
              city,
              street,
              number,
              latitude: coords.lat,
              longitude: coords.lng
            })
            .into("customers")
            .transacting(trx))
        .then(trx.commit)
        .catch(trx.rollback)
    )
    .then(() =>
      // transaction suceeded, database tables changed
      res.json({
        user: toAuthJSON({ email, username, role: roles.CUSTOMER })
      })
    )
    .catch(err =>
      // transanction failed, no database changes
      res.status(400).json({ errors: { global: "unable to register" } })
    );
};

module.exports = {
  managerRegistration,
  customerRegistration
};
