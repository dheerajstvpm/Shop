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
    // To be deleted
    session.userId = 'Amal';

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
                res.render('users/product', { title: 'Shop.', loginName: session.userId, result })
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
                                    console.log(data)
                                    name1 = req.body.name,
                                        mobileNumber1 = req.body.mobileNumber,
                                        username1 = req.body.username,
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

const buyNowToCart = (req, res) => {
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
                        async function f() {
                            for (const check of checks) {
                                if (check._id == productId) {
                                    console.log(check)
                                    console.log(check.productName)
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
    } else {
        res.redirect('/login')
    }
}


const buyNowGet = (req, res) => {
    session = req.session;
    if (session.userId) {

        User.findOne({ name: session.userId })
            .then((result) => {

                const cartItems = result.cart;

                let n = cartItems.length;
                console.log(`n:${n}`)
                Product.find({})
                    .then((result) => {

                        let m = result.length;
                        console.log(`m:${m}`)
                        let l = 0;
                        function operation() {
                            ++l;
                            console.log(`l:${l}`)
                            if (l === m * n) {
                                User.findOne({ name: session.userId })
                                    .then((result) => {
                                        console.log(result.cart)
                                        if (result.cart.length == 0) {
                                            res.render('users/buyNow', { title: 'Shop.', loginName: session.userId, cartEmpty: true })
                                        } else {
                                            const sum = function (items, prop1, prop2) {
                                                return items.reduce(function (a, b) {
                                                    return parseInt(a) + (parseInt(b[prop1]) * parseInt(b[prop2]));
                                                }, 0);
                                            };
                                            const total = sum(result.cart, 'price', 'count');
                                            // console.log(result)
                                            if (session.outOfStock) {
                                                session.outOfStock = false;
                                                res.render('users/buyNow', { title: 'Shop.', loginName: session.userId, result, total: total, msg: "Some items in your cart went out of stock" })
                                            } else {
                                                res.render('users/buyNow', { title: 'Shop.', loginName: session.userId, result, total: total })
                                            }
                                        }
                                    })
                            }
                        }
                        async function f() {
                            for (const cartItem of cartItems) {

                                for (const product of result) {
                                    console.log(`cartItem._id: ${cartItem._id}`)
                                    console.log(`cartItem.count: ${cartItem.count}`)
                                    let x = cartItem._id.toString()
                                    console.log(`product._id: ${product._id}`)
                                    console.log(`product.stock: ${product.stock}`)
                                    let y = product._id.toString()
                                    let z = product.stock - cartItem.count
                                    console.log(z)
                                    if (x == y && cartItem.count > product.stock) {
                                        console.log("1111")
                                        if (product.stock == 0) {
                                            try {
                                                await User.updateOne({ name: session.userId }, { $pull: { cart: { _id: product._id } } })
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

                        // User.findOneAndUpdate({ name: session.userId }, { $pull: { cart: { _id: result.cart[_id] } } })
                    })
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
    console.log(req.body)
    if (session.userId) {
        if (req.body.paymentOption == 'Razorpay') {
            // STEP 1:
            const { amount, currency } = req.body;

            // STEP 2:    
            instance.orders.create({ amount, currency }, (err, order) => {
                //STEP 3 & 4: 
                console.log(order);
                console.log(order.amount)
                console.log(order.id)
                res.render('users/paymentPage', { title: 'Shop.', loginName: session.userId, order: JSON.stringify(order) })
            })
        } else {
            res.redirect('/saveOrder')
        }
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
    console.log(56654);

    

                res.render('./users/order', { title: 'Shop.', loginName: session.userId, result, total: total })

    console.log(5);

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
    uniqueId = req.params.id;
    if (session.userId) {
        User.findOne({ name: session.userId })
            .then((result) => {
                // console.log(result)

                const orders = result.order

                console.log(orders)

                for (let order of orders) {
                    order = order.toJSON();
                    if (order.unique === uniqueId) {
                        Promise.all([(User.updateOne({ "name": session.userId, "order.unique": uniqueId }, { $set: { "order.$.orderStatus": "Order cancelled" } })), (Product.updateOne({ "_id": order._id }, { $inc: { "stock": order.count, "sales": (order.count * -1) } }))])
                            .then((result) => {
                                res.redirect('/order')
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    }

                }
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
        User.findOne({ name: session.userId })
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


const addAddress = (req, res) => {
    session = req.session;
    console.log(req.body)
    otpLoginErrors = validationResult(req);
    if (!otpLoginErrors.isEmpty()) {
        session.addAddressError = true
        res.redirect('/profile')
    } else if (session.userId) {
        User.updateOne({ name: session.userId }, { $push: { address: req.body.newAddress } })
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


const nameEdit = (req, res) => {
    session = req.session;
    otpLoginErrors = validationResult(req);
    if (!otpLoginErrors.isEmpty()) {
        session.nameChangeError = true
        res.redirect('/profile')
    } else if (session.userId) {
        User.updateOne({ name: session.userId }, { $set: { name: req.body.newName } })
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
                    User.updateOne({ name: session.userId }, { $set: { mobile: mobileNumber3 } })
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
        User.findOneAndUpdate({ name: session.userId }, { $pull: { address: addressId } })
            .then(() => {
                User.findOneAndUpdate({ name: session.userId }, { $push: { address: req.body.newAddress } })
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
        User.updateOne({ name: session.userId }, { $pull: { address: addressId } })
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
            User.findOne({ name: session.userId })
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
                            User.updateOne({ name: session.userId }, { $set: { password: hash } })
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


    // const body = req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
    // const expectedSignature = crypto.createHmac('sha256', 'process.env.razorPayTestKeySecret')
    //     .update(body.toString())
    //     .digest('hex');
    // console.log("sig received ", req.body.razorpay_signature);
    // console.log("sig generated ", expectedSignature);
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


const saveOrder = function (req, res) {
    User.findOne({ name: session.userId })
        .then((result) => {
            // console.log(result)
            const cartItems = result.cart
            
            console.log(cartItems)

            async function f() {
                for (let cartItem of cartItems) {
                    cartItem = cartItem.toJSON();
                    cartItem.address = req.body.address;
                    cartItem.paymentOption = req.body.paymentOption;
                    cartItem.unique = uuidv4()
                    cartItem.orderStatus = 'Order is under process'
                    stockId = cartItem._id
                    console.log(stockId)
                    salesCount = cartItem.count
                    removeCount = cartItem.count * -1;
                    console.log(removeCount)

                    //----------------------------------------------------
                    await User.findOneAndUpdate({ name: session.userId }, { $push: { order: cartItem } })


                    // Empty cart
                    await User.findOneAndUpdate({ name: session.userId }, { $set: { cart: [] } })


                    // Update stock
                    await Product.updateOne({ "_id": stockId }, { $inc: { "stock": removeCount, "sales": salesCount } })



                    //----------------------------------------------------
                }
            }
            f()
            res.json({success: 'done'});
        })
        .catch((err) => {
            console.log(err)
        })
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
    saveOrder
}