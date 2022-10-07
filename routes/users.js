const express = require('express');
const router = express.Router();

var bcrypt = require('bcryptjs');

const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const Homepage = require('../models/homepageModel')
const Offer = require('../models/offerModel')
const Product = require('../models/productModel')
const Order = require('../models/orderModel')

const { check, validationResult } = require('express-validator');

let session;

router.get('/', (req, res) => {
    session = req.session;
    if (session.userId) {
        res.render('users/homepage', { title: 'Shop.', id: 'session.userId' })
    } else {
        res.render('users/homepage', { title: 'Shop.' })
    }
})

router.get('/product', (req, res) => {
    session = req.session;
    if (session.userId) {
        res.render('users/product', { title: 'Shop.', id: 'session.userId' })
    } else {
        res.render('users/product', { title: 'Shop.' })
    }
})

router.get('/login', (req, res) => {
    session = req.session;
    if (session.userstatus==='blocked') {
        console.log(session)
        console.log('5')
        req.session.destroy();
        res.render('users/login', { title: 'Login', passwordMessage: 'Username has been blocked' })
    } else if (session.userId) {
        console.log(session)
        res.redirect('/')
    } else if (session.incorrectId) {
        console.log(session)
        console.log('3')
        req.session.destroy();
        res.render('users/login', { title: 'Login', usernameMessage: 'Username does not exist' })
        
    } else if (session.incorrectPwd) {
        console.log(session)
        console.log('4')
        req.session.destroy();
        res.render('users/login', { title: 'Login', passwordMessage: 'Incorrect password' })
    } else {
        console.log(session)
        res.render('users/login', { title: 'Login' })
    }
})

router.get('/signup', (req, res) => {
    res.render('users/signup', { title: 'Signup' })
})

router.post('/signup',
    check('name').notEmpty()
        .withMessage('Please enter a Name'),
    check('mobile').matches(/[\d]{10}/)
        .withMessage("Mobile number must contain exactly 10 numbers"),
    check('username').notEmpty()
        .withMessage('Please enter a username'),
    check('username').matches(/^\w+([\._]?\w+)?@\w+(\.\w{2,3})(\.\w{2})?$/)
        .withMessage("Username must be a valid email id"),
    check('password').matches(/[\w\d!@#$%^&*?]{8,}/)
        .withMessage("Password must contain at least eight characters"),
    check('password').matches(/[a-z]/)
        .withMessage("Password must contain at least one lowercase letter"),
    check('password').matches(/[A-Z]/)
        .withMessage("Password must contain at least one uppercase letter"),
    check('password').matches(/\d/)
        .withMessage("Password must contain at least one number"),
    check('password').matches(/[!@#$%^&*?]/)
        .withMessage("Password must contain at least one special character"),
    function (req, res) {
        const errors = validationResult(req);
        console.log(errors)
        const error1 = errors.errors.find(item => item.param === 'name')||'';
        const error2 = errors.errors.find(item => item.param === 'mobile')||'';
        const error3 = errors.errors.find(item => item.param === 'username')||'';
        const error4 = errors.errors.find(item => item.param === 'password')||'';
        
        let error5='';
        if (req.body.password != req.body.confirmPassword) {
            error5 = 'Passwords do not match';
        }
        console.log(error5);
        if (!errors.isEmpty()) {
            res.render('users/signup', { title: 'Signup', nameMsg: error1.msg, mobileMsg: error2.msg, usernameMsg: error3.msg, pwdMsg: error4.msg, confirmPwdMsg: error5 });
           
        } else {
            User.find({ username: req.body.username })
                .then((result) => {
                    let user = result.find(item => item.username)
                    let hashPassword;
                    bcrypt.hash(req.body.password, 10)
                        .then(function (hash) {
                            hashPassword = hash
                            if (user) {
                                session = req.session;
                                session.userAlreadyExist = true;
                                res.redirect('/signup');
                            } else {
                                const user = new User({
                                    name: req.body.name,
                                    mobile: req.body.mobile,
                                    username: req.body.username,
                                    password: hashPassword
                                })
                                user.save()
                                    .then((result) => {
                                        console.log('success')
                                    })
                                    .catch((err) => {
                                        console.log(err)
                                    })
                                res.redirect('/login');
                            }
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
                .catch((err) => {
                    console.log(err)
                })
        }
    });

router.post('/login', function (req, res) {
    let temp;
    User.find({ username: req.body.username })
        .then((result) => {
            temp = result.find(item => item.username)
            bcrypt.compare(req.body.password, temp.password)
                .then(function (bcryptResult) {

                    if (bcryptResult) {
                        session = req.session;
                        session.userid = temp.username;
                        session.userStatus=temp.status;
                        res.redirect('/login');
                    } else {
                        session = req.session
                        session.incorrectPwd = true;
                        console.log(session)
                        console.log('1')
                        res.redirect('/login');
                        // res.render('users/login', { title: 'Login', passwordMessage: 'Incorrect password' })
                    }
                })
                .catch((err) => {
                    console.log(err)
                });
        })
        .catch((err) => {
            // console.log(err)
            session = req.session
            session.incorrectId = true;
            console.log(session)
            console.log('2')
            res.redirect('/login');
            // res.render('users/login', { title: 'Login', usernameMessage: 'Username does not exist' })
        })
});


module.exports = router;