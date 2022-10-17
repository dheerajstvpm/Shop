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

// const { v4: uuidv4 } = require('uuid');
const { log } = require('handlebars');

let session;

let name1;
let mobileNumber1;
let username1;
let password1;
let address1;



const userHome = (req, res) => {
    session = req.session;
    // To be deleted
    // session.userId = 'Amal';
    //
    Homepage.find({})
        .then((result) => {
            // console.log(result)
            if (session.userId) {
                res.render('users/homepage', { title: 'Shop.', loginName: session.userId, result })
            } else {
                res.render('users/homepage', { title: 'Shop.', result })
            }
        })
        .catch((err) => {
            console.log(err)
        })
}

const product = (req, res) => {
    session = req.session;
    const productId = req.params.id;
    console.log(productId)
    Product.find({ _id: productId })
        .then((result) => {
            console.log(result);
            if (session.userId) {
                res.render('users/product', { title: 'Shop.', loginId: session.userId, result })
            } else {
                res.render('users/product', { title: 'Shop.', result })
            }
            // res.render('admin/userHomepageLayout', { result });
        })
        .catch((err) => {
            console.log(err)
        })
}

const otpLoginVerifyGet = (req, res) => {
    session = req.session;
    if (session.userId) {
        res.redirect('/');
    } else {
        res.render('users/otpLoginVerify');
    }
}

const otpLoginVerifyPost = (req, res) => {
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
                }
            })
    } else {
        res.status(400).send({
            message: "Wrong phone number or code :(",
            phonenumber: mobileNumber1
        })
    }
}

const userLoginGet = (req, res) => {
    session = req.session;
    if (session.userStatus === 'blocked') {
        console.log(session)
        console.log('5')
        req.session.destroy();
        res.render('users/login', { title: 'Shop.', passwordMessage: 'Username has been blocked' })
    } else if (session.userId) {
        console.log(session)
        res.redirect('/')
    } else if (session.incorrectId) {
        console.log(session)
        console.log('3')
        req.session.destroy();
        res.render('users/login', { title: 'Shop.', usernameMessage: 'Username does not exist' })
    } else if (session.incorrectPwd) {
        console.log(session)
        console.log('4')
        req.session.destroy();
        res.render('users/login', { title: 'Shop.', passwordMessage: 'Incorrect password' })
    } else {
        console.log(session)
        res.render('users/login', { title: 'Shop.' })
    }
}

