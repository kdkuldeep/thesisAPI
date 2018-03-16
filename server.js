const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const knex = require('knex');

dotenv.config();

const db = knex({
  client: 'pg',
  connection: {
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    password : process.env.DB_PASS,
    database : process.env.DB_NAME
  }
});

db.select('*').from('users').then(data => {
  console.log(data);
});


const app = express();

app.use(cors());
app.options('*', cors());

app.get('/api/auth', (req, res) => {
  res.json({msg: 'PASSED!!'});
})

app.post('/api/auth', (req, res) => {
  res.status(400)
  .json({ errors: { global: "invalid Credentials"}});
});

app.listen(5000, () => {
  console.log('Server listening on port 5000');
  
});




