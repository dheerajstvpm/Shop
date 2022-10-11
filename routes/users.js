const express = require('express');
const router = express.Router();

var bcrypt = require('bcryptjs');

const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const Homepage = require('../models/homepageModel')
const Offer = require('../models/offerModel')
const Product = require('../models/productModel')
const Order = require('../models/orderModel')

const config = require('./config')
const client = require('twilio')(config.accountSid, config.authToken)

const { check, validationResult } = require('express-validator');

let session;

let name1;
let mobileNumber1;
let username1;
let password1;
let address1;

router.get('/', (req, res) => {
    session = req.session;
    Homepage.find({})
        .then((result) => {
            if (session.userId) {
                res.render('users/homepage', { title: 'Shop.', loginId: true, result })
            } else {
                res.render('users/homepage', { title: 'Shop.', result })
            }
        })
        .catch((err) => {
            console.log(err)
        })
})

router.get('/product/:id', (req, res) => {
    session = req.session;
    const productId = req.params.id;

    Product.find({ _id: productId })
        .then((result) => {
            console.log(result);
            if (session.userId) {
                res.render('users/product', { title: 'Shop.', loginId: true, result })
            } else {
                res.render('users/product', { title: 'Shop.', result })
            }
            // res.render('admin/userHomepageLayout', { result });
        })
        .catch((err) => {
            console.log(err)
        })
})



//OTP Login

// router.get('/otpLogin', (req, res) => {
//     res.render('users/otpLogin');
// })   
// let mobileNumber;
// router.get('/otpLogin', (req, res) => {
//     res.render('users/otpLogin')
// })

// router.post('/otpLogin', (req, res) => {
//     mobileNumber = req.body.mobileNumber;
//     if (req.body.mobileNumber) {
//         client
//             .verify
//             .services(config.serviceID)
//             .verifications
//             .create({
//                 to: `+91${req.body.mobileNumber}`,
//                 channel: 'sms'
//             })
//             .then((data) => {
//                 res.redirect('/otpLoginVerify')
// res.status(200).send({
//     message: "Verification is sent!!",
//     phonenumber: req.body.mobileNumber,
//     data
// })
//             })
//     } else {
//         res.status(400).send({
//             message: "Wrong phone number or code :(",
//             phonenumber: req.body.mobileNumber
//         })
//     }

// })



router.get('/otpLoginVerify', (req, res) => {
    res.render('users/otpLoginVerify');
})
router.post('/otpLoginVerify', (req, res) => {
    if ((req.body.otp).length === 6) {
        client
            .verify
            .services(config.serviceID)
            .verificationChecks
            .create({
                to: `+91${mobileNumber1}`,
                code: req.body.otp
            })
            .then((data) => {
                if (data.status === "approved") {
                    const user = new User({
                        name: name1,
                        mobile: mobileNumber1,
                        username: username1,
                        password: password1,
                        address: address1
                    })
                    user.save()
                        .then((result) => {
                            console.log('success')
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                    res.redirect('/login');
                    // res.redirect('/')
                    // res.status(200).send({
                    //     message: "User is Verified!!",
                    //     data
                    // })
                }
            })
    } else {
        res.status(400).send({
            message: "Wrong phone number or code :(",
            phonenumber: mobileNumber1
        })
    }
})







router.get('/login', (req, res) => {
    session = req.session;
    if (session.userStatus === 'blocked') {
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
    if (session.userId) {
        res.redirect('/')
    } else if (session.userAlreadyExist) {
        res.render('users/signup', { title: 'Signup', usernameMsg: 'User Already Exists' })
    } else {
        res.render('users/signup', { title: 'Signup' })
    }
})

router.post('/signup',
    check('name').notEmpty()
        .withMessage('Please enter a Name'),
    check('mobileNumber').matches(/[\d]{10}/)
        .withMessage("Mobile number must contain exactly 10 numbers"),
    check('address').notEmpty()
        .withMessage('Please enter a Address'),
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
        const error1 = errors.errors.find(item => item.param === 'name') || '';
        const error2 = errors.errors.find(item => item.param === 'mobileNumber') || '';
        const error3 = errors.errors.find(item => item.param === 'username') || '';
        const error4 = errors.errors.find(item => item.param === 'password') || '';
        const error6 = errors.errors.find(item => item.param === 'address') || '';

        let error5 = '';
        if (req.body.password != req.body.confirmPassword) {
            error5 = 'Passwords do not match';
        }
        console.log(error5);
        if (!errors.isEmpty()) {
            res.render('users/signup', { title: 'Signup', nameMsg: error1.msg, mobileMsg: error2.msg, usernameMsg: error3.msg, pwdMsg: error4.msg, confirmPwdMsg: error5, addressMsg: error6.msg });
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
                                console.log('User Already Exist')
                                res.redirect('/signup');
                            }
                            else {
                                client
                                    .verify
                                    .services(config.serviceID)
                                    .verifications
                                    .create({
                                        to: `+91${req.body.mobileNumber}`,
                                        channel: 'sms'
                                    })
                                    .then((data) => {
                                        name1 = req.body.name,
                                            mobileNumber1 = req.body.mobileNumber,
                                            username1 = req.body.username,
                                            password1 = hashPassword,
                                            address1 = req.body.address
                                        res.redirect('/otpLoginVerify')
                                    })
                            }
                            // else {   
                            //     const user = new User({
                            //         name: req.body.name,
                            //         mobile: req.body.mobile,
                            //         username: req.body.username,
                            //         password: hashPassword,
                            //         address: req.body.address
                            //     })
                            //     user.save()
                            //         .then((result) => {
                            //             console.log('success')
                            //         })
                            //         .catch((err) => {
                            //             console.log(err)
                            //         })
                            //     res.redirect('/login');
                            // }
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
                        session.userId = temp.username;
                        session.userStatus = temp.status;
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


//User logout

router.get('/logout', function (req, res) {
    session = req.session
    session.userId = false
    session.incorrectId = false
    session.userAlreadyExist = false
    session.incorrectPwd = false
    session.userStatus = ""
    res.redirect('/');
});

module.exports = router;