const userLoginPost = function (req, res) {
    let temp;
    User.find({ username: req.body.username })
        .then((result) => {
            temp = result.find(item => item.username)
            bcrypt.compare(req.body.password, temp.password)
                .then(function (bcryptResult) {

                    if (bcryptResult) {
                        session = req.session;
                        session.userId = temp.name;
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
}

const userSignupGet = (req, res) => {
    session = req.session;
    if (session.userId) {
        res.redirect('/')
    } else if (session.userAlreadyExist) {
        res.render('users/signup', { title: 'Shop.', usernameMsg: 'User Already Exists' })
    } else if (session.signupErrors) {
        session.signupErrors = false
        const error1 = signupErrors.errors.find(item => item.param === 'name') || '';
        const error2 = signupErrors.errors.find(item => item.param === 'mobileNumber') || '';
        const error3 = signupErrors.errors.find(item => item.param === 'username') || '';
        const error4 = signupErrors.errors.find(item => item.param === 'password') || '';
        const error5 = signupErrors.errors.find(item => item.param === 'confirmPassword') || '';
        const error6 = signupErrors.errors.find(item => item.param === 'address') || '';
        res.render('users/signup', { title: 'Shop.', nameMsg: error1.msg, mobileMsg: error2.msg, usernameMsg: error3.msg, pwdMsg: error4.msg, confirmPwdMsg: error5.msg, addressMsg: error6.msg });
    } else {
        res.render('users/signup', { title: 'Shop.' })
    }
}
let signupErrors;
const userSignupPost = function (req, res) {
    session = req.session;
    signupErrors = validationResult(req);
    if (!signupErrors.isEmpty()) {
        session.signupErrors = true
        res.redirect('/signup')
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
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            })
            .catch((err) => {
                console.log(err)
            })
    }
}



const userCartGet = (req, res) => {
    // console.log(req.params);
    // let userId = req.params.id;
    // console.log(userId);
    session = req.session;
    if (session.userId) {
        User.findOne({ name: session.userId })
            .then((result) => {
                const sum = function (items, prop1, prop2) {
                    return items.reduce(function (a, b) {
                        return parseInt(a) + (parseInt(b[prop1]) * parseInt(b[prop2]));
                    }, 0);
                };
                const total = sum(result.cart, 'price', 'count');
                // console.log(result)
                res.render('users/cart', { title: 'Shop.', loginName: session.userId, result, total: total })
            })
            .catch((err) => {
                console.log(err)
            })

    } else {
        res.redirect('/login')
    }
}

const userCartPost = (req, res) => {
    if (session.userId) {
        res.redirect('/cart')
    } else {
        res.redirect('/login')
    }
}

// const addToCartGet = (req, res) => {
//     session = req.session;
//     // To be deleted
//     session.userId = 'Amal';
//     //
//     if (session.userId) {
//         console.log(req.params);
//         let productId = req.params.productId;
//         console.log(session.userId);
//         console.log(productId);
//         Product.findOne({ _Id: productId })
//             .then((result) => {
//                 console.log(result)
//                 let product={result}
//                 console.log(product)
//                 User.findOneAndUpdate({ name: session.userId }, { $push: { cart: product } })
//                     .then((result) => {
//                         // console.log(result)
//                         res.redirect('/')
//                     })
//                     .catch((err) => {
//                         console.log(err)
//                     })
//             })
//             .catch((err) => {
//                 console.log(err)
//             })
//     } else {
//         res.redirect('/login')
//     }
// }


const addToCartGet = (req, res) => {
    session = req.session;
    // To be deleted
    // session.userId = 'Amal';
    //
    if (session.userId) {
        console.log(req.params);
        let productId = req.params.productId;
        console.log(session.userId);
        console.log(productId);
        Product.findOne({ _id: productId })
            .then((result) => {
                console.log(result)
                result = result.toJSON()
                // const obj=result;
                // obj.unique='111'
                result.count = 1;
                // Object.defineProperty(result, "unique", { writable: false, value: 11 })
                // let product = { result }
                // console.log(obj)
                console.log(result)
                User.findOne({ name: session.userId })
                    .then((out) => {
                        const checks = out.cart
                        console.log(checks);
                        let n = 0;
                        for (const check of checks) {
                            if (check._id == productId) {
                                console.log(check)
                                console.log(check.productName)
                                check.count = check.count + 1;
                                // User.findOneAndUpdate({ name: session.userId }, { $push: { cart: result } })
                                User.updateOne({ "name": session.userId, "cart._id": productId }, { $inc: { "cart.$.count": 1 } })
                                    .then((result) => {
                                        console.log(result)
                                        Product.updateOne({ "_id": productId }, { $inc: { "stock": -1 } })
                                            .then((result) => {
                                                console.log(result)
                                            })
                                            .catch((err) => {
                                                console.log(err)
                                            })
                                    })
                                    .catch((err) => {
                                        console.log(err)
                                    })
                                n++;
                            }
                        }
                        console.log(n)
                        if (n > 0) {
                            res.redirect('back')
                        } else {
                            User.findOneAndUpdate({ name: session.userId }, { $push: { cart: result } })
                                .then((result) => {
                                    // console.log(result)
                                    Product.updateOne({ "_id": productId }, { $inc: { "stock": -1 } })
                                        .then((result) => {
                                            console.log(result)
                                            res.redirect('back')
                                        })
                                        .catch((err) => {
                                            console.log(err)
                                        })
                                })
                                .catch((err) => {
                                    console.log(err)
                                })
                        }
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            })
            .catch((err) => {
                console.log(err)
            })
    } else {
        res.redirect('/login')
    }
}

// const removeFromCart = (req, res) => {
//     session = req.session;
//     if (session.userId) {
//         console.log(req.params);
//         let productId = req.params.productId;
//         console.log(session.userId);
//         console.log(productId);
//         User.findOneAndUpdate({ name: session.userId }, { $pull: { cart: { '_id': productId } } })
//             .then((result) => {
//                 console.log(result)
//                 res.redirect('/cart/')
//             })
//             .catch((err) => {
//                 console.log(err)
//             })
//     } else {
//         res.redirect('/login')
//     }
// }

const removeFromCart = (req, res) => {
    session = req.session;
    if (session.userId) {
        console.log(req.params);
        let productId = req.params.productId;
        console.log(session.userId);
        console.log(productId);

        User.findOne({ name: session.userId })
            .then((out) => {
                const checks = out.cart
                console.log(checks);
                let n = 0;
                for (const check of checks) {
                    if (check._id == productId && check.count > 1) {
                        console.log(check)
                        console.log(check.productName)
                        check.count = check.count + 1;
                        // User.findOneAndUpdate({ name: session.userId }, { $push: { cart: result } })
                        User.updateOne({ "name": session.userId, "cart._id": productId }, { $inc: { "cart.$.count": -1 } })
                            .then((result) => {
                                console.log(result)
                                Product.updateOne({ "_id": productId }, { $inc: { "stock": 1 } })
                                    .then((result) => {
                                        console.log(result)
                                    })
                                    .catch((err) => {
                                        console.log(err)
                                    })
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                        n++;
                    }
                }
                console.log(n)
                if (n > 0) {
                    res.redirect('/cart')
                } else {
                    User.findOneAndUpdate({ name: session.userId }, { $pull: { cart: { _id: productId } } })
                        .then((result) => {
                            // console.log(result)
                            Product.updateOne({ "_id": productId }, { $inc: { "stock": 1 } })
                                .then((result) => {
                                    console.log(result)
                                    res.redirect('/cart')
                                })
                                .catch((err) => {
                                    console.log(err)
                                })
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                }
            })
            .catch((err) => {
                console.log(err)
            })
        // User.findOneAndUpdate({ name: session.userId }, { $pull: { cart: { unique: productId } } })
        //     .then((out) => {
        // const checks = out.cart
        // console.log(checks);
        // let removeCount = 0;
        // let removeId = 0;
        // for (const check of checks) {
        //     if (check.unique == productId) {
        //         console.log(check)
        //         console.log(check.count)
        //         removeId = check._id
        //         removeCount = check.count
        //     }
        // }
        // console.log(removeCount)
        // console.log(removeId)
        // Product.updateOne({ "_id": removeId }, { $inc: { "stock": removeCount } })
        //     .then((result) => {
        //         console.log(result)
        //         res.redirect('/cart/')
        //     })
        //     .catch((err) => {
        //         console.log(err)
        //     })
        //         res.redirect('/cart/')
        // })
        // .catch((err) => {
        //     console.log(err)
        // })
    } else {
        res.redirect('/login')
    }
}

const userlogout = function (req, res) {
    session = req.session
    session.userId = false
    session.incorrectId = false
    session.userAlreadyExist = false
    session.incorrectPwd = false
    session.userStatus = ""
    res.redirect('/');
}



module.exports = {
    userHome,
    product,
    otpLoginVerifyGet,
    otpLoginVerifyPost,
    userLoginGet,
    userLoginPost,
    userSignupGet,
    userSignupPost,
    userlogout,
    userCartGet,
    userCartPost,
    addToCartGet,
    removeFromCart
}