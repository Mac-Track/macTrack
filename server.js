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

/////////dash.ejs///////////
app.get('/dash', renderDash);

/////////add.ejs///////////
app.get('/add/:type', renderAdd);

app.post('/search', search);

app.get('/custom', custom);
app.post('/history', history);

/////////results.ejs///////////
app.post('/custom', custom);

/////////customize.ejs///////////
app.post('/save', save);







//===========================
//Dashboard Function
//===========================

function renderDash (req, res) {
    return client.query(`SELECT * FROM food_entry`)
        .then(data => {
            response.render('pages/dash', {data: data.rows});
        })
        .catch(err => {
            response.render('pages/error', {err});
        })
}


//===========================
//Chart JS
//===========================

var ctx = doocument.getElementByID('barChart').getContext('2d');