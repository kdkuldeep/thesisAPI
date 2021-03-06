const bcrypt = require("bcrypt");

const db = require("../../../db/knex");
const roles = require("../../../roles");
const { toAuthJSON } = require("./signin");

const ApplicationError = require("../../../errors/ApplicationError");

const insertInUsersTable = (
  trx,
  email,
  username,
  password,
  first_name,
  last_name,
  role
) =>
  db
    .insert({
      email,
      username,
      password: bcrypt.hashSync(password, 10),
      first_name,
      last_name,
      role
    })
    .into("users")
    .transacting(trx)
    .returning("user_id");

const managerRegistration = (req, res, next) => {
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
  } = req.validatedData.data;

  db.transaction(trx =>
    Promise.all([
      insertInUsersTable(
        trx,
        email,
        username,
        password,
        first_name,
        last_name,
        roles.MANAGER
      ),
      db
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
    ])
      .then(([userData, companyData]) =>
        db
          .insert({
            user_id: userData[0],
            company_id: companyData[0]
          })
          .into("managers")
          .transacting(trx)
          .returning(["user_id", "company_id"])
      )
      .then(trx.commit)
      .catch(trx.rollback)
  )
    .then(managerData =>
      // transaction suceeded, database tables changed
      res.json({
        user: toAuthJSON({
          user_id: managerData[0].user_id,
          email,
          username,
          company_id: managerData[0].company_id,
          role: roles.MANAGER,
          coordinates: {
            latitude: coords.lat,
            longitude: coords.lng
          }
        })
      })
    )
    .catch(err =>
      // transanction failed, no database changes
      {
        // TODO: parse err to send better message to client
        console.log(err);
        return next(
          new ApplicationError(
            "Email/username/company name already exists",
            409
          )
        );
      }
    );
};

const customerRegistration = (req, res, next) => {
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
  } = req.validatedData.data;

  return db
    .transaction(trx =>
      insertInUsersTable(
        trx,
        email,
        username,
        password,
        first_name,
        last_name,
        roles.CUSTOMER
      )
        .then(userData =>
          db
            .insert({
              user_id: userData[0],
              country,
              city,
              street,
              number,
              latitude: coords.lat,
              longitude: coords.lng
            })
            .into("customers")
            .transacting(trx)
            .returning("user_id")
        )
        .then(trx.commit)
        .catch(trx.rollback)
    )
    .then(customerData =>
      // transaction suceeded, database tables changed
      res.json({
        user: toAuthJSON({
          user_id: customerData[0],
          email,
          username,
          role: roles.CUSTOMER,
          coordinates: {
            latitude: coords.lat,
            longitude: coords.lng
          }
        })
      })
    )
    .catch(err => {
      // transanction failed, no database changes
      // TODO: parse err to send better message to client
      console.log(err);
      return next(new ApplicationError("Email/username already exists", 409));
    });
};

module.exports = {
  managerRegistration,
  customerRegistration
};
