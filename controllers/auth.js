const jwt = require('jsonwebtoken');

const generateJWT = (email, username, role ) => {
  return jwt.sign(
    {
      email,
      username,
      role
    },
    process.env.JWT_SECRET
  );
};

const toAuthJSON = ({ email, username, role }) => {
  return {
    email,
    token: generateJWT(email, username, role),
    username,
    role
  };
};


const handleSignin = (db, bcrypt) => (req,res) => {
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
        res.status(400).json({ errors: { global: "invalid Credentials (invalid password)"}});
      }
    })
    // error for invalid email
    .catch(err => res.status(400).json({ errors: { global: "invalid Credentials (email does not exist)"}}))
};

module.exports = {
  handleSignin,
  toAuthJSON
};