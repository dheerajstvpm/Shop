const express = require('express');
const router = express.Router();

var bcrypt = require('bcryptjs');

const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const Homepage = require('../models/homepageModel')
const Offer = require('../models/offerModel')
const Product = require('../models/productModel')
const Order = require('../models/orderModel')

const config = require('../controllers/config')
const client = require('twilio')(config.accountSid, config.authToken)

const { check, validationResult } = require('express-validator');

const userController = require('../controllers/userController')

let session;

let name1;
let mobileNumber1;
let username1;
let password1;
let address1;

router.get('/', userController.userHome)

router.get('/product/:id', userController.product)

router.get('/otpLoginVerify', userController.otpLoginVerifyGet)

router.post('/otpLoginVerify', userController.otpLoginVerifyPost)

router.get('/login', userController.userLoginGet)

router.post('/login', userController.userLoginPost);

router.get('/signup', userController.userSignupGet)

router.post('/signup',
    check('name').notEmpty()
        .withMessage('Please enter a Name'),
    check('mobileNumber').matches(/[\d]{10}/)
        .withMessage("Mobile number must contain exactly 10 numbers"),
    check('mobileNumber').matches(/^[6-9][\d]{9}/)
        .withMessage("Please enter a valid mobile number"),
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
    userController.userSignupPost);

router.get('/logout', userController.userlogout);

module.exports = router;