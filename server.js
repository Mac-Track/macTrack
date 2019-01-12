'use strict'


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

/////////dash.ejs///////////
app.get(':id/dash/', renderDash);

/////////add.ejs///////////
app.get(':id/add/:type', renderAdd);

function renderAdd(req, res){
  let type = req.params.type;
  let id = req.params.id;
  if(type === 'food'){
    // send array of entries of type
    let sql = 'SELECT * FROM food_entry WHERE fk_users=$1;';
    let client = [id];
    return client.query(sql, client)
    .then(data => {
      res.render('pages/add.ejs', {entries: data.rows, search_type: type, user_id: id});
    })
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
    return client.query(`SELECT * FROM food_entry`)
        .then(data => {
            res.render('pages/dash.ejs', {food_entry: data.rows, date: dateStr}); 
        })
        .catch(err => {
            res.render('pages/error.ejs', {err});
    })
}
 

//===========================
//Chart JS
//===========================

// var ctx = document.getElementByID('barChart').getContext('2d');