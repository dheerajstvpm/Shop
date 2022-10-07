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

let adminSession;

router.get('/', (req, res) => {
    adminSession = req.session;
    if (adminSession.adminId) {
        res.render('/admin/adminHomepage', { title: 'Shop.admin', id: 'adminSession.adminId' })
    } else {
        res.render('/admin/adminHomepage', { title: 'Shop.admin' })
    }
})

router.get('/product', (req, res) => {
    adminSession = req.session;
    if (adminSession.adminId) {
        res.render('admin/adminProduct', { title: 'Shop.admin', id: 'adminSession.adminId' })
    } else {
        res.render('admin/adminProduct', { title: 'Shop.admin' })
    }
})

router.get('/adminLogin', (req, res) => {
    adminSession = req.session;
    if (adminSession.adminId) {
        console.log(adminSession)
        res.redirect('/admin')
    } else if (adminSession.incorrectAdmin) {
        console.log(adminSession)
        console.log('3')
        req.session.destroy();
        res.render('admin/adminLogin', { title: 'Login', usernameMessage: 'Username does not exist' })

    } else if (adminSession.incAdminPwd) {
        console.log(adminSession)
        console.log('4')
        req.session.destroy();
        res.render('admin/adminLogin', { title: 'Login', passwordMessage: 'Incorrect password' })
    } else {
        console.log(adminSession)
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
            res.render('admin/addNewAdmin', { title: 'Add new admin', usernameMsg: error3.msg, pwdMsg: error4.msg });

        } else {
            Admin.find({ username: req.body.username })
                .then((result) => {
                    let user = result.find(item => item.username)
                    let hashPassword;
                    bcrypt.hash(req.body.password, 10)
                        .then(function (hash) {
                            hashPassword = hash
                            if (user) {
                                adminSession = req.session;
                                adminSession.adminAlreadyExist = true;
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
                        adminSession = req.session;
                        adminSession.adminId = temp.username;
                        res.redirect('/admin');
                    } else {
                        adminSession = req.session
                        adminSession.incAdminPwd = true;
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
            adminSession = req.session
            adminSession.incorrectAdmin = true;
            console.log(session)
            console.log('2')
            res.redirect('/adminLogin');
            // res.render('users/login', { title: 'Login', usernameMessage: 'Username does not exist' })
        })
});

// router.post('/adminHome', function (req, res) {
//     if (req.body.username === 'admin' && req.body.password === 'Admin@123') {
//         adminSession = req.session
//         adminSession.adminId = true;
//         res.redirect('/admin/adminHomepage');
//     } else {
//         adminSession = req.session
//         adminSession.incorrect = true;
//         res.redirect('/admin');
//     }
// });

router.get('/adminProductManagement', function (req, res) {
    adminSession = req.session;
    Product.find({}).sort({ _id: -1 })
        .then((result) => {
            if (adminSession.adminId) {

                res.render('/admin/adminProdctManagement', { result })
            } else {
                res.redirect('/admin');
            }
        })
        .catch((err) => {
            console.log(err)
            res.redirect('/admin');
        })
});

router.post('/adminSearch', function (req, res) {
    adminSession = req.session
    if (adminSession.adminId) {
        Product.find({ $or: [{ productName: req.body.input }, { category: req.body.input }] })
            .then((result) => {
                if (adminSession.adminId && req.body.input) {
                    res.render('/admin/adminProdctManagement', { result })
                } else {
                    res.redirect('/admin');
                }
            })
            .catch((err) => {
                console.log(err)
                // res.redirect('/admin');
            })
    } else {
        res.redirect('/admin');
    }
});

router.get('/addNewProduct', function (req, res) {
    adminSession = req.session
    if (adminSession.adminId) {
        if (adminSession.productExist) {
            req.session.destroy();
            adminSession = req.session
            adminSession.adminId = true;
            const item = [{ message: 'Product already exist' }]
            res.render('admin/addNewProduct', { item });
        } else {
            res.render('admin/addNewProduct');
        }
    } else {
        res.redirect('/admin');
    }
});

router.post('/addNewProduct',
    check('productName').notEmpty().withMessage('Please enter a Name'),
    check('description').notEmpty().withMessage('Please enter a description'),
    check('price').notEmpty().withMessage('Please enter price of the product'),
    check('stock').notEmpty().withMessage('Please enter number of items'),
    check('image').notEmpty().withMessage('Please enter link to image'),
    check('category').notEmpty().withMessage('Please enter category'),
    function (req, res) {
        const errors = validationResult(req);
        console.log(errors)
        var error1 = errors.errors.find(item => item.param === 'productName') || '';
        var error2 = errors.errors.find(item => item.param === 'description') || '';
        var error3 = errors.errors.find(item => item.param === 'price') || '';
        var error4 = errors.errors.find(item => item.param === 'stock') || '';
        var error5 = errors.errors.find(item => item.param === 'image') || '';
        var error6 = errors.errors.find(item => item.param === 'category') || '';
        console.log(error3.msg);
        adminSession = req.session;
        if (!errors.isEmpty()) {
            res.render('addNewProduct', { productNameMsg: error1.msg, descriptionMsg: error2.msg, priceMsg: error3.msg, stockMsg: error4.msg, imageMsg: error5.msg, categoryMsg: error6.msg });
        } else if (adminSession.adminId) {
            Admin.find({ productName: req.body.productName })
                .then((result) => {
                    let temp = result.find(item => item.productName)
                    if (temp) {
                        adminSession = req.session;
                        adminSession.productExist = true;
                        res.redirect('/admin/addNewProduct');
                    } else {
                        const product = new Product({
                            productName: req.body.productName,
                            description: req.body.description,
                            price: req.body.price,
                            stock: req.body.stock,
                            image: req.body.image,
                            category: req.body.category,
                            offer: req.body.offer
                        })
                        product.save()
                            .then((result) => {
                                console.log(result)
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                        adminSession = req.session;
                        console.log(adminSession)
                        res.redirect('/admin');
                    }
                })
                .catch((err) => {
                    console.log(err)
                })
        } else {
            res.redirect('/admin');
        }
    });

router.get('/edit/:id', function (req, res) {
    console.log(req.params);
    let userId = req.params.id;
    console.log(userId);
    adminSession = req.session;
    if (adminSession.adminId) {
        User.find({ _id: userId })
            .then((result) => {

                let current = result.find(item => item.username)

                res.render('editUser', current)
            })
            .catch((err) => {
                console.log(err)
            })
    }
    else {
        res.redirect('/admin')
    }
});

router.post('/editUser/:id', function (req, res) {
    console.log(req.params);
    console.log(req.body);
    console.log(req.body.oldData);
    console.log(req.body.oldName);
    let newUserId = req.params.id;
    console.log(newUserId);
    let newData;
    adminSession = req.session;
    if (adminSession.adminId) {
        if (req.body.newData) {
            User.updateOne({ _id: newUserId }, { $set: { data: req.body.newData } })
                .then((result) => {

                    res.redirect('/admin')
                })
                .catch((err) => {
                    console.log(err)
                })
        } else {
            res.redirect('/admin')
        }
        if (req.body.newName) {
            User.updateOne({ _id: newUserId }, { $set: { name: req.body.newName } })
                .then((result) => {
                    console.log(result);
                    res.redirect('/admin')
                })
                .catch((err) => {
                    console.log(err)
                })
        } else {
            res.redirect('/admin')
        }
    } else {
        res.redirect('/admin')
    }
})

router.get('/delete/:id', function (req, res) {
    console.log(req.params);
    let userId = req.params.id;
    console.log(userId);
    adminSession = req.session
    if (adminSession.adminId) {
        User.deleteOne({ _id: userId })
            .then((result) => {
                if (adminSession.adminId && req.body.input) {
                    res.render('adminHome', { result })
                } else {
                    res.redirect('/admin');
                }
            })
            .catch((err) => {
                console.log(err)
                // res.redirect('/admin');
            })
    } else {
        res.redirect('/admin');
    }
});



router.post('/adminLogout', function (req, res) {
    adminSession = req.session
    adminSession.adminId = false
    adminSession.incorrect = false
    adminSession.alreadyexist = false
    res.redirect('/admin');
});



module.exports = router;