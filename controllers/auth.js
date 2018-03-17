const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const generateJWT = (email) => {
  return jwt.sign(
    {
      email
    },
    process.env.JWT_SECRET
  );
}

const toAuthJSON = ({ email }) => {
  return {
    email,
    token: generateJWT(email)
  };
}


const handleSignin = (db) => (req,res) => {
  const { email, password } = req.body.credentials;
  
  // TODO: add more checks
  if (!email || !password) {
    return res.status(400)
      .json({ errors: { global: "invalid Credentials 3"}});
  }
  db.select('*').from('users')
    .where({ email }).first()
    .then(data => {     
      if(bcrypt.compareSync(password, data.password)) {
        return res.json({ user: toAuthJSON(data) });
      }
      else {
        // error for invalid password
        res.status(400).json({ errors: { global: "invalid Credentials 1"}});
      }
    })
    // error for invalid email
    .catch(err => res.status(400).json({ errors: { global: "invalid Credentials 2"}}))
}

module.exports = {
  handleSignin,
}