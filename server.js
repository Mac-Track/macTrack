'use strict';

//==========================
// Application Dependencies
//==========================

const express = require('express');
const app = express();
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('express-flash-messages');
const validator = require('express-validator');
const http = require('http')

app.set('view engine', 'ejs');

const PORT = process.env.PORT || 3000;

//===========================
// Load Environment Variables
//===========================

require('dotenv').config();
//===========================
// Middleware
//===========================

//Session Middleware

var sessionStore = new session.MemoryStore;

app.use(session({
  cookie: { maxAge: 60000 },
  store: sessionStore,
  saveUninitialized: true,
  resave: 'true',
  secret: 'secret'
}));
app.use(flash());

app.use(express.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.use(methodOverride((req, res) => {
  if(req.body && typeof req.body === 'object' && '_method' in req.body){
    let method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

app.use(function(req,res,next){
  res.locals.userValue = null;
  res.locals.errors = null;
  next();
})

// From - https://github.com/ctavan/express-validator
app.use(validator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;
 
    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));
//===========================
// EJS
//===========================

// app.set('view engine', 'ejs');

//=======================
// Database - PostgresSQL
//=======================

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();

client.on('error', err => console.log('||||||||||||||||||||||||client error|||||||||||||||||||||||', err));

//===========================
// Routes
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
    res.redirect(`/dash/${result.rows[0].id}`);
  })
  .catch(err => console.log('||||||||||||||||||||||||sign-in error|||||||||||||||||||||||', err));
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
    .catch(err => console.log('||||||||||||||||||||||||saveRegistration error|||||||||||||||||||||||', err));
}

/////////dash.ejs///////////
app.get('/dash/:id', renderDash);

/////////add.ejs///////////
app.get('/add/:id/:type', renderAdd);


function renderAdd(req, res){
  let type = req.params.type;
  let id = req.params.id;
  let table = '';
  
  if(type === 'food'){
    table = 'food_entry';
  } else if(type === 'exercise'){
    table = 'exercise';
  }
  
  let sql = `SELECT * FROM ${table} WHERE fk_users=$1;`;
  console.log(sql);
  let client_id = [id];
  return client.query(sql, client_id)
  .catch(err => console.log('||||||||||||||||||||||||SQL error|||||||||||||||||||||||', err))
    .then(data => {
      res.render('pages/add.ejs', {entries: data.rows, search_type: type, user_id: id});
    })
    .catch(err => console.log('||||||||||||||||||||||||renderAdd error|||||||||||||||||||||||', err));
}

////////////Disclaimer////////
app.get('/disclaimer',renderDisclaimer);

function renderDisclaimer(req, res){
  res.render('pages/disclaimer.ejs');
}

///////////ABOUT PAGE////////////////
app.get('/about',renderAbout);

function renderAbout(req, res){
  res.render('pages/about.ejs');
}

//===========================
// Search
//===========================

app.post('/search', search);

function search(req, res){
  let data = req.body;
  let type = data.search_type;
  let id = data.user_id;
  let url = 'https://trackapi.nutritionix.com/v2/';

  if(type === 'food'){
    url += `search/instant?query=${req.body.query}&detailed=true`;
    foodSearch(url, id, res);
  } else if(type === 'exercise'){
    url += 'natural/exercise';
    exerciseSearch(url, id, req.body.query, res);
  }
}

function foodSearch(url, id, res){
  return superagent.get(url)
    .set('Content-Type', 'application/json')
    .set('x-app-id', `${process.env.X_APP_ID}`)
    .set('x-app-key', `${process.env.X_APP_KEY}`)
    .then(result => {
      let common = JSON.parse(result.res.text);
      let branded = JSON.parse(result.res.text);

      let foods = [];
      for(let i = 0; i < 10; i++){
      // COMMON
        let commonProtein = 0;
        let commonFat = 0;
        let commonCarbs = 0;
        let commonCalories = 0;

        for(let j = 0; j < common.common[i].full_nutrients.length; j++){
          if(common.common[i].full_nutrients[j].attr_id === 203) commonProtein = common.common[i].full_nutrients[j].value;
          if(common.common[i].full_nutrients[j].attr_id === 204) commonFat = common.common[i].full_nutrients[j].value;
          if(common.common[i].full_nutrients[j].attr_id === 205) commonCarbs = common.common[i].full_nutrients[j].value;
          if(common.common[i].full_nutrients[j].attr_id === 208) commonCalories = common.common[i].full_nutrients[j].value;
        }

        foods.push(new Food(common.common[i].food_name, common.common[i].photo.thumb, commonCalories, commonCarbs, commonFat, commonProtein, common.common[i].serving_qty, common.common[i].serving_unit));

        // BRANDED
        let brandedProtein = 0;
        let brandedFat = 0;
        let brandedCarbs = 0;
        let brandedCalories = 0;

        for(let k = 0; k < branded.branded[i].full_nutrients.length; k++){
          if(branded.branded[i].full_nutrients[k].attr_id === 203) brandedProtein = branded.branded[i].full_nutrients[k].value;
          if(branded.branded[i].full_nutrients[k].attr_id === 204) brandedFat = branded.branded[i].full_nutrients[k].value;
          if(branded.branded[i].full_nutrients[k].attr_id === 205) brandedCarbs = branded.branded[i].full_nutrients[k].value;
          if(branded.branded[i].full_nutrients[k].attr_id === 208) brandedCalories = branded.branded[i].full_nutrients[k].value;
        }

        foods.push(new Food(branded.branded[i].food_name, branded.branded[i].photo.thumb, brandedCalories, brandedCarbs, brandedFat, brandedProtein, branded.branded[i].serving_qty, branded.branded[i].serving_unit));
      }

      res.render('pages/results.ejs', {data: foods, search_type: 'food', user_id: id});
    })
    .catch(err => console.log('||||||||||||||||||||||||foodSearch error|||||||||||||||||||||||', err));
}

function exerciseSearch(url, id, query, res){
  let sql = 'SELECT age, sex, height, weight FROM users WHERE id=$1';
  let values = [id];
  return client.query(sql, values)
    .then(result => {

      return superagent.post(url)
      .send({
          query: query,
          gender: result.sex,
          weight_kg: parseInt(result.weight),
          height_cm: parseInt(result.height),
          age: parseInt(result.age)
        })
        .set('Content-Type', 'application/json')
        .set('x-app-id', `${process.env.X_APP_ID}`)
        .set('x-app-key', `${process.env.X_APP_KEY}`)
        .then(result => {
          let results = JSON.parse(result.res.text);
          results = results.exercises[0];
          let exerciseData = new Exercise(results.name, results.nf_calories, results.photo.thumb);
          res.render('pages/results.ejs', {data: exerciseData, search_type: 'exercise', user_id: id});
        });
    })
    .catch(err => console.log('||||||||||||||||||||||||exerciseSearch error|||||||||||||||||||||||', err));
  }
  
  
  //===========================
// Dashboard Function
//===========================

function renderDash (req, res) {
  var dateStr = new Date().toDateString();
  let id = req.params.id;
  console.log(new Date().toDateString());
  let sql = `SELECT * FROM food_entry WHERE fk_users = '${id}' AND date = '${dateStr}'`;
  let foods = [];
  client.query(sql)
  .then(data => {
    foods = [...data.rows];
  });

  console.log(foods);

  let sql2 = `SELECT * FROM exercise WHERE fk_users = '${id}' AND date = '${dateStr}'`;
  return client.query(sql2)
    .then(result => {
      res.render('pages/dash', {food_entry: foods, exercise_entry: result.rows, date: dateStr, user_id: id});
    })
    .catch(err => {
      res.render('pages/error', {err});
    });
}

//===========================
// Customize
//===========================

app.post('/custom', custom);

function custom(req, res) {
  let selectionData = req.body;
  res.render('pages/customize.ejs', {data: selectionData});
}

//===========================
// Save Function
//===========================

// app.get('/save', save)
app.post('/save', save)

function save (req, res) {
  let dateStr = new Date().toDateString();

  if(req.body.type === 'food'){
    let SQL = `INSERT INTO food_entry
    (date, name, image_url, protein, fat, carbs, calories, serving_size, serving_unit, fk_users)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;
    
    let foodArray = [dateStr, req.body.name, req.body.image_url, parseFloat(req.body.protein), parseFloat(req.body.fat), parseFloat(req.body.carbs), parseFloat(req.body.calories), parseFloat(req.body.serving_size), req.body.serving_unit, req.body.user_id];
    
    return client.query(SQL, foodArray)
    .then(result => {
        res.redirect(`/dash/${req.body.user_id}`);
      })
      .catch(err => console.log(err));

  } else if(req.body.type === 'exercise'){
    let SQL =  `INSERT INTO exercise
                (date, name, image_url, calories, fk_users)
                VALUES($1, $2, $3, $4, $5)`;

    let values = [dateStr, req.body.name, req.body.image_url, req.body.calories, req.body.user_id]

    return client.query(SQL, values)
      .then(result => {
        res.redirect(`dash/${req.body.user_id}`);
      })
      .catch(err => console.log(err));
  }      
}

//===========================
// Delete Function
//===========================

app.delete('/delete/:user_id/:entry_id/:table', deleteEntry);

function deleteEntry(req, res){
  let SQL = `DELETE from ${req.params.table} WHERE id = '${req.params.entry_id}'`;
  client.query(SQL)
    .then(result => {
      res.redirect(`/dash/${req.params.user_id}`);
    })
    .catch(err => console.log(err));
}

//===========================
// Listener
//===========================

app.listen(PORT, () => console.log(`app is up on PORT ${PORT}`));

//===========================
// Constructors
//===========================

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
};

User.prototype.tdee = function() {
  return parseInt(this.bmr() * this.activityMultiplier);
};

User.prototype.macronutrients = function() {
  let tdee = this.tdee();

  let protein = parseInt(this.weight * 0.8);
  let fat = parseInt((tdee * 0.2) / 9);
  let carbs = parseInt((tdee - (protein * 4) - (fat * 9)) / 4);

  return {'protein': protein, 'fat': fat, 'carbs': carbs};
};

function Food(id, name, image_url, calories, carbs, fat, protein, serving_size, serving_unit){
  this.id = id;
  console.log(id)
  this.name = name;
  this.image_url = image_url;
  this.calories = calories;
  this.carbs = carbs;
  this.fat = fat;
  this.protein = protein;
  this.serving_size = serving_size;
  this.serving_unit = serving_unit;
}

function Exercise(name, calories, image_url){
  this.name = name;
  this.calories = calories;
  this.image_url = image_url;
}
