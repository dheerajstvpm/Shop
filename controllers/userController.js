var bcrypt = require('bcryptjs');

const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const Homepage = require('../models/homepageModel')
const Offer = require('../models/offerModel')
const Product = require('../models/productModel')
const Order = require('../models/orderModel')

// const config = require('./config')

require('dotenv').config()

const client = require('twilio')(process.env.accountSid, process.env.authToken);

const { check, validationResult } = require('express-validator');

const { v4: uuidv4 } = require('uuid');
// const { log } = require('handlebars');

let session;

let name1;
let mobileNumber1;
let mobileNumber2;
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

const otpSignupVerifyGet = (req, res) => {
    session = req.session;
    if (session.userId) {
        res.redirect('/');
    } else if (session.invalidOTP) {
        session.invalidOTP = false
        res.render('users/otpLoginVerify', { otpMsg: "Wrong phone number or code" });
    } else {
        res.render('users/otpSignupVerify');
    }
}

const otpSignupVerifyPost = (req, res) => {
    if ((req.body.otp).length === 6) {
        client
            .verify
            .services(process.env.serviceID)
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
                } else {
                    session = req.session;
                    session.invalidOTP = true
                    res.redirect('/otpLoginVerify');
                }
            })
    } else {
        session = req.session;
        session.invalidOTP = true
        res.redirect('/otpLoginVerify');
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
        session.userAlreadyExist = false
        res.render('users/signup', { title: 'Shop.', usernameMsg: 'User Already Exists' })
    } else if (session.mobileAlreadyExist) {
        session.mobileAlreadyExist = false
        res.render('users/signup', { title: 'Shop.', mobileMsg: 'User with this mobile number already exists' })
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
        // User.findOne({ mobile: req.body.mobileNumber })
        //     .then((result) => {
        //         console.log(result)
        //         session = req.session;
        //         session.mobileAlreadyExist = true;
        //         console.log('mobile Already Exist')
        //         res.redirect('/signup');
        //     })
        // User.findOne({ username: req.body.username })
        //     .then((result) => {
        //         console.log(result)
        //         session = req.session;
        //         session.userAlreadyExist = true;
        //         console.log('User Already Exist')
        //         res.redirect('/signup');
        //         // let user = result.find(item => item.username)
        //         // let mobile = result.find(item => item.mobileNumber)

        //     })
        Promise.all([User.findOne({ username: req.body.username }), User.findOne({ mobile: req.body.mobileNumber })])
            .then((result) => {
                let usernameResult, mobileResult;
                [usernameResult, mobileResult] = result;
                if (usernameResult) {
                    console.log(result)
                    session = req.session;
                    session.userAlreadyExist = true;
                    console.log('User Already Exist')
                    res.redirect('/signup');
                } else if (mobileResult) {
                    console.log(result)
                    session = req.session;
                    session.mobileAlreadyExist = true;
                    console.log('mobile Already Exist')
                    res.redirect('/signup');
                } else {
                    let hashPassword;
                    bcrypt.hash(req.body.password, 10)
                        .then(function (hash) {
                            hashPassword = hash

                            client
                                .verify
                                .services(process.env.serviceID)
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
                                    res.redirect('/otpSignupVerify')
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
                result.count = 1;
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
                                User.updateOne({ "name": session.userId, "cart._id": productId }, { $inc: { "cart.$.count": 1 } })
                                    .then((result) => {
                                        console.log(result)

                                        //Update stock

                                        // Product.updateOne({ "_id": productId }, { $inc: { "stock": -1 } })
                                        //     .then((result) => {
                                        //         console.log(result)
                                        //     })
                                        //     .catch((err) => {
                                        //         console.log(err)
                                        //     })
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

                                    //Update stock

                                    // Product.updateOne({ "_id": productId }, { $inc: { "stock": -1 } })
                                    //     .then((result) => {
                                    //         console.log(result)
                                    //         res.redirect('back')
                                    //     })
                                    //     .catch((err) => {
                                    //         console.log(err)
                                    //     })
                                    res.redirect('back')
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

                                //Update stock

                                // Product.updateOne({ "_id": productId }, { $inc: { "stock": 1 } })
                                //     .then((result) => {
                                //         console.log(result)
                                //     })
                                //     .catch((err) => {
                                //         console.log(err)
                                //     })
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
                    User.findOneAndUpdate({ name: session.userId }, { $pull: { cart: { _id: productId } } })
                        .then((result) => {
                            // console.log(result)

                            //Update stock
                            // Product.updateOne({ "_id": productId }, { $inc: { "stock": 1 } })
                            //     .then((result) => {
                            //         console.log(result)
                            //         res.redirect('/cart')
                            //     })
                            //     .catch((err) => {
                            //         console.log(err)
                            //     })
                            res.redirect('back')
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


const userWishlistGet = (req, res) => {
    session = req.session;
    if (session.userId) {
        User.findOne({ name: session.userId })
            .then((result) => {
                // const sum = function (items, prop1, prop2) {
                //     return items.reduce(function (a, b) {
                //         return parseInt(a) + (parseInt(b[prop1]) * parseInt(b[prop2]));
                //     }, 0);
                // };
                // const total = sum(result.wishlist, 'price', 'count');
                // console.log(result)
                res.render('users/wishlist', { title: 'Shop.', loginName: session.userId, result })
            })
            .catch((err) => {
                console.log(err)
            })

    } else {
        res.redirect('/login')
    }
}



const addToWishlistGet = (req, res) => {
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
                result.count = 1;
                console.log(result)
                User.findOne({ name: session.userId })
                    .then((out) => {
                        const checks = out.wishlist
                        console.log(checks);
                        let n = 0;
                        for (const check of checks) {
                            if (check._id == productId) {
                                console.log(check)
                                console.log(check.productName)
                                check.count = check.count + 1;
                                User.updateOne({ "name": session.userId, "wishlist._id": productId }, { $inc: { "wishlist.$.count": 1 } })
                                    .then((result) => {
                                        console.log(result)

                                        //Update stock

                                        // Product.updateOne({ "_id": productId }, { $inc: { "stock": -1 } })
                                        //     .then((result) => {
                                        //         console.log(result)
                                        //     })
                                        //     .catch((err) => {
                                        //         console.log(err)
                                        //     })
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
                            User.findOneAndUpdate({ name: session.userId }, { $push: { wishlist: result } })
                                .then((result) => {
                                    // console.log(result)

                                    //Update stock

                                    // Product.updateOne({ "_id": productId }, { $inc: { "stock": -1 } })
                                    //     .then((result) => {
                                    //         console.log(result)
                                    //         res.redirect('back')
                                    //     })
                                    //     .catch((err) => {
                                    //         console.log(err)
                                    //     })
                                    res.redirect('back')
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


const removeFromWishlist = (req, res) => {
    session = req.session;
    if (session.userId) {
        console.log(req.params);
        let productId = req.params.productId;
        console.log(session.userId);
        console.log(productId);

        User.findOne({ name: session.userId })
            .then((out) => {
                const checks = out.wishlist
                console.log(checks);
                let n = 0;
                for (const check of checks) {
                    if (check._id == productId && check.count > 1) {
                        console.log(check)
                        console.log(check.productName)
                        check.count = check.count + 1;
                        // User.findOneAndUpdate({ name: session.userId }, { $push: { wishlist: result } })
                        User.updateOne({ "name": session.userId, "wishlist._id": productId }, { $inc: { "wishlist.$.count": -1 } })
                            .then((result) => {
                                console.log(result)

                                //Update stock

                                // Product.updateOne({ "_id": productId }, { $inc: { "stock": 1 } })
                                //     .then((result) => {
                                //         console.log(result)
                                //     })
                                //     .catch((err) => {
                                //         console.log(err)
                                //     })
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                        n++;
                    }
                }
                console.log(n)
                if (n > 0) {
                    res.redirect('/wishlist')
                } else {
                    User.findOneAndUpdate({ name: session.userId }, { $pull: { wishlist: { _id: productId } } })
                        .then((result) => {
                            // console.log(result)

                            //Update stock
                            // Product.updateOne({ "_id": productId }, { $inc: { "stock": 1 } })
                            //     .then((result) => {
                            //         console.log(result)
                            //         res.redirect('/wishlist')
                            //     })
                            //     .catch((err) => {
                            //         console.log(err)
                            //     })
                            res.redirect('/wishlist')
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                }
            })
            .catch((err) => {
                console.log(err)
            })
        // User.findOneAndUpdate({ name: session.userId }, { $pull: { wishlist: { unique: productId } } })
        //     .then((out) => {
        // const checks = out.wishlist
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
        //         res.redirect('/wishlist/')
        //     })
        //     .catch((err) => {
        //         console.log(err)
        //     })
        //         res.redirect('/wishlist/')
        // })
        // .catch((err) => {
        //     console.log(err)
        // })
    } else {
        res.redirect('/login')
    }
}

const buyNowGet = (req, res) => {
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
                res.render('users/buyNow', { title: 'Shop.', loginName: session.userId, result, total: total })
            })
            .catch((err) => {
                console.log(err)
            })
    } else {
        res.redirect('/login')
    }
}

const buyNowPost = (req, res) => {
    session = req.session;
    if (session.userId) {
        User.findOne({ name: session.userId })
            .then((result) => {
                // console.log(result)
                const cartItems = result.cart
                const orders = result.order
                console.log(cartItems)

                let n = 0;
                function operation() {
                    ++n;
                    if (n === 3 * (cartItems.length)) {
                        res.redirect('/order');
                    }
                }

                for (let cartItem of cartItems) {
                    cartItem = cartItem.toJSON();
                    cartItem.address = req.body.address;
                    cartItem.paymentOption = req.body.paymentOption;
                    cartItem.unique = uuidv4()
                    cartItem.orderStatus = 'Order is under process'
                    stockId = cartItem._id
                    console.log(stockId)
                    removeCount = cartItem.count * -1;
                    console.log(removeCount)
                    // Promise.all([User.findOneAndUpdate({ name: session.userId }, { $push: { order: cartItem } }), Product.updateOne({ "_id": stockId }, { $inc: { "stock": removeCount } })])
                    //     .then((result) => {
                    //         console.log(result)
                    //     })
                    //     .catch((err) => {
                    //         console.log(err)
                    //     })

                    //Push cart to order
                    User.findOneAndUpdate({ name: session.userId }, { $push: { order: cartItem } })
                        .then((result) => {
                            operation();
                            // Empty cart
                            User.findOneAndUpdate({ name: session.userId }, { $set: { cart: [] } })
                                .then((result) => {
                                    operation();
                                })
                                .catch((err) => {
                                    console.log(err)
                                })
                        })
                        .catch((err) => {
                            console.log(err)
                        })

                    // Update stock
                    Product.updateOne({ "_id": stockId }, { $inc: { "stock": removeCount } })
                        .then((result) => {
                            console.log(result)
                            operation();
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                }




                // result = result.toJSON()
                // result.count = 1;
                // console.log(result)
                // User.findOne({ name: session.userId })
                //     .then((out) => {
                //         const checks = out.cart
                //         console.log(checks);
                //         let n = 0;
                //         for (const check of checks) {
                //             if (check._id == productId) {
                //                 console.log(check)
                //                 console.log(check.productName)
                //                 check.count = check.count + 1;
                //                 User.updateOne({ "name": session.userId, "cart._id": productId }, { $inc: { "cart.$.count": 1 } })
                //                     .then((result) => {
                //                         console.log(result)

                //                         //Update stock

                //                         // Product.updateOne({ "_id": productId }, { $inc: { "stock": -1 } })
                //                         //     .then((result) => {
                //                         //         console.log(result)
                //                         //     })
                //                         //     .catch((err) => {
                //                         //         console.log(err)
                //                         //     })
                //                     })
                //                     .catch((err) => {
                //                         console.log(err)
                //                     })
                //                 n++;
                //             }
                //         }
                //         console.log(n)
                //         if (n > 0) {
                //             res.redirect('back')
                //         } else {
                //             User.findOneAndUpdate({ name: session.userId }, { $push: { cart: result } })
                //                 .then((result) => {
                //                     // console.log(result)

                //                     //Update stock

                //                     // Product.updateOne({ "_id": productId }, { $inc: { "stock": -1 } })
                //                     //     .then((result) => {
                //                     //         console.log(result)
                //                     //         res.redirect('back')
                //                     //     })
                //                     //     .catch((err) => {
                //                     //         console.log(err)
                //                     //     })
                //                     res.redirect('back')
                //                 })
                //                 .catch((err) => {
                //                     console.log(err)
                //                 })
                //         }
                //     })
                //     .catch((err) => {
                //         console.log(err)
                //     })
            })
            .catch((err) => {
                console.log(err)
            })
    } else {
        res.redirect('/login')
    }
}

const orderGet = (req, res) => {
    session = req.session;
    if (session.userId) {
        User.findOne({ name: session.userId })
            .then((result) => {
                const sum = function (items, prop1, prop2) {
                    return items.reduce(function (a, b) {
                        return parseInt(a) + (parseInt(b[prop1]) * parseInt(b[prop2]));
                    }, 0);
                };
                const total = sum(result.order, 'price', 'count');
                // console.log(result)
                result = result.order.reverse()
                res.render('users/order', { title: 'Shop.', loginName: session.userId, result, total: total })
            })
            .catch((err) => {
                console.log(err)
            })

    } else {
        res.redirect('/login')
    }
}

const cancelOrderGet = (req, res) => {
    session = req.session;
    productId = req.params.id;
    if (session.userId) {
        User.updateOne({ "name": session.userId, "order.unique": productId }, { $set: { "order.$.orderStatus": "Order cancelled" } })
            .then((result) => {
                res.redirect('/order')
            })
            .catch((err) => {
                console.log(err)
            })
    } else {
        res.redirect('/login')
    }
}

const userMobileLoginGet = (req, res) => {
    session = req.session;
    if (session.userId) {
        res.redirect('/')
    } else if (session.otpLoginErrors) {
        session.otpLoginErrors = false
        const error1 = otpLoginErrors.errors.find(item => item.param === 'mobileNumber') || '';
        res.render('users/mobileLogin', { title: 'Shop.', mobileMsg: error1.msg });
    } else if (session.mobileNotFound) {
        session.mobileNotFound = false;
        res.render('users/mobileLogin', { title: 'Shop.', mobileMsg: "Mobile number not found" });
    } else {
        res.render('users/mobileLogin', { title: 'Shop.' })
    }
}
let otpLoginErrors;
const userMobileLoginPost = (req, res) => {
    session = req.session;
    otpLoginErrors = validationResult(req);
    if (!otpLoginErrors.isEmpty()) {
        session.otpLoginErrors = true
        res.redirect('/mobileLogin')
    } else {
        User.findOne({ mobile: req.body.mobile })
            .then((result) => {
                if (result) {
                    client
                        .verify
                        .services(process.env.serviceID)
                        .verifications
                        .create({
                            to: `+91${req.body.mobile}`,
                            channel: 'sms'
                        })
                        .then((data) => {
                            mobileNumber2 = req.body.mobile,
                                res.redirect('/otpLoginVerify')
                        })
                } else {
                    console.log(result)
                    session = req.session;
                    session.mobileNotFound = true;
                    console.log('mobile do not Exist')
                    res.redirect('/mobileLogin');
                }
            })
    }
}

const otpLoginVerifyGet = (req, res) => {
    session = req.session;
    if (session.userId) {
        res.redirect('/');
    } else if (session.invalidOTP) {
        session.invalidOTP = false
        res.render('users/otpLoginVerify', { otpMsg: "Wrong phone number or code" });
    } else {
        res.render('users/otpLoginVerify');
    }
}

const otpLoginVerifyPost = (req, res) => {
    if ((req.body.otp).length === 6) {
        client
            .verify
            .services(process.env.serviceID)
            .verificationChecks
            .create({
                to: `+91${mobileNumber2}`,
                code: req.body.otp
            })
            .then((data) => {
                if (data.status === "approved") {
                    User.findOne({ mobile: mobileNumber2 })
                        .then((result) => {
                            console.log(result)
                            session = req.session;
                            session.userId = result.name;
                            session.userStatus = result.status;
                            res.redirect('/login');
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                } else {
                    session = req.session;
                    session.invalidOTP = true
                    res.redirect('/otpLoginVerify');
                }
            })
    } else {
        session = req.session;
        session.invalidOTP = true
        res.redirect('/otpLoginVerify');
    }
}



const userlogout = function (req, res) {
    session = req.session
    session.userId = false
    session.invalidOTP = false
    session.incorrectId = false
    session.userAlreadyExist = false
    session.mobileAlreadyExist = false
    session.incorrectPwd = false
    session.otpLoginErrors = false
    session.userStatus = ""
    res.redirect('/');
}



module.exports = {
    userHome,
    product,
    otpSignupVerifyGet,
    otpSignupVerifyPost,
    userLoginGet,
    userLoginPost,
    userSignupGet,
    userSignupPost,
    userlogout,
    userCartGet,
    addToCartGet,
    removeFromCart,
    userWishlistGet,
    addToWishlistGet,
    removeFromWishlist,
    buyNowGet,
    buyNowPost,
    orderGet,
    cancelOrderGet,
    userMobileLoginGet,
    userMobileLoginPost,
    otpLoginVerifyGet,
    otpLoginVerifyPost
}