'use strict';


//==========================
// Application Dependencies
//==========================

const express = require('express');
const app = express();
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');
app.set('view engine', 'ejs');

const PORT = process.env.PORT || 3000;
//===========================
//Load Environment Variables
//===========================

require('dotenv').config();

//===========================
//Middleware
//===========================

app.use(express.urlencoded({extended: true}));
app.use(express.static('./public'));


//===========================
//EJS
//===========================

app.set('view engine', 'ejs');

//=======================
// Database - PostgresSQL
//=======================

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();

client.on('error', err => console.log(err));



//===========================
//Routes
//===========================

/////////index.ejs///////////
app.get('/', renderHome);
function renderHome(req, res){
  res.render('pages/index.ejs');
}
/////////sign_in////////////
app.post('/sign_in', signIn);

function signIn (req, res){
  let sql = 'SELECT id FROM users WHERE name=$1';
  let values = [req.body.user];
  return client.query(sql, values)
    .then(result => {
      console.log(result.rows[0]);
      res.redirect(`/dash/${result.rows[0].id}`);
    })
    .catch(err => console.log(err));
}


///////////register/////////////
app.get('/register', renderRegister);
app.post('/register', saveRegistration);

function renderRegister (req, res){
  res.render('pages/register.ejs');
}

function saveRegistration (req, res){
  let data = req.body;
  let userHeight = (data.feet*12) + data.inches;
  let newUser = new User(data.name, data.age, data.sex, data.weight, userHeight, data.activity_level);

  let sql = `INSERT INTO users 
              (name, sex, age, weight, height, activity_level, protein, fat, carbs, calories) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              RETURNING id`;
  let values = [
    newUser.name, newUser.sex, newUser.age, newUser.weight, newUser.height, newUser.activity_level, newUser.macronutrients().protein, newUser.macronutrients().fat, newUser.macronutrients().carbs, newUser.tdee().calories
  ];
  return client.query(sql, values)
    .then(result => {
      res.redirect(`/dash/${result.rows[0].id}`);
    })
    .catch(err => console.log(err));
}

/////////dash.ejs///////////
app.get('/dash/:id', renderDash);

/////////add.ejs///////////
app.get('/add/:id/:type', renderAdd);

function renderAdd(req, res){
  let type = req.params.type;
  let id = req.params.id;
  if(type === 'food'){
    // send array of entries of type
    let sql = 'SELECT * FROM food_entry WHERE fk_users=$1;';
    let client_id = [id];
    return client.query(sql, client_id)
      .then(data => {
        res.render('pages/add.ejs', {entries: data.rows, search_type: type, user_id: id});
      });
    // send type

  }
  // .catch(err => handleError(err, res));
}

// app.post('/search', search);

// app.get('/custom', custom);
// app.post('/history', history);

/////////results.ejs///////////
// app.post('/custom', custom);

/////////customize.ejs///////////
// app.post('/save', save);


app.listen(PORT, () => console.log(`app is up on PORT ${PORT}`));







//===========================
//Dashboard Function
//===========================

function renderDash (req, res) {
  var dateStr = '1/12/2019';
  let id = req.params.id;
  let sql = `SELECT * FROM food_entry WHERE fk_users=$1`;
  let values = [id];
  return client.query(sql, values)
    .then(data => {
      res.render('pages/dash', {food_entry: data.rows, date: dateStr, user_id: id});
    })
    .catch(err => {
      res.render('pages/error', {err});
    });
}

////////////////constructor///////////////
function User(name, age, sex, weight, height, activity_level) {
  this.name = name;
  this.age = age;
  this.sex = sex;
  this.weight = parseFloat((weight / 2.2).toFixed(2));
  this.height = parseFloat((height * 2.54).toFixed(2));
  this.activity_level = activity_level;
} 

User.prototype.bmr = function() {
  let result = (10 * this.weight) + (6.25 * this.height) - (5 * this.age);

  if(this.sex === 'male'){
    result += 5;
  } else if(this.sex === 'female'){
    result -= 161;
  }

  return parseInt(result);
}

User.prototype.tdee = function() {
  return parseInt(this.bmr() * this.activityMultiplier);
}

User.prototype.macronutrients = function() {
  let result = {};
  let tdee = this.tdee();
  
  let protein = parseInt(this.weight * 0.8);
  let fat = parseInt((tdee * 0.2) / 9);
  let carbs = parseInt((tdee - (protein * 4) - (fat * 9)) / 4);
  
  return {"protein": protein, "fat": fat, "carbs": carbs};
}

//===========================
//Chart JS
//===========================

// var ctx = document.getElementByID('barChart').getContext('2d');
