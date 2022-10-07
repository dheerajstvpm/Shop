const express = require('express');
const router = express.Router();

var bcrypt = require('bcryptjs');

const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const Homepage = require('../models/homepageModel')
const Offer = require('../models/offerModel')
const Product = require('../models/productModel')
const Order = require('../models/orderModel')
const Admin = require('../models/adminModel')

const { check, validationResult } = require('express-validator');

let session;

router.get('/', (req, res) => {
    session = req.session;
    if (session.adminId) {
        res.render('admin/adminHomepage', { title: 'Shop.admin', id: 'session.adminId' })
    } else {
        res.render('admin/adminHomepage', { title: 'Shop.admin' })
    }
})

router.get('/product', (req, res) => {
    session = req.session;
    if (session.adminId) {
        res.render('admin/adminProduct', { title: 'Shop.admin', id: 'session.adminId' })
    } else {
        res.render('admin/adminProduct', { title: 'Shop.admin' })
    }
})

router.get('/adminLogin', (req, res) => {
    session = req.session;
    if (session.adminId) {
        console.log(session)
        res.redirect('/admin')
    } else if (session.incorrectAdmin) {
        console.log(session)
        console.log('3')
        req.session.destroy();
        res.render('admin/adminLogin', { title: 'Login', usernameMessage: 'Username does not exist' })

    } else if (session.incAdminPwd) {
        console.log(session)
        console.log('4')
        req.session.destroy();
        res.render('admin/adminLogin', { title: 'Login', passwordMessage: 'Incorrect password' })
    } else {
        console.log(session)
        res.render('admin/adminLogin', { title: 'Login' })
    }
})

router.get('/addNewAdmin', (req, res) => {
    res.render('admin/addNewAdmin', { title: 'Signup' })
})

router.post('/addNewAdmin',
    check('username').notEmpty()
        .withMessage('Please enter a username'),
    check('username').matches(/[\w\d!@#$%^&*?]{5,}/)
        .withMessage("Username must be a atleast five characters"),
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

        const error3 = errors.errors.find(item => item.param === 'username') || '';
        const error4 = errors.errors.find(item => item.param === 'password') || '';

        if (!errors.isEmpty()) {
            res.render('admin/addNewAdmin', { title: 'Add new admin', usernameMsg: error3.msg, pwdMsg: error4.msg});

        } else {
            Admin.find({ username: req.body.username })
                .then((result) => {
                    let user = result.find(item => item.username)
                    let hashPassword;
                    bcrypt.hash(req.body.password, 10)
                        .then(function (hash) {
                            hashPassword = hash
                            if (user) {
                                session = req.session;
                                session.adminAlreadyExist = true;
                                res.redirect('/admin/addNewAdmin');
                            } else {
                                const admin = new Admin({
                                    username: req.body.username,
                                    password: hashPassword
                                })
                                admin.save()
                                    .then((result) => {
                                        console.log('success')
                                    })
                                    .catch((err) => {
                                        console.log(err)
                                    })
                                res.redirect('/admin/adminLogin');
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

router.post('/adminLogin', function (req, res) {
    let temp;
    User.find({ username: req.body.username })
        .then((result) => {
            temp = result.find(item => item.username)
            bcrypt.compare(req.body.password, temp.password)
                .then(function (bcryptResult) {

                    if (bcryptResult) {
                        session = req.session;
                        session.adminId = temp.username;
                        res.redirect('/admin');
                    } else {
                        session = req.session
                        session.incAdminPwd = true;
                        console.log(session)
                        console.log('1')
                        res.redirect('/admin/adminLogin');
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
            session.incorrectAdmin = true;
            console.log(session)
            console.log('2')
            res.redirect('/adminLogin');
            // res.render('users/login', { title: 'Login', usernameMessage: 'Username does not exist' })
        })
});


module.exports = router;