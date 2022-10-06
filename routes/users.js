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
    if (session.loginId) {
        res.render('users/homepage', { title: 'Shop', id: 'session.loginId' })
    } else {
        res.render('users/homepage', { title: 'Shop' })
    }
})

router.get('/login', (req, res) => {
    session = req.session;
    if (session.loginId) {
        res.redirect('/homepage', { title: 'Shop' })
    } else if (session.incorrectId) {
        res.render('users/login', { title: 'Shop.', message: 'Username does not exist' })
    } else if (session.incorrectPwd) {
        res.render('users/login', { title: 'Shop.', message: 'Incorrect password' })
    } else {
        res.render('users/login', { title: 'Shop' })
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
        var error1 = errors.errors.find(item => item.param === 'name') || '';
        var error2 = errors.errors.find(item => item.param === 'username') || '';
        var error3 = errors.errors.find(item => item.param === 'password') || '';
        console.log(error3.msg);
        if (!errors.isEmpty()) {
            res.render('users/signup', { nameMsg: error1.msg, usernameMsg: error2.msg, pwdMsg: error3.msg });
        } else {
            User.find({ username: req.body.username })
                .then((result) => {
                    let b = result.find(item => item.username)
                    let hashPassword;
                    bcrypt.hash(req.body.password, 10)
                        .then(function (hash) {
                            hashPassword = hash
                            if (b) {
                                session = req.session;
                                session.useralreadyexist = true;
                                res.redirect('/signup');
                            } else {
                                const user = new User({
                                    name: req.body.name,
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
                                res.redirect('/');
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




module.exports = router;