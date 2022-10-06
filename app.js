const express = require('express')

const session = require('express-session')

const nocache = require("nocache");

const mongoose = require("mongoose")

const logger=require("morgan")

const hbs = require('express-handlebars')

const adminRouter=require('./routes/admin');
const usersRouter=require('./routes/users')

//express app
const app = express();

//listening for requests
app.listen(3000);

//connect to MongoDB
const dbURI = "mongodb://0.0.0.0:27017/Shop"
mongoose.connect(dbURI)
  .then(() => console.log('connected to db'))
  .catch((err) => console.log(err))

// view engine setup
app.set('view engine', 'hbs');

// express-handlebars view engine setup
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  },
  helpers: {
    addOne:function (value, options) {
      return parseInt(value) + 1;
    }
  }
}));



app.use(session({
  secret: "thisismysecretkey",
  saveUninitialized: true,
  cookie: { maxAge: 600000 },
  resave: false
}));

app.use(nocache());

// middleware & static files
app.use(express.static('public'));
app.use(logger('dev'))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/',usersRouter);
app.use('/admin',adminRouter)

//404 page
app.use((req,res)=>{
    res.status(404).render('error')
})