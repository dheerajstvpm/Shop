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
    console.log(adminSession)
    if (adminSession.adminId) {
        res.render('admin/adminHomepage', { title: 'Shop.admin', id: 'adminSession.adminId' })
    } else {
        res.redirect('/admin/adminLogin')
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
    Admin.find({ username: req.body.username })
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



//Product  Management

router.get('/adminProductManagement', function (req, res) {
    adminSession = req.session;
    console.log(adminSession)
    Product.find({}).sort({ _id: -1 })
        .then((result) => {
            if (adminSession.adminId) {
                res.render('admin/adminProductManagement', { result })
            } else {
                res.redirect('/admin');
            }
        })
        .catch((err) => {
            console.log(err)
            res.redirect('/admin');
        })
});

router.post('/adminProductSearch', function (req, res) {
    adminSession = req.session
    if (adminSession.adminId) {
        Product.find({ $or: [{ productName: req.body.input }, { category: req.body.input }] })
            .then((result) => {
                if (adminSession.adminId && req.body.input) {
                    res.render('admin/adminProductManagement', { result })
                } else {
                    res.redirect('/admin/adminProductManagement');
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
            let offerResult;
            Offer.find({})
                .then((result) => {

                    console.log(result);
                    offerResult=result;

                    // res.render('admin/addNewProduct', { offerResult });
                })
                .catch((err) => {
                    console.log(err)
                })
            Category.find({})
                .then((result) => {

                    console.log(result);

                    res.render('admin/addNewProduct', { result, offerResult });
                })
                .catch((err) => {
                    console.log(err)
                })
            // res.render('admin/addNewProduct');
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
    // check('image').notEmpty().withMessage('Please enter link to image'),
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
        console.log(error5.msg);
        adminSession = req.session;
        if (!errors.isEmpty()) {
            res.render('admin/addNewProduct', { productNameMsg: error1.msg, descriptionMsg: error2.msg, priceMsg: error3.msg, stockMsg: error4.msg, imageMsg: error5.msg, categoryMsg: error6.msg });
        } else if (adminSession.adminId) {
            Product.find({ productName: req.body.productName })
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
                        res.redirect('/admin/adminProductManagement');
                    }
                })
                .catch((err) => {
                    console.log(err)
                })
        } else {
            res.redirect('/admin');
        }
    });

router.get('/editProduct/:id', function (req, res) {
    console.log(req.params);
    let productId = req.params.id;
    console.log(productId);
    adminSession = req.session;
    if (adminSession.adminId) {
        Product.find({ _id: productId })
            .then((result) => {

                let current = result.find(item => item.productName)
                console.log(current)
                res.render('admin/adminEditProduct', current)
            })
            .catch((err) => {
                console.log(err)
            })
    }
    else {
        res.redirect('/admin/adminProductManagement')
    }
});

router.post('/editProduct/:id', function (req, res) {
    console.log(req.params);
    console.log(req.body);
    let newProductId = req.params.id;
    console.log(newProductId);

    adminSession = req.session;
    if (adminSession.adminId) {
        if (req.body.newDescription) {
            Product.updateOne({ _id: newProductId }, { $set: { description: req.body.newDescription } })
                .then((result) => {

                    res.redirect('/admin/adminProductManagement')
                })
                .catch((err) => {
                    console.log(err)
                })
            // } else {
            //     res.redirect('/admin/adminProductManagement')
        }
        if (req.body.newPrice) {
            Product.updateOne({ _id: newProductId }, { $set: { price: req.body.newPrice } })
                .then((result) => {
                    console.log(result);
                    res.redirect('/admin/adminProductManagement')
                })
                .catch((err) => {
                    console.log(err)
                })
            // } else {
            //     console.log('hello')
            //     res.redirect('/admin/adminProductManagement')
        }
        if (req.body.newStock) {
            Product.updateOne({ _id: newProductId }, { $set: { stock: req.body.newStock } })
                .then((result) => {
                    // console.log("hi");
                    console.log(result);
                    res.redirect('/admin/adminProductManagement')
                })
                .catch((err) => {
                    console.log(err)
                })
            // } else {
            //     res.redirect('/admin/adminProductManagement')
        }
        if (req.body.newImage) {
            Product.updateOne({ _id: newProductId }, { $set: { image: req.body.newImage } })
                .then((result) => {
                    console.log(result);
                    res.redirect('/admin/adminProductManagement')
                })
                .catch((err) => {
                    console.log(err)
                })
            // } else {
            //     res.redirect('/admin/adminProductManagement')
        }
        if (req.body.newCategory) {
            Product.updateOne({ _id: newProductId }, { $set: { category: req.body.newCategory } })
                .then((result) => {
                    console.log(result);
                    res.redirect('/admin/adminProductManagement')
                })
                .catch((err) => {
                    console.log(err)
                })
            // } else {
            //     res.redirect('/admin/adminProductManagement')
        }
        if (req.body.newOffer) {
            Product.updateOne({ _id: newProductId }, { $set: { offer: req.body.newOffer } })
                .then((result) => {
                    console.log(result);
                    res.redirect('/admin/adminProductManagement')
                })
                .catch((err) => {
                    console.log(err)
                })
            // } else {
            //     res.redirect('/admin/adminProductManagement')
        }
    } else {
        console.log('Hi')
        res.redirect('/admin/adminProductManagement')
    }
})

router.get('/deleteProduct/:id', function (req, res) {
    console.log(req.params);
    let productId = req.params.id;
    console.log(productId);
    adminSession = req.session
    if (adminSession.adminId) {
        Product.deleteOne({ _id: productId })
            .then((result) => {
                if (adminSession.adminId && req.body.input) {
                    res.render('admin/adminProductManagement', { result })
                } else {
                    res.redirect('/admin/adminProductManagement');
                }
            })
            .catch((err) => {
                console.log(err)
                // res.redirect('/admin');
            })
    } else {
        res.redirect('/admin/adminProductManagement');
    }
});



router.get('/adminUserManagement', function (req, res) {
    adminSession = req.session;
    console.log(adminSession)
    User.find({}).sort({ _id: -1 })
        .then((result) => {
            if (adminSession.adminId) {
                res.render('admin/adminUserManagement', { result })
            } else {
                res.redirect('/admin');
            }
        })
        .catch((err) => {
            console.log(err)
            res.redirect('/admin');
        })
});

router.post('/adminUserSearch', function (req, res) {
    adminSession = req.session
    if (adminSession.adminId) {
        Product.find({ $or: [{ name: req.body.input }, { username: req.body.input }] })
            .then((result) => {
                if (adminSession.adminId && req.body.input) {
                    res.render('admin/adminUserManagement', { result })
                } else {
                    res.redirect('/admin/adminUserManagement');
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

router.get('/block/:id', function (req, res) {
    console.log(req.params);
    let userId = req.params.id;
    console.log(userId);
    adminSession = req.session
    if (adminSession.adminId) {
        User.updateOne({ _id: userId }, { $set: { status: 'blocked' } })
            .then((result) => {
                if (adminSession.adminId && req.body.input) {
                    res.render('admin/adminUserManagement', { result })
                } else {
                    res.redirect('/admin/adminUserManagement');
                }
            })
            .catch((err) => {
                console.log(err)
                // res.redirect('/admin');
            })
    } else {
        res.redirect('/admin/adminUserManagement');
    }
});

router.get('/unblock/:id', function (req, res) {
    console.log(req.params);
    let userId = req.params.id;
    console.log(userId);
    adminSession = req.session
    if (adminSession.adminId) {
        User.updateOne({ _id: userId }, { $set: { status: 'unblocked' } })
            .then((result) => {
                if (adminSession.adminId && req.body.input) {
                    res.render('admin/adminUserManagement', { result })
                } else {
                    res.redirect('/admin/adminUserManagement');
                }
            })
            .catch((err) => {
                console.log(err)
                // res.redirect('/admin');
            })
    } else {
        res.redirect('/admin/adminUserManagement');
    }
});




//Category Management

router.get('/adminCategoryManagement', function (req, res) {
    adminSession = req.session;
    console.log(adminSession)
    Category.find({}).sort({ _id: -1 })
        .then((result) => {
            if (adminSession.adminId) {
                res.render('admin/adminCategoryManagement', { result })
            } else {
                res.redirect('/admin');
            }
        })
        .catch((err) => {
            console.log(err)
            res.redirect('/admin');
        })
});

router.post('/adminCategorySearch', function (req, res) {
    adminSession = req.session
    if (adminSession.adminId) {
        Category.find({ category: req.body.input })
            .then((result) => {
                if (adminSession.adminId && req.body.input) {
                    res.render('admin/adminCategoryManagement', { result })
                } else {
                    res.redirect('/admin/adminCategoryManagement');
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

router.get('/addNewCategory', function (req, res) {
    adminSession = req.session
    if (adminSession.adminId) {
        if (adminSession.categoryExist) {
            req.session.destroy();
            adminSession = req.session
            adminSession.adminId = true;
            const item = [{ message: 'Category already exist' }]
            res.render('admin/addNewCategory', { item });
        } else {
            res.render('admin/addNewCategory');
        }
    } else {
        res.redirect('/admin');
    }
});

router.post('/addNewCategory',
    check('category').notEmpty().withMessage('Please enter a category'),
    function (req, res) {
        const errors = validationResult(req);
        console.log(errors)
        var error1 = errors.errors.find(item => item.param === 'category') || '';
        console.log(error1.msg);
        adminSession = req.session;
        if (!errors.isEmpty()) {
            res.render('admin/addNewCategory', { categoryMsg: error1.msg });
        } else if (adminSession.adminId) {
            Category.find({ category: req.body.category })
                .then((result) => {
                    let temp = result.find(item => item.category)
                    if (temp) {
                        adminSession = req.session;
                        adminSession.categoryExist = true;
                        res.redirect('/admin/addNewCategory');
                    } else {
                        const category = new Category({
                            category: req.body.category
                        })
                        category.save()
                            .then((result) => {
                                console.log(result)
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                        adminSession = req.session;
                        console.log(adminSession)
                        res.redirect('/admin/adminCategoryManagement');
                    }
                })
                .catch((err) => {
                    console.log(err)
                })
        } else {
            res.redirect('/admin');
        }
    });

// router.get('/editCategory/:id', function (req, res) {
//     console.log(req.params);
//     let categoryId = req.params.id;
//     console.log(categoryId);
//     adminSession = req.session;
//     if (adminSession.adminId) {
//         Category.find({ _id: categoryId })
//             .then((result) => {

//                 let current = result.find(item => item.category)
//                 console.log(current)
//                 res.render('admin/adminEditCategory', current)
//             })
//             .catch((err) => {
//                 console.log(err)
//             })
//     }
//     else {
//         res.redirect('/admin/adminCategoryManagement')
//     }
// });

// router.post('/editCategory/:id', function (req, res) {
//     console.log(req.params);
//     console.log(req.body);
//     let newCategoryId = req.params.id;
//     console.log(newCategoryId);

//     adminSession = req.session;
//     if (adminSession.adminId) {
//         if (req.body.newCategory) {
//             Category.updateOne({ _id: newCategoryId }, { $set: { category: req.body.newCategory } })
//                 .then((result) => {

//                     res.redirect('/admin/adminCategoryManagement')
//                 })
//                 .catch((err) => {
//                     console.log(err)
//                 })
//             // } else {
//             //     res.redirect('/admin/adminProductManagement')
//         }
//     } else {
//         console.log('Hi')
//         res.redirect('/admin/adminProductManagement')
//     }
// })

router.get('/deleteCategory/:id', function (req, res) {
    console.log(req.params);
    let categoryId = req.params.id;
    console.log(categoryId);
    adminSession = req.session
    if (adminSession.adminId) {
        Category.deleteOne({ _id: categoryId })
            .then((result) => {
                if (adminSession.adminId && req.body.input) {
                    res.render('admin/adminCategoryManagement', { result })
                } else {
                    res.redirect('/admin/adminCategoryManagement');
                }
            })
            .catch((err) => {
                console.log(err)
                // res.redirect('/admin');
            })
    } else {
        res.redirect('/admin/adminCategoryManagement');
    }
});



//Offer Management

router.get('/adminOfferManagement', function (req, res) {
    adminSession = req.session;
    console.log(adminSession)
    Offer.find({}).sort({ _id: -1 })
        .then((result) => {
            if (adminSession.adminId) {
                res.render('admin/adminOfferManagement', { result })
            } else {
                res.redirect('/admin');
            }
        })
        .catch((err) => {
            console.log(err)
            res.redirect('/admin');
        })
});

router.post('/adminOfferSearch', function (req, res) {
    adminSession = req.session
    if (adminSession.adminId) {
        Offer.find({ offer: req.body.input })
            .then((result) => {
                if (adminSession.adminId && req.body.input) {
                    res.render('admin/adminOfferManagement', { result })
                } else {
                    res.redirect('/admin/adminOfferManagement');
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

router.get('/addNewOffer', function (req, res) {
    adminSession = req.session
    if (adminSession.adminId) {
        if (adminSession.offerExist) {
            req.session.destroy();
            adminSession = req.session
            adminSession.adminId = true;
            const item = [{ message: 'Offer already exist' }]
            res.render('admin/addNewOffer', { item });
        } else {
            res.render('admin/addNewOffer');
        }
    } else {
        res.redirect('/admin');
    }
});

router.post('/addNewOffer',
    check('offer').notEmpty().withMessage('Please enter an offer'),
    check('minOrder').notEmpty().withMessage('Please enter a minimum order'),
    check('discount').notEmpty().withMessage('Please enter a discount'),
    check('maxDiscount').notEmpty().withMessage('Please enter a maximum discount'),
    function (req, res) {
        const errors = validationResult(req);
        console.log(errors)
        var error1 = errors.errors.find(item => item.param === 'minOrder') || '';
        var error2 = errors.errors.find(item => item.param === 'discount') || '';
        var error3 = errors.errors.find(item => item.param === 'maxDiscount') || '';
        var error4 = errors.errors.find(item => item.param === 'offer') || '';
        console.log(error1.msg);
        adminSession = req.session;
        if (!errors.isEmpty()) {
            res.render('admin/addNewOffer', { minOrderMsg: error1.msg, discountMsg: error2.msg, maxDiscountMsg: error3.msg, offerMsg: error4.msg });
        } else if (adminSession.adminId) {
            Offer.find({ offer: req.body.offer })
                .then((result) => {
                    let temp = result.find(item => item.offer)
                    if (temp) {
                        adminSession = req.session;
                        adminSession.offerExist = true;
                        res.redirect('/admin/addNewOffer');
                    } else {
                        const offer = new Offer({
                            offer: req.body.offer,
                            minOrder: req.body.minOrder,
                            discount: req.body.discount,
                            maxDiscount: req.body.maxDiscount
                        })
                        offer.save()
                            .then((result) => {
                                console.log(result)
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                        adminSession = req.session;
                        console.log(adminSession)
                        res.redirect('/admin/adminOfferManagement');
                    }
                })
                .catch((err) => {
                    console.log(err)
                })
        } else {
            res.redirect('/admin');
        }
    });

router.get('/editOffer/:id', function (req, res) {
    console.log(req.params);
    let offerId = req.params.id;
    console.log(offerId);
    adminSession = req.session;
    if (adminSession.adminId) {
        Offer.find({ _id: offerId })
            .then((result) => {

                let current = result.find(item => item.offer)
                console.log(current)
                res.render('admin/adminEditOffer', current)
            })
            .catch((err) => {
                console.log(err)
            })
    }
    else {
        res.redirect('/admin/adminOfferManagement')
    }
});

router.post('/editOffer/:id', function (req, res) {
    console.log(req.params);
    console.log(req.body);
    let newOfferId = req.params.id;
    console.log(newOfferId);

    adminSession = req.session;
    if (adminSession.adminId) {
        if (req.body.newMinOrder) {
            Offer.updateOne({ _id: newOfferId }, { $set: { minOrder: req.body.newMinOrder } })
                .then((result) => {

                    res.redirect('/admin/adminOfferManagement')
                })
                .catch((err) => {
                    console.log(err)
                })
            // } else {
            //     res.redirect('/admin/adminProductManagement')
        }
        if (req.body.newDiscount) {
            Offer.updateOne({ _id: newOfferId }, { $set: { discount: req.body.newDiscount } })
                .then((result) => {

                    res.redirect('/admin/adminOfferManagement')
                })
                .catch((err) => {
                    console.log(err)
                })
            // } else {
            //     res.redirect('/admin/adminProductManagement')
        }
        if (req.body.newMaxDiscount) {
            Offer.updateOne({ _id: newOfferId }, { $set: { maxDiscount: req.body.newMaxDiscount } })
                .then((result) => {

                    res.redirect('/admin/adminOfferManagement')
                })
                .catch((err) => {
                    console.log(err)
                })
            // } else {
            //     res.redirect('/admin/adminProductManagement')
        }
        res.redirect('/admin/adminOfferManagement')
    } else {
        console.log('Hi')
        res.redirect('/admin/adminOfferManagement')
    }
})

router.get('/deleteOffer/:id', function (req, res) {
    console.log(req.params);
    let offerId = req.params.id;
    console.log(offerId);
    adminSession = req.session
    if (adminSession.adminId) {
        Offer.deleteOne({ _id: offerId })
            .then((result) => {
                if (adminSession.adminId && req.body.input) {
                    res.render('admin/adminOfferManagement', { result })
                } else {
                    res.redirect('/admin/adminOfferManagement');
                }
            })
            .catch((err) => {
                console.log(err)
                // res.redirect('/admin');
            })
    } else {
        res.redirect('/admin/adminOfferManagement');
    }
});




//Admin logout

router.post('/adminLogout', function (req, res) {
    adminSession = req.session
    adminSession.adminId = false
    adminSession.incorrect = false
    adminSession.alreadyexist = false
    res.redirect('/admin');
});


module.exports = router;