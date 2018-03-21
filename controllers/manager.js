const auth = require('./auth');

const handleRegister = (db, bcrypt) => (req,res) => {
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
        role: 'manager'
      })
      .into('users')
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
        .into('companies')
        .transacting(trx)
        .returning('company_id')
        .then((ids) => { 
          return db
            .insert({
              email,
              company_id: ids[0]
            })
            .into('managers')
            .transacting(trx)
        })
      })
      .then(trx.commit)
      .catch(trx.rollback)
  })
  .then(() => 
    // transaction suceeded, database tables changed
    res.json({ user: auth.toAuthJSON({ email, username, role:'manager' }) }))
  .catch(err => 
    // transanction failed, no database changes
    {
      console.log(err);
      res.status(400).json({ errors: { global: "unable to register"} })
    })
};


module.exports = {
  handleRegister,
}