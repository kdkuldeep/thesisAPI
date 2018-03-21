const auth = require('./auth');

const handleRegister = (db, bcrypt) => (req,res) => {
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
    return res.status(400).json('incorrect form submission');
  }

  return db.transaction(trx => {
    return db      
      .insert({
        email,
        username,
        password: bcrypt.hashSync(password, 10),
        first_name,
        last_name,
        role: 'customer'
      })
      .into('users')
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
        .into('customers')
        .transacting(trx)
      })
      .then(trx.commit)
      .catch(trx.rollback)
  })
  .then(() => 
    // transaction suceeded, database tables changed
    res.json({ user: auth.toAuthJSON({ email, username, role:'customer' }) }))
  .catch(err => 
    // transanction failed, no database changes
      res.status(400).json({ errors: { global: "unable to register"} }))
};


module.exports = {
  handleRegister,
}