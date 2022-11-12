var bcrypt = require('bcryptjs');

const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const Homepage = require('../models/homepageModel')
const Offer = require('../models/offerModel')
const Coupon = require('../models/couponModel')
const Product = require('../models/productModel')
const Order = require('../models/orderModel')


// const config = require('./config')

require('dotenv').config()

const client = require('twilio')(process.env.accountSid, process.env.authToken);

const { check, validationResult } = require('express-validator');

const crypto = require("crypto");

const { v4: uuidv4 } = require('uuid');
// const { log } = require('handlebars');

//Razorpay
const Razorpay = require('razorpay');
const instance = new Razorpay({
    key_id: process.env.razorPayTestKeyId,
    key_secret: process.env.razorPayTestKeySecret,
});




let session;

let name1;
let mobileNumber1;
let mobileNumber2;
let username1;
let password1;
// let address1;



const userHome = (req, res) => {
    session = req.session;
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

const product = async (req, res) => {
    session = req.session;
    const productId = req.params.id;
    console.log(productId)
    try {
        const result = await Product.findOne({ _id: productId })
        // console.log(result);
        try {
            const out = await Offer.findOne({ offerName: result.offer })
            const discount = out.discount * result.price / 100
            const offerPrice = result.price - discount
            if (session.userId) {
                console.log(result)
                console.log(offerPrice)
                res.render('users/product', { title: 'Shop.', loginName: session.userId, offerPrice: offerPrice, result })
            } else {
                console.log(result)
                console.log(offerPrice)
                res.render('users/product', { title: 'Shop.', offerPrice: offerPrice, result })
            }
            // res.render('admin/userHomepageLayout', { result });
        }
        catch (err) {
            console.log(err)
        }
    }
    catch (err) {
        console.log(err)
    }
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
                        // address: address1
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
        res.render('users/login', { title: 'Shop.', passwordMessage: 'Password incorrect' })
    } else {
        console.log(session)
        res.render('users/login', { title: 'Shop.' })
    }
}

const userLoginPost = function (req, res) {
    let temp;
    User.findOne({ username: req.body.username.toLowerCase() })
        .then((result) => {
            // temp = result.find(item => item.username)
            bcrypt.compare(req.body.password, result.password)
                .then(function (bcryptResult) {

                    if (bcryptResult) {
                        session = req.session;
                        session.userId = result.name;
                        console.log(result._id);
                        console.log(typeof result._id)
                        session.uid = result._id
                        // .toHexString();
                        // session.kid = "Hi";
                        console.log(session.uid)
                        console.log(typeof session.uid)
                        session.userStatus = result.status;
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
            console.log(err)
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

        res.render('users/signup', { title: 'Shop.', nameMsg: error1.msg, mobileMsg: error2.msg, usernameMsg: error3.msg, pwdMsg: error4.msg, confirmPwdMsg: error5.msg });
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
        Promise.all([User.findOne({ username: req.body.username.toLowerCase() }), User.findOne({ mobile: req.body.mobileNumber })])
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
                                    console.log(data)
                                    name1 = req.body.name,
                                        mobileNumber1 = req.body.mobileNumber,
                                        username1 = req.body.username.toLowerCase(),
                                        password1 = hashPassword,
                                        // address1 = req.body.address
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



const userCartGet = async (req, res) => {
    // console.log(req.params);
    // let userId = req.params.id;
    // console.log(userId);
    session = req.session;
    if (session.userId) {
        console.log(session.uid)
        try {
            const result = await User.findById({ _id: session.uid })

            //-------------------------
            const carts = result.cart
            const cartArray = []
            for (let cart of carts) {
                cart = cart.toJSON()
                try {
                    const out = await Offer.findOne({ offerName: cart.offer })
                    console.log(out.discount)
                    const discount = out.discount * cart.price / 100
                    const offerPrice = cart.price - discount
                    cart.offerPrice = offerPrice
                    cartArray.push(cart)
                } catch (err) {
                    console.log(err)
                }
            }
            //--------------------
            const sum = function (items, prop1, prop2) {
                return items.reduce(function (a, b) {
                    return parseInt(a) + (parseInt(b[prop1]) * parseInt(b[prop2]));
                }, 0);
            };
            const total = sum(cartArray, 'offerPrice', 'count');
            console.log(cartArray)
            res.render('users/cart', { title: 'Shop.', loginName: session.userId, cartArray, total: total })
        } catch (err) {
            console.log(err)
        }
    } else {
        res.redirect('/login')
    }
}

const buyNowToCart = (req, res) => {
    session = req.session;

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
                User.findOne({ _id: session.uid })
                    .then((out) => {
                        const checks = out.cart
                        console.log(checks);
                        let n = 0;
                        for (const check of checks) {
                            if (check._id == productId) {
                                console.log(check)
                                console.log(check.productName)
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
                            res.redirect('/cart/')
                        } else {
                            User.findOneAndUpdate({ _id: session.uid }, { $push: { cart: result } })
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
                                    res.redirect('/cart/')
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

const addToCartGet = (req, res) => {
    session = req.session;

    if (session.userId) {
        console.log(req.params);
        let productId = req.params.productId;
        console.log(session.userId);
        console.log(productId);
        Product.findOne({ _id: productId })
            .then((result) => {
                // console.log(result)
                result = result.toJSON()
                result.count = 1;
                console.log(result)
                User.findOne({ _id: session.uid })
                    .then((out) => {
                        const checks = out.cart
                        // console.log(checks);
                        let n = 0;
                        async function f() {
                            let cartItem;
                            for (const check of checks) {
                                if (check._id == productId) {
                                    console.log(check)
                                    cartItem = check
                                    // console.log(check.productName)
                                    // check.count = check.count + 1;
                                    try {
                                        await User.updateOne({ "name": session.userId, "cart._id": productId }, { $inc: { "cart.$.count": 1 } })
                                    }
                                    catch (err) {
                                        console.log(err)
                                    }
                                    n++;
                                }
                            }
                            console.log(cartItem)

                            console.log(n)
                            if (n > 0) {
                                //------------------------------
                                try {
                                    const result = await User.findById({ _id: session.uid })

                                    //-------------------------
                                    const carts = result.cart
                                    const cartArray = []
                                    for (let cart of carts) {
                                        cart = cart.toJSON()
                                        try {
                                            const out = await Offer.findOne({ offerName: cart.offer })
                                            console.log(out.discount)
                                            const discount = out.discount * cart.price / 100
                                            const offerPrice = cart.price - discount
                                            cart.offerPrice = offerPrice
                                            cartArray.push(cart)
                                        } catch (err) {
                                            console.log(err)
                                        }
                                    }
                                    //--------------------
                                    const sum = function (items, prop1, prop2) {
                                        return items.reduce(function (a, b) {
                                            return parseInt(a) + (parseInt(b[prop1]) * parseInt(b[prop2]));
                                        }, 0);
                                    };
                                    const total = sum(cartArray, 'offerPrice', 'count');
                                    console.log(cartArray)
                                    userData = await User.findOne({ "name": session.userId })
                                    cartItems = userData.cart
                                    let cartItem;
                                    for (cartItem of cartItems) {
                                        if (cartItem._id == productId) {
                                            break;
                                        }
                                    }
                                    cartItem = cartItem.toJSON()
                                    cartItem.total = total;
                                    res.json(cartItem)
                                } catch (err) {
                                    console.log(err)
                                }
                                //------------------------------
                                // res.redirect('back')
                            } else {
                                User.findOneAndUpdate({ _id: session.uid }, { $push: { cart: result } })
                                    .then((result) => {
                                        console.log(result)

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
                        }
                        f();
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


const removeFromCart = async (req, res) => {
    session = req.session;
    if (session.userId) {
        console.log(req.params);
        let productId = req.params.productId;
        console.log(session.userId);
        console.log(productId);
        try {
            out = await User.findOne({ _id: session.uid })

            const checks = out.cart
            console.log(checks);
            let n = 0;

            for (const check of checks) {
                if (check._id == productId && check.count > 1) {
                    // console.log(check)

                    // console.log(check.productName)
                    check.count = check.count + 1;
                    // User.findOneAndUpdate({ _id: session.uid }, { $push: { cart: result } })
                    try {
                        await User.updateOne({ "name": session.userId, "cart._id": productId }, { $inc: { "cart.$.count": -1 } })

                        // console.log(result)

                        //Update stock

                        // Product.updateOne({ "_id": productId }, { $inc: { "stock": 1 } })
                        //     .then((result) => {
                        //         console.log(result)
                        //     })
                        //     .catch((err) => {
                        //         console.log(err)
                        //     })
                    }
                    catch (err) {
                        console.log(err)
                    }
                    n++;
                }
            }
            console.log(n)
            if (n > 0) {
                //------------------------------
                try {
                    const result = await User.findById({ _id: session.uid })

                    //-------------------------
                    const carts = result.cart
                    const cartArray = []
                    for (let cart of carts) {
                        cart = cart.toJSON()
                        try {
                            const out = await Offer.findOne({ offerName: cart.offer })
                            console.log(out.discount)
                            const discount = out.discount * cart.price / 100
                            const offerPrice = cart.price - discount
                            cart.offerPrice = offerPrice
                            cartArray.push(cart)
                        } catch (err) {
                            console.log(err)
                        }
                    }
                    //--------------------
                    const sum = function (items, prop1, prop2) {
                        return items.reduce(function (a, b) {
                            return parseInt(a) + (parseInt(b[prop1]) * parseInt(b[prop2]));
                        }, 0);
                    };
                    const total = sum(cartArray, 'offerPrice', 'count');
                    console.log(cartArray)
                    userData = await User.findOne({ "name": session.userId })
                    cartItems = userData.cart
                    let cartItem;
                    for (cartItem of cartItems) {
                        if (cartItem._id == productId) {
                            break;
                        }
                    }
                    cartItem = cartItem.toJSON()
                    cartItem.total = total;
                    console.log(cartItem)
                    res.json(cartItem)
                } catch (err) {
                    console.log(err)
                }
                //------------------------------
                //res.redirect('back')
            } else {
                try {
                    await User.findOneAndUpdate({ _id: session.uid }, { $pull: { cart: { _id: productId } } })

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
                    const cartItem = { id: "productRemove" };
                    res.json(cartItem)

                    //------------------------------

                    // res.redirect('back')
                } catch (err) {
                    console.log(err)
                }
            }
        } catch (err) {
            console.log(err)
        }
    } else {
        res.redirect('/login')
    }
}

const addToCartFromProductPage = (req, res) => {
    session = req.session;

    if (session.userId) {
        console.log(req.params);
        let productId = req.params.productId;
        console.log(session.userId);
        console.log(productId);
        Product.findOne({ _id: productId })
            .then((result) => {
                // console.log(result)
                result = result.toJSON()
                result.count = 1;
                console.log(result)
                User.findOne({ _id: session.uid })
                    .then((out) => {
                        const checks = out.cart
                        // console.log(checks);
                        let n = 0;
                        async function f() {

                            for (const check of checks) {
                                if (check._id == productId) {
                                    console.log(check)
                                    cartItem = check
                                    // console.log(check.productName)
                                    // check.count = check.count + 1;
                                    try {
                                        await User.updateOne({ "name": session.userId, "cart._id": productId }, { $inc: { "cart.$.count": 1 } })
                                    }
                                    catch (err) {
                                        console.log(err)
                                    }
                                    n++;
                                }
                            }


                            console.log(n)
                            if (n > 0) {
                                //------------------------------

                                //------------------------------
                                res.redirect('back')

                            } else {
                                User.findOneAndUpdate({ _id: session.uid }, { $push: { cart: result } })
                                    .then((result) => {
                                        console.log(result)

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
                        }
                        f();
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


const userWishlistGet = (req, res) => {
    session = req.session;
    if (session.userId) {
        User.findOne({ _id: session.uid })
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
                User.findOne({ _id: session.uid })
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
                            User.findOneAndUpdate({ _id: session.uid }, { $push: { wishlist: result } })
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

        User.findOne({ _id: session.uid })
            .then((out) => {
                const checks = out.wishlist
                console.log(checks);
                let n = 0;
                for (const check of checks) {
                    if (check._id == productId && check.count > 1) {
                        console.log(check)
                        console.log(check.productName)
                        check.count = check.count + 1;
                        // User.findOneAndUpdate({ _id: session.uid }, { $push: { wishlist: result } })
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
                    User.findOneAndUpdate({ _id: session.uid }, { $pull: { wishlist: { _id: productId } } })
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
    } else {
        res.redirect('/login')
    }
}


const buyNowGet = (req, res) => {
    session = req.session;
    if (session.userId) {

        User.findOne({ _id: session.uid })
            .then((result) => {

                const cartItems = result.cart;

                let n = cartItems.length;
                // console.log(`n:${n}`)
                Product.find({})
                    .then((result) => {

                        let m = result.length;
                        // console.log(`m:${m}`)
                        let l = 0;
                        function operation() {
                            ++l;
                            // console.log(`l:${l}`)
                            if (l === m * n) {
                                User.findOne({ _id: session.uid })
                                    .then((result) => {
                                        // console.log(result.cart)
                                        if (result.cart.length == 0) {
                                            res.render('users/buyNow', { title: 'Shop.', loginName: session.userId, cartEmpty: true })
                                        } else {
                                            //-------------------------------------------
                                            console.log(session.uid)

                                            async function f2() {
                                                let cartArray = []
                                                let total
                                                try {
                                                    const result = await User.findById({ _id: session.uid })

                                                    //-------------------------
                                                    const carts = result.cart
                                                    for (let cart of carts) {
                                                        try {
                                                            const out = await Offer.findOne({ offerName: cart.offer })
                                                            const discount = out.discount * cart.price / 100
                                                            const offerPrice = cart.price - discount
                                                            cart.offerPrice = offerPrice
                                                            cartArray.push(cart)
                                                            console.log('hit')
                                                        } catch (err) {
                                                            console.log(err)
                                                        }
                                                    }
                                                    //--------------------
                                                    const sum = function (items, prop1, prop2) {
                                                        return items.reduce(function (a, b) {
                                                            return parseInt(a) + (parseInt(b[prop1]) * parseInt(b[prop2]));
                                                        }, 0);
                                                    };
                                                    total = sum(cartArray, 'offerPrice', 'count');
                                                    beforeTotal = sum(cartArray, 'price', 'count');
                                                    // console.log(result)
                                                    //res.render('users/cart', { title: 'Shop.', loginName: session.userId, cartArray, total: total })
                                                } catch (err) {
                                                    console.log(err)
                                                }
                                                const couponList = await Coupon.find({})

                                                if (session.noValidOption) {
                                                    session.noValidOption = false;
                                                    res.render('users/buyNow', { title: 'Shop.', loginName: session.userId, result, couponList, cartArray, total: total, beforeTotal: beforeTotal, msg: "Please select a valid option" })
                                                } else if (session.noValidAddressError) {
                                                    session.noValidAddressError = false;
                                                    res.render('users/buyNow', { title: 'Shop.', loginName: session.userId, result, couponList, cartArray, total: total, beforeTotal: beforeTotal, msg: "Please enter a valid address." })
                                                } else if (session.outOfStock) {
                                                    session.outOfStock = false;
                                                    res.render('users/buyNow', { title: 'Shop.', loginName: session.userId, result, couponList, cartArray, total: total, beforeTotal: beforeTotal, msg: "Some items in your cart went out of stock" })
                                                } else if (session.addAddressError) {
                                                    session.addAddressError = false
                                                    const error1 = otpLoginErrors.errors.find(item => item.param === 'newAddress') || '';
                                                    console.log(error1.msg)
                                                    console.log("hello")
                                                    res.render('users/buyNow', { title: 'Shop.', loginName: session.userId, result, couponList, cartArray, total: total, beforeTotal: beforeTotal, msg: "Enter key not allowed in address field." })
                                                    // res.render('users/buyNow', { title: 'Shop.', msg: error1.msg, loginName: session.userId, result, total: total })
                                                } else {
                                                    console.log('hi')
                                                    console.log(couponList)
                                                    res.render('users/buyNow', { title: 'Shop.', loginName: session.userId, result, couponList, cartArray, total: total, beforeTotal: beforeTotal })
                                                }
                                            }
                                            f2()
                                            //-------------------------------------------
                                            // const sum = function (items, prop1, prop2) {
                                            //     return items.reduce(function (a, b) {
                                            //         return parseInt(a) + (parseInt(b[prop1]) * parseInt(b[prop2]));
                                            //     }, 0);
                                            // };
                                            // const total = sum(result.cart, 'price', 'count');
                                            // console.log(result)

                                        }
                                    })
                            }
                        }
                        async function f() {
                            for (const cartItem of cartItems) {

                                for (const product of result) {
                                    // console.log(`cartItem._id: ${cartItem._id}`)
                                    // console.log(`cartItem.count: ${cartItem.count}`)
                                    let x = cartItem._id.toString()
                                    // console.log(`product._id: ${product._id}`)
                                    // console.log(`product.stock: ${product.stock}`)
                                    let y = product._id.toString()
                                    let z = product.stock - cartItem.count
                                    // console.log(z)
                                    if (x == y && cartItem.count > product.stock) {
                                        console.log("1111")
                                        if (product.stock == 0) {
                                            try {
                                                await User.updateOne({ _id: session.uid }, { $pull: { cart: { _id: product._id } } })
                                            } catch (err) {
                                                console.log(err);
                                            }
                                        }
                                        try {
                                            await User.updateOne({ "name": session.userId, "cart._id": product._id }, { $set: { "cart.$.count": product.stock } });
                                            session.outOfStock = true;
                                        } catch (err) {
                                            console.log(err);
                                        }
                                    }
                                    operation()
                                }
                            }
                        }
                        f();
                        // User.updateOne({ "name": session.userId, "cart._id": productId }, { $inc: { "cart.$.count": -1 } })

                        // User.findOneAndUpdate({ _id: session.uid }, { $pull: { cart: { _id: result.cart[_id] } } })
                    })
            })
            .catch((err) => {
                console.log(err)
            })
    } else {
        res.redirect('/login')
    }
}


let orderAddress
let orderPaymentOption
let orderAmountAfterOffer

const buyNowPost = async (req, res) => {
    session = req.session;
    console.log(req.body)

    if (session.userId) {
        otpLoginErrors = validationResult(req);
        if (!otpLoginErrors.isEmpty()) {
            session.addAddressError = true
            const order = { id: "addAddressError" };
            console.log(order);
            res.json(order);
        } else if (req.body.newAddress == "" && req.body.address == "") {
            session.noValidAddressError = true
            const order = { id: "noValidAddressError" };
            console.log(order);
            res.json(order);
        } else {
            //------------------------------------------------------
            try {
                const out = await User.findOne({ _id: session.uid })
                const checks = out.address
                console.log(checks);
                let n = 0;
                session.addressExistErr = false
                for (const check of checks) {
                    if (check == req.body.newAddress) {
                        console.log(check)
                        session.addressExistErr = true
                    }
                }
            } catch (err) {
                console.log(err)
            }
            //--------------------------------------------------------
            if (session.addressExistErr != true && req.body.newAddress != "") {
                console.log(req.body.newAddress)
                await User.updateOne({ _id: session.uid }, { $push: { address: req.body.newAddress } })
            }
            session.addressExistErr = false
            orderAmountAfterOffer = req.body.amount
            orderAddress = req.body.newAddress || req.body.address
            orderPaymentOption = req.body.paymentOption
            if (req.body.paymentOption == 'Razorpay') {
                // STEP 1:
                let { amount, currency } = req.body;
                amount = amount * 100
                console.log(amount)
                console.log(typeof amount)
                // STEP 2:    
                instance.orders.create({ amount, currency }, (err, order) => {
                    //STEP 3 & 4: 
                    console.log(order);
                    console.log(order.amount)
                    console.log(typeof order.amount)
                    console.log(order.id)
                    console.log(typeof order.id)

                    res.json(order)
                    // res.render('users/paymentPage', { title: 'Shop.', loginName: session.userId, order: JSON.stringify(order) })
                })
            } else if (req.body.paymentOption == 'Paypal') {
                // create a new order
                // const paymentPaypal = async (req, res) => {
                const order = { id: "Paypal" };
                console.log(order);
                res.json(order);
                // };
            } else if (req.body.paymentOption == 'COD') {
                res.redirect('/saveOrder')
            } else {
                session.noValidOption = true
                const order = { id: "noValidOption" };
                console.log(order);
                res.json(order);
            }
        }
    } else {
        res.redirect('/login')
    }
}

const orderGet = (req, res) => {
    session = req.session;
    if (session.userId) {
        User.findOne({ _id: session.uid })
            .then((result) => {
                const sum = function (items, prop1, prop2) {
                    return items.reduce(function (a, b) {
                        return parseInt(a) + (parseInt(b[prop1]) * parseInt(b[prop2]));
                    }, 0);
                };
                const total = sum(result.order, 'price', 'count');
                // console.log(result)
                result = result.order.reverse()

                res.render('./users/order', { title: 'Shop.', loginName: session.userId, result, total: total })
            })
            .catch((err) => {
                console.log(err)
            })

    } else {
        res.redirect('/login')
    }
}

const cancelOrderGet = async (req, res) => {
    session = req.session;
    uniqueId = req.params.id;
    if (session.userId) {
        result = await User.findOne({ _id: session.uid })

        // console.log(result)

        const orders = result.order

        console.log(orders)

        for (let order of orders) {
            order = order.toJSON();
            if (order.unique === uniqueId) {
                await User.updateOne({ "name": session.userId, "order.unique": uniqueId }, { $set: { "order.$.orderStatus": "Order cancelled" } })
                await User.updateOne({ "name": session.userId, "order.unique": uniqueId }, { $set: { "order.$.cancelBtn": false } })
                await User.updateOne({ "name": session.userId, "order.unique": uniqueId }, { $set: { "order.$.returnBtn": false } })
                await User.updateOne({ "name": session.userId, "order.unique": uniqueId }, { $set: { "order.$.updateBtn": false } })
                await Product.updateOne({ "_id": order._id }, { $inc: { "stock": order.count, "sales": (order.count * -1) } })
            }
        }
        res.redirect('/order')

    } else {
        res.redirect('/login')
    }
}


const returnOrderGet = async (req, res) => {
    session = req.session;
    uniqueId = req.params.id;
    if (session.userId) {
        result = await User.findOne({ _id: session.uid })

        // console.log(result)

        const orders = result.order

        console.log(orders)

        for (let order of orders) {
            order = order.toJSON();
            if (order.unique === uniqueId) {
                await User.updateOne({ "name": session.userId, "order.unique": uniqueId }, { $set: { "order.$.orderStatus": "Order returned" } })
                await User.updateOne({ "name": session.userId, "order.unique": uniqueId }, { $set: { "order.$.cancelBtn": false } })
                await User.updateOne({ "name": session.userId, "order.unique": uniqueId }, { $set: { "order.$.returnBtn": false } })
                await User.updateOne({ "name": session.userId, "order.unique": uniqueId }, { $set: { "order.$.updateBtn": false } })
                await Product.updateOne({ "_id": order._id }, { $inc: { "stock": order.count, "sales": (order.count * -1) } })
            }
        }
        res.redirect('/order')

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
        const error1 = otpLoginErrors.errors.find(item => item.param === 'mobile') || '';
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
                            session.uid = result._id;
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


const profileGet = (req, res) => {
    session = req.session;
    if (session.userId) {
        User.findOne({ _id: session.uid })
            .then((result) => {
                if (session.mobileAlreadyExist) {
                    session.mobileAlreadyExist = false
                    res.render('users/profile', { title: 'Shop.', message: "Mobile number already exists", loginName: session.userId, result })
                } else if (session.nameChangeError) {
                    session.nameChangeError = false
                    const error1 = otpLoginErrors.errors.find(item => item.param === 'newName') || '';
                    console.log(otpLoginErrors)
                    res.render('users/profile', { title: 'Shop.', message: error1.msg, loginName: session.userId, result })
                } else if (session.mobileChangeError) {
                    session.mobileChangeError = false
                    const error1 = otpLoginErrors.errors.find(item => item.param === 'newMobile') || '';
                    console.log(otpLoginErrors)
                    res.render('users/profile', { title: 'Shop.', message: error1.msg, loginName: session.userId, result })
                } else if (session.addAddressError) {
                    session.addAddressError = false
                    const error1 = otpLoginErrors.errors.find(item => item.param === 'newAddress') || '';
                    console.log(otpLoginErrors)
                    res.render('users/profile', { title: 'Shop.', message: error1.msg, loginName: session.userId, result })

                } else if (session.addressChangeError) {
                    session.addressChangeError = false
                    const error1 = otpLoginErrors.errors.find(item => item.param === 'newAddress') || '';
                    console.log(otpLoginErrors)
                    res.render('users/profile', { title: 'Shop.', message: error1.msg, loginName: session.userId, result })
                } else if (session.addressExistErr) {
                    session.addressExistErr = false
                    res.render('users/profile', { title: 'Shop.', message: "This address already exists", loginName: session.userId, result })
                } else {
                    res.render('users/profile', { title: 'Shop.', message: "", loginName: session.userId, result })
                }
            })
            .catch((err) => {
                console.log(err)
            })
    } else {
        res.redirect('/login')
    }
}


const addAddress = async (req, res) => {
    session = req.session;
    console.log(req.body)
    otpLoginErrors = validationResult(req);
    if (!otpLoginErrors.isEmpty()) {
        session.addAddressError = true
        res.redirect('/profile')
    } else if (session.userId) {
        //---------------------------------
        try {
            const out = await User.findOne({ _id: session.uid })
            const checks = out.address
            console.log(checks);
            let n = 0;
            for (const check of checks) {
                if (check == req.body.newAddress) {
                    console.log(check)
                    session.addressExistErr = true
                }
            }
        } catch (err) {
            console.log(err)
        }
        //---------------------------------
        if (session.addressExistErr) {
            res.redirect('/profile')
        } else {
            try {
                await User.updateOne({ _id: session.uid }, { $push: { address: req.body.newAddress } })
                res.redirect('/profile')
            } catch (err) {
                console.log(err)
            }
        }

    } else {
        res.redirect('/login')
    }
}


const nameEdit = (req, res) => {
    session = req.session;
    otpLoginErrors = validationResult(req);
    if (!otpLoginErrors.isEmpty()) {
        session.nameChangeError = true
        res.redirect('/profile')
    } else if (session.userId) {
        User.updateOne({ _id: session.uid }, { $set: { name: req.body.newName } })
            .then(() => {
                session.userId = req.body.newName,
                    res.redirect('/profile')
            })
            .catch((err) => {
                console.log(err)
            })
    } else {
        res.redirect('/login')
    }
}

let mobileNumber3;
const mobileEdit = (req, res) => {
    session = req.session;
    console.log(req.body)
    otpLoginErrors = validationResult(req);
    if (!otpLoginErrors.isEmpty()) {
        session.mobileChangeError = true
        res.redirect('/profile')
    } else {
        User.findOne({ mobile: req.body.newMobile })
            .then((result) => {
                console.log(result)
                if (result !== null) {
                    session = req.session;
                    session.mobileAlreadyExist = true;
                    console.log('mobile Already Exist')
                    res.redirect('/profile');
                } else {
                    console.log(result)
                    client
                        .verify
                        .services(process.env.serviceID)
                        .verifications
                        .create({
                            to: `+91${req.body.newMobile}`,
                            channel: 'sms'
                        })
                        .then((data) => {
                            mobileNumber3 = req.body.newMobile,
                                res.render('users/mobileChangeOtp', { title: 'Shop.', loginName: session.userId })
                        })
                }
            })
    }
}

const mobileChangeOtp = (req, res) => {
    console.log(req.body)
    if ((req.body.otp).length === 6) {
        client
            .verify
            .services(process.env.serviceID)
            .verificationChecks
            .create({
                to: `+91${mobileNumber3}`,
                code: req.body.otp
            })
            .then((data) => {
                if (data.status === "approved") {
                    User.updateOne({ _id: session.uid }, { $set: { mobile: mobileNumber3 } })
                        .then(() => {
                            console.log(data)
                            res.redirect('/profile')
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                } else {
                    session = req.session;
                    session.invalidOTP = true
                    res.redirect('/profile');
                }
            })
    } else {
        session = req.session;
        session.invalidOTP = true
        res.redirect('/profile');
    }
}


const addressEdit = (req, res) => {
    session = req.session;
    otpLoginErrors = validationResult(req);
    addressId = req.params.id;
    if (!otpLoginErrors.isEmpty()) {
        session.addressChangeError = true
        res.redirect('/profile')
    } else if (session.userId) {
        User.findOneAndUpdate({ _id: session.uid }, { $pull: { address: addressId } })
            .then(() => {
                User.findOneAndUpdate({ _id: session.uid }, { $push: { address: req.body.newAddress } })
                    .then(() => {
                        res.redirect('/profile')
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


const addressDelete = (req, res) => {
    session = req.session;
    addressId = req.params.id;
    if (session.userId) {
        User.updateOne({ _id: session.uid }, { $pull: { address: addressId } })
            .then(() => {
                res.redirect('/profile')
            })
            .catch((err) => {
                console.log(err)
            })
    } else {
        res.redirect('/login')
    }
}


const changePasswordGet = (req, res) => {
    session = req.session;
    if (session.changePwdErrors) {
        session.changePwdErrors = false
        const error4 = changePwdErrors.errors.find(item => item.param === 'password') || '';
        const error5 = changePwdErrors.errors.find(item => item.param === 'confirmPassword') || '';
        res.render('users/changePassword', { title: 'Shop.', pwdMsg: error4.msg, confirmPwdMsg: error5.msg });
    } else if (session.userId) {
        res.render('users/changePassword')
    } else {
        res.redirect('/login')
    }

    // session = req.session;
    // if (session.userId) {
    //     res.redirect('/')
    // } else if (session.userAlreadyExist) {
    //     session.userAlreadyExist = false
    //     res.render('users/signup', { title: 'Shop.', usernameMsg: 'User Already Exists' })
    // } else if (session.mobileAlreadyExist) {
    //     session.mobileAlreadyExist = false
    //     res.render('users/signup', { title: 'Shop.', mobileMsg: 'User with this mobile number already exists' })
    // } else if (session.signupErrors) {
    //     session.changePwdErrors = false
    //     const error4 = changePwdErrors.errors.find(item => item.param === 'password') || '';
    //     const error5 = changePwdErrors.errors.find(item => item.param === 'confirmPassword') || '';
    //     res.render('users/signup', { title: 'Shop.', pwdMsg: error4.msg, confirmPwdMsg: error5.msg});
    // } else {
    //     res.render('users/signup', { title: 'Shop.' })
    // }
}
let changePwdErrors;
const changePasswordPost = (req, res) => {
    session = req.session;
    changePwdErrors = validationResult(req);
    if (!changePwdErrors.isEmpty()) {
        session.changePwdErrors = true
        res.redirect('/changePassword')
    } else {
        if (session.userId) {
            User.findOne({ _id: session.uid })
                .then((result) => {
                    mobileNumber3 = result.mobile;
                    client
                        .verify
                        .services(process.env.serviceID)
                        .verifications
                        .create({
                            to: `+91${mobileNumber3}`,
                            channel: 'sms'
                        })
                        .then((data) => {
                            password1 = req.body.password;
                            res.redirect('/passwordChangeOtp')
                        })
                })
        } else {
            res.redirect('/login')
        }
    }
}

const passwordChangeOtpGet = (req, res) => {
    session = req.session;
    if (session.invalidOTP) {
        session.invalidOTP = false
        res.render('users/passwordChangeOtp', { title: 'Shop.', otpMsg: "Invalid OTP" });
    } else if (session.userId) {
        res.render('users/passwordChangeOtp')
    } else {
        res.redirect('/login')
    }
}


const passwordChangeOtpPost = (req, res) => {
    console.log(req.body)
    if ((req.body.otp).length === 6) {
        client
            .verify
            .services(process.env.serviceID)
            .verificationChecks
            .create({
                to: `+91${mobileNumber3}`,
                code: req.body.otp
            })
            .then((data) => {
                if (data.status === "approved") {
                    bcrypt.hash(password1, 10)
                        .then((hash) => {
                            User.updateOne({ _id: session.uid }, { $set: { password: hash } })
                                .then(() => {
                                    console.log(data)
                                    res.redirect('/profile')
                                })
                                .catch((err) => {
                                    console.log(err)
                                })
                        })
                } else {
                    session = req.session;
                    session.invalidOTP = true
                    res.redirect('/passwordChangeOtp');
                }
            })
    } else {
        session = req.session;
        session.invalidOTP = true
        res.redirect('/passwordChangeOtp');
    }
}


const verifyPaymentRazorPay = function (req, res) {

    console.log(">>>>>>>>>>>>>>>>>>>>>>");
    console.log(req.body)

    // const { payment_id, order_id, razorpay_signature } = req.body;
    // const razorpay_signature = req.headers['x-razorpay-signature'];
    console.log(req.body.razorpay_payment_id)
    console.log(req.body.razorpay_order_id)
    console.log(req.body.razorpay_signature)
    // Pass yours key_secret here
    // const key_secret = YAEUthsup8SijNs3iveeVlL1;

    // STEP 8: Verification & Send Response to User

    // Creating hmac object 
    let hmac = crypto.createHmac('sha256', process.env.razorPayTestKeySecret);

    // Passing the data to be hashed
    hmac.update(req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id);

    // Creating the hmac in the required format
    const generated_signature = hmac.digest('hex');



    var response = { signatureIsValid: "false" }
    if (generated_signature === req.body.razorpay_signature) {
        response = { signatureIsValid: "true" }
        console.log("signatureIsValid")
        // res.send(response);
        res.json(response)
    } else {
        res.send(response);
    }
}


const saveOrder = async function (req, res) {

    const result = await User.findOne({ _id: session.uid })
    // .then((result) => {
    // console.log(result)
    const cartItems = result.cart

    // console.log(cartItems)

    // async function f() {
    for (let cartItem of cartItems) {
        cartItem = cartItem.toJSON();
        cartItem.address = orderAddress;
        cartItem.paymentOption = orderPaymentOption;
        cartItem.unique = uuidv4()
        cartItem.orderStatus = 'Order is under process'
        stockId = cartItem._id
        cartItem.priceAfterOffer = orderAmountAfterOffer
        cartItem.userId = session.userId

        // console.log(stockId)
        salesCount = cartItem.count
        removeCount = cartItem.count * -1;
        // console.log(removeCount)

        //----------------------------------------------------
        await User.findOneAndUpdate({ _id: session.uid }, { $push: { order: cartItem } })


        // Empty cart
        await User.findOneAndUpdate({ _id: session.uid }, { $set: { cart: [] } })


        // Update stock
        await Product.updateOne({ "_id": stockId }, { $inc: { "stock": removeCount, "sales": salesCount } })

        // Update coupon
        await Coupon.updateOne({ coupon: session.coupon }, { $push: { users: session.uid } })

        //----------------------------------------------------
    }
    res.json({ success: 'done' });
    // }
    // f()

    // })
    // .catch((err) => {
    //     console.log(err)
    // })
}

// ----------------------------------------------
// For a fully working example, please see:
// https://github.com/paypal-examples/docs-examples/tree/main/standard-integration
// import fetch from "node-fetch";
const fetch = require('node-fetch')
const base = "https://api-m.sandbox.paypal.com";


// const { paypalClientid, paypalClientsecret } = process.env;

const paymentPaypal = async (req, res) => {
    console.log(req.body);
    const { amount, currency } = req.body;
    let orderAmount = amount / 80
    console.log(orderAmount)
    const order = await createOrder(orderAmount);
    console.log(order);
    console.log(order.id);
    res.json(order);
}



// capture payment & store order information or fullfill order
const verifyPaymentPaypal = async (req, res) => {
    console.log(req.params)
    const orderID = req.params.orderId;
    console.log(orderID)
    const captureData = await capturePayment(orderID);
    // TODO: store payment information such as the transaction ID
    res.json(captureData);
};

//////////////////////
// PayPal API helpers
//////////////////////

// use the orders api to create an order
async function createOrder(orderAmount) {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders`;
    const response = await fetch(url, {
        method: "post",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: orderAmount,
                    },
                },
            ],
        }),
    });
    const data = await response.json();
    console.log(data)
    return data;
}

// use the orders api to capture payment for an order
async function capturePayment(orderId) {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders/${orderId}/capture`;
    const response = await fetch(url, {
        method: "post",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });
    const data = await response.json();
    return data;
}

// generate an access token using client id and app secret
async function generateAccessToken() {
    const auth = Buffer.from(process.env.paypalClientid + ":" + process.env.paypalClientsecret).toString("base64")
    const response = await fetch(`${base}/v1/oauth2/token`, {
        method: "post",
        body: "grant_type=client_credentials",
        headers: {
            Authorization: `Basic ${auth}`,
        },
    });
    const data = await response.json();
    return data.access_token;
}
// -------------------------------------------

const couponPost = async (req, res) => {
    session = req.session;
    console.log(req.body)

    if (session.userId) {
        if (req.body.coupon && req.body.coupon != 'Select a coupon') {

            console.log(req.body.coupon)
            const result = await Coupon.findOne({ coupon: req.body.coupon })
            console.log(result)
            const users = result.users;
            const today = new Date();
            console.log(users)
            console.log(today)
            if (result.expiry < today) {
                console.log("couponExpired")
                const response = { id: "couponExpired" }
                res.json(response)
            } else if (users && users.length > 0) {
                let n = 0;
                for (let user of users) {
                    if (user == session.uid) {
                        n++
                        break;
                    }
                }
                if (n > 0) {
                    console.log("couponAlready")
                    const response = { id: "couponAlready" }
                    res.json(response)
                } else {
                    if (req.body.amountBefore < result.minOrder) {
                        console.log("notApplicable")
                        const response = { id: "notApplicable" }
                        res.json(response)
                    } else {
                        session.coupon = req.body.coupon
                        console.log(result.reduction)
                        const response = { id: result.reduction }
                        res.json(response)
                    }
                }
            } else {
                if (req.body.amountBefore < result.minOrder) {
                    console.log("notApplicable")
                    const response = { id: "notApplicable" }
                    res.json(response)
                } else {
                    session.coupon = req.body.coupon
                    console.log(result.reduction)
                    const response = { id: result.reduction }
                    res.json(response)
                }
            }
        }
        else {
            console.log(req.body.coupon)
            const response = { id: 0 }
            res.json(response)
        }
    } else {
        const response = { id: "noLogin" }
        res.json(response)
    }
}


const userlogout = function (req, res) {
    session = req.session
    session.userId = false
    session.uid = false
    session.invalidOTP = false
    session.incorrectId = false
    session.userAlreadyExist = false
    session.mobileAlreadyExist = false
    session.incorrectPwd = false
    session.otpLoginErrors = false
    session.outOfStock = false
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
    buyNowToCart,
    orderGet,
    cancelOrderGet,
    userMobileLoginGet,
    userMobileLoginPost,
    otpLoginVerifyGet,
    otpLoginVerifyPost,
    profileGet,
    addAddress,
    nameEdit,
    mobileEdit,
    addressEdit,
    addressDelete,
    mobileChangeOtp,
    changePasswordGet,
    changePasswordPost,
    passwordChangeOtpGet,
    passwordChangeOtpPost,
    verifyPaymentRazorPay,
    saveOrder,
    paymentPaypal,
    verifyPaymentPaypal,
    returnOrderGet,
    addToCartFromProductPage,
    couponPost
}