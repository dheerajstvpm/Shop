const express = require('express')

const session = require('express-session')

const path = require('path');

const nocache = require("nocache");

const mongoose = require("mongoose")

const logger = require("morgan")

const hbs = require('express-handlebars')

const adminRouter = require('./routes/admin');
const usersRouter = require('./routes/users')

const fileUpload = require('express-fileupload')

//env
require('dotenv').config()
// console.log(process.env)
const client = require('twilio')(process.env.accountSid, process.env.authToken);



//express app
const app = express();

//moment js app
var moment = require('moment'); // require
// moment().format(); 

//connect to MongoDB
// const dbURI = "mongodb://0.0.0.0:27017/Shop"
console.log('connecting to db');

mongoose.connect(process.env.dbURI)
  .then(() => {

    //listening for requests
    app.listen(process.env.PORT);
    console.log('connected to db');
    console.log(`Node Express server listening on http://localhost:${process.env.PORT}`);
  })
  .catch((err) => console.log(err))

//fileupload
app.use(fileUpload());


// view engine setup
app.set('view engine', 'hbs');

// express-handlebars view engine setup
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  partialsDir: __dirname + '/views/partials/',
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  },
  helpers: {
    addOne: function (value, options) {
      return parseInt(value) + 1;
    },
    multiply: function (value1, value2, options) {
      return parseInt(value1 * value2);
    },
    substract: function (value1, value2, options) {
      return parseInt(value1 - value2);
    },
    dateFormat: function (timestamp) {
      return moment(new Date(timestamp)).format("MMM DD, YYYY")
    }
  }
}));



app.use(session({
  secret: process.env.sessionKey,
  saveUninitialized: true,
  cookie: { maxAge: 600000 },
  resave: false
}));

app.use(nocache());

// middleware & static files
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static('public'));
app.use(logger('dev'))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/', usersRouter);
app.use('/admin', adminRouter)

//404 page
app.use((req, res) => {
  if (session.userId) {
    res.status(404).render('error', { title: 'Shop.',loginName: session.userId })
  } else {
    res.status(404).render('error', { title: 'Shop.'})
  }
})