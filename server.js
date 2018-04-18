const express = require('express');
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('public'));

// Knex Setup
const env = process.env.NODE_ENV || 'development';
const config = require('./knexfile')[env];  
const knex = require('knex')(config);

// bcrypt setup
let bcrypt = require('bcrypt');
const saltRounds = 10;

app.post('/api/login', (req, res) => {
  if (!req.body.email || !req.body.password)
    return res.status(400).send();
  knex('users').where('email',req.body.email).first().then(user => {
    if (user === undefined) {
      res.status(403).send("Invalid credentials");
      throw new Error('abort');
    }
    return [bcrypt.compare(req.body.password, user.hash),user];
  }).spread((result,user) => {
    if (result)
      res.status(200).json({user:{username:user.username,name:user.name,id:user.id}});
    else
      res.status(403).send("Invalid credentials");
    return;
  }).catch(error => {
    if (error.message !== 'abort') {
      console.log(error);
      res.status(500).json({ error });
    }
  });
});

app.get('/api/users/:id/journal', (req, res) => {
  let id = parseInt(req.params.id);
  knex('users').join('journal','users.id','tweets.user_id')
    .where('users.id',id)
    .orderBy('created','desc')
    .select('journal','username','name','created').then(journal => {
      res.status(200).json({journal:journal});
    }).catch(error => {
      res.status(500).json({ error });
    });
});

app.post('/api/users/:id/journal', (req, res) => {
  let id = parseInt(req.params.id);
  knex('users').where('id',id).first().then(user => {
    return knex('journal').insert({user_id: id, journal:req.body.journal, created: new Date()});
  }).then(ids => {
    return knex('journal').where('id',ids[0]).first();
  }).then(j => {
    res.status(200).json({journal:journal});
    return;
  }).catch(error => {
    console.log(error);
    res.status(500).json({ error });
  });
});


app.listen(3005, () => console.log('Server listening on port 3005!'));
