

var bcrypt = require('bcryptjs');

const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const Homepage = require('../models/homepageModel')
const Offer = require('../models/offerModel')
const Product = require('../models/productModel')
const Order = require('../models/orderModel')
const Admin = require('../models/adminModel')

const { check, validationResult } = require('express-validator');

const adminHome = (req, res) => {
    adminSession = req.session;
    console.log(adminSession)
    if (adminSession.adminId) {
        res.render('admin/adminHomepage', { title: 'Shop.admin', id: 'adminSession.adminId', admin: true })
    } else {
        res.redirect('/admin/adminLogin')
    }
}

const adminLoginGet = (req, res) => {
    adminSession = req.session;
    if (adminSession.adminId) {
        console.log(adminSession)
        res.redirect('/admin')
    } else if (adminSession.incorrectAdmin) {
        console.log(adminSession)
        console.log('3')
        req.session.destroy();
        res.render('admin/adminLogin', { title: 'Shop.admin', usernameMessage: 'Username does not exist', admin: true })
    } else if (adminSession.incAdminPwd) {
        console.log(adminSession)
        console.log('4')
        req.session.destroy();
        res.render('admin/adminLogin', { title: 'Shop.admin', passwordMessage: 'Incorrect password', admin: true })
    } else {
        console.log(adminSession)
        res.render('admin/adminLogin', { title: 'Shop.admin', admin: true })
    }
}

const adminLoginPost = function (req, res) {
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
                        console.log(adminSession)
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
            console.log(adminSession)
            console.log('2')
            res.redirect('/admin/adminLogin');
            // res.render('users/login', { title: 'Login', usernameMessage: 'Username does not exist' })
        })
}

const addNewAdminGet = (req, res) => {
    if (adminSession.adminId) {
        res.render('admin/addNewAdmin', { title: 'Shop.admin', admin: true })
    } else {
        res.redirect('/admin');
    }
}

const addNewAdminPost = function (req, res) {
    const errors = validationResult(req);
    console.log(errors)
    const error3 = errors.errors.find(item => item.param === 'username') || '';
    const error4 = errors.errors.find(item => item.param === 'password') || '';

    if (!errors.isEmpty()) {
        res.render('admin/addNewAdmin', { title: 'Shop.admin', usernameMsg: error3.msg, pwdMsg: error4.msg, admin: true });
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
}

const adminProductManagement = function (req, res) {
    adminSession = req.session;
    console.log(adminSession)
    Product.find({}).sort({ _id: -1 })
        .then((result) => {
            if (adminSession.adminId) {
                res.render('admin/adminProductManagement', { title: 'Shop.admin', result, admin: true })
            } else {
                res.redirect('/admin');
            }
        })
        .catch((err) => {
            console.log(err)
            res.redirect('/admin');
        })
}

const adminProductSearch = function (req, res) {
    adminSession = req.session
    if (adminSession.adminId) {
        Product.find({ $or: [{ productName: req.body.input }, { category: req.body.input }] })
            .then((result) => {
                if (adminSession.adminId && req.body.input) {
                    res.render('admin/adminProductManagement', { title: 'Shop.admin', result, admin: true })
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
}

const addNewProductGet = function (req, res) {
    adminSession = req.session
    if (adminSession.adminId) {
        if (adminSession.productExist) {
            req.session.destroy();
            adminSession = req.session
            adminSession.adminId = true;
            const item = [{ message: 'Product already exist' }]
            res.render('admin/addNewProduct', { title: 'Shop.admin', item, admin: true });
        } else {
            // let offerResult;
            // Offer.find({})
            //     .then((result) => {

            //         console.log(result);
            //         offerResult = result;

            //         // res.render('admin/addNewProduct', { offerResult });
            //     })
            //     .catch((err) => {
            //         console.log(err)
            //     })
            // Category.find({})
            //     .then((result) => {
            //         console.log(result);
            //         // res.render('admin/addNewProduct', { result, offerResult, admin: true });
            //     })
            //     .catch((err) => {
            //         console.log(err)
            //     })
            Promise.all([Offer.find({}), Category.find({})])
                .then((result) => {
                    let offerResult, categoryResult;
                    [offerResult, categoryResult] = result;
                    res.render('admin/addNewProduct', { title: 'Shop.admin', offerResult, categoryResult, admin: true });
                })
                .catch((err) => {
                    console.log(err)
                })
            // res.render('admin/addNewProduct');
        }
    } else {
        res.redirect('/admin');
    }
}

const addNewProductPost = function (req, res) {
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
        let offerResult;
        Offer.find({})
            .then((result) => {

                console.log(result);
                offerResult = result;

                // res.render('admin/addNewProduct', { offerResult });
            })
            .catch((err) => {
                console.log(err)
            })
        Category.find({})
            .then((result) => {
                console.log(result);
                res.render('admin/addNewProduct', { title: 'Shop.admin', result, offerResult, productNameMsg: error1.msg, descriptionMsg: error2.msg, priceMsg: error3.msg, stockMsg: error4.msg, imageMsg: error5.msg, categoryMsg: error6.msg, admin: true });
            })
            .catch((err) => {
                console.log(err)
            })
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
}

const editProductGet = function (req, res) {
    console.log(req.params);
    let productId = req.params.id;
    console.log(productId);
    adminSession = req.session;
    if (adminSession.adminId) {
        // let categoryResult;
        // Category.find({})
        //     .then((result) => {
        //         categoryResult = result
        //     })
        //     .catch((err) => {
        //         console.log(err)
        //     })
        // let offerResult;
        // Offer.find({})
        //     .then((result) => {
        //         offerResult = result
        //     })
        //     .catch((err) => {
        //         console.log(err)
        //     })
        // let productResult;
        // Product.findOne({ _id: productId })
        //     .then((result) => {
        //         console.log(result)
        //         productResult = result
        //         // res.render('admin/adminEditProduct', { productResult, offerResult, categoryResult, admin: true })
        //     })
        //     .catch((err) => {
        //         console.log(err)
        //     })
        Promise.all([Category.find({}), Offer.find({}), Product.findOne({ _id: productId })])
            .then((result) => {
                console.log(result);
                let categoryResult, offerResult, productResult;
                [categoryResult, offerResult, productResult] = result;
                res.render('admin/adminEditProduct', { title: 'Shop.admin', productResult, offerResult, categoryResult, admin: true })
            })
            .catch((err) => {
                console.log(err)
            })
    }
    else {
        res.redirect('/admin/adminProductManagement')
    }
}

const editProductPost = function (req, res) {
    console.log(req.params);
    console.log(req.body);
    let newProductId = req.params.id;
    console.log(newProductId);

    adminSession = req.session;
    if (adminSession.adminId) {
        if (req.body.newDescription) {
            Product.updateOne({ _id: newProductId }, { $set: { description: req.body.newDescription } })
                .then((result) => {
                    console.log(result);
                    // res.redirect('/admin/adminProductManagement')
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
                    // res.redirect('/admin/adminProductManagement')
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
                    // res.redirect('/admin/adminProductManagement')
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
                    // res.redirect('/admin/adminProductManagement')
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
                    // res.redirect('/admin/adminProductManagement')
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
                    // res.redirect('/admin/adminProductManagement')
                })
                .catch((err) => {
                    console.log(err)
                })
            // } else {
            //     res.redirect('/admin/adminProductManagement')
        }
        res.redirect('/admin/adminProductManagement')
    } else {
        console.log('Hi')
        res.redirect('/admin/adminProductManagement')
    }
}

const deleteProduct = function (req, res) {
    console.log(req.params);
    let productId = req.params.id;
    console.log(productId);
    adminSession = req.session
    if (adminSession.adminId) {
        Product.deleteOne({ _id: productId })
            .then((result) => {
                if (adminSession.adminId && req.body.input) {
                    res.render('admin/adminProductManagement', { title: 'Shop.admin', result, admin: true })
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
}

const adminUserManagement = function (req, res) {
    adminSession = req.session;
    console.log(adminSession)
    User.find({}).sort({ _id: -1 })
        .then((result) => {
            if (adminSession.adminId) {
                res.render('admin/adminUserManagement', { title: 'Shop.admin', result, admin: true })
            } else {
                res.redirect('/admin');
            }
        })
        .catch((err) => {
            console.log(err)
            res.redirect('/admin');
        })
}

const adminUserSearch = function (req, res) {
    adminSession = req.session
    if (adminSession.adminId) {
        Product.find({ $or: [{ name: req.body.input }, { username: req.body.input }] })
            .then((result) => {
                if (adminSession.adminId && req.body.input) {
                    res.render('admin/adminUserManagement', { title: 'Shop.admin', result, admin: true })
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
}

const blockUser = function (req, res) {
    console.log(req.params);
    let userId = req.params.id;
    console.log(userId);
    adminSession = req.session
    if (adminSession.adminId) {
        User.updateOne({ _id: userId }, { $set: { status: 'blocked' } })
            .then((result) => {
                if (adminSession.adminId && req.body.input) {
                    res.render('admin/adminUserManagement', { title: 'Shop.admin', result, admin: true })
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
}

const unblockUser = function (req, res) {
    console.log(req.params);
    let userId = req.params.id;
    console.log(userId);
    adminSession = req.session
    if (adminSession.adminId) {
        User.updateOne({ _id: userId }, { $set: { status: 'unblocked' } })
            .then((result) => {
                if (adminSession.adminId && req.body.input) {
                    res.render('admin/adminUserManagement', { title: 'Shop.admin', result, admin: true })
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
}

const adminCategoryManagement = function (req, res) {
    adminSession = req.session;
    console.log(adminSession)
    Category.find({}).sort({ _id: -1 })
        .then((result) => {
            if (adminSession.adminId) {
                res.render('admin/adminCategoryManagement', { title: 'Shop.admin', result, admin: true })
            } else {
                res.redirect('/admin');
            }
        })
        .catch((err) => {
            console.log(err)
            res.redirect('/admin');
        })
}

const adminCategorySearch = function (req, res) {
    adminSession = req.session
    if (adminSession.adminId) {
        Category.find({ category: req.body.input })
            .then((result) => {
                if (adminSession.adminId && req.body.input) {
                    res.render('admin/adminCategoryManagement', { title: 'Shop.admin', result, admin: true })
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
}

const addNewCategoryGet = function (req, res) {
    adminSession = req.session
    if (adminSession.adminId) {
        if (adminSession.categoryExist) {
            req.session.destroy();
            adminSession = req.session
            adminSession.adminId = true;
            const item = [{ message: 'Category already exist' }]
            res.render('admin/addNewCategory', { title: 'Shop.admin', item, admin: true });
        } else {
            res.render('admin/addNewCategory', { title: 'Shop.admin', admin: true });
        }
    } else {
        res.redirect('/admin');
    }
}

const addNewCategoryPost = function (req, res) {
    const errors = validationResult(req);
    console.log(errors)
    var error1 = errors.errors.find(item => item.param === 'category') || '';
    console.log(error1.msg);
    adminSession = req.session;
    if (!errors.isEmpty()) {
        res.render('admin/addNewCategory', { title: 'Shop.admin', categoryMsg: error1.msg, admin: true });
    } else if (adminSession.adminId) {
        Category.find({ categoryName: req.body.category })
            .then((result) => {
                let temp = result.find(item => item.categoryName)
                if (temp) {
                    adminSession = req.session;
                    adminSession.categoryExist = true;
                    res.redirect('/admin/addNewCategory');
                } else {
                    const category = new Category({
                        categoryName: req.body.category
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
}

const deleteCategory = function (req, res) {
    console.log(req.params);
    let categoryId = req.params.id;
    console.log(categoryId);
    adminSession = req.session
    if (adminSession.adminId) {
        Category.deleteOne({ _id: categoryId })
            .then((result) => {
                if (adminSession.adminId && req.body.input) {
                    res.render('admin/adminCategoryManagement', { title: 'Shop.admin', result, admin: true })
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
}

const adminOfferManagement = function (req, res) {
    adminSession = req.session;
    console.log(adminSession)
    Offer.find({}).sort({ _id: -1 })
        .then((result) => {
            if (adminSession.adminId) {
                res.render('admin/adminOfferManagement', { title: 'Shop.admin', result, admin: true })
            } else {
                res.redirect('/admin');
            }
        })
        .catch((err) => {
            console.log(err)
            res.redirect('/admin');
        })
}

const adminOfferSearch = function (req, res) {
    adminSession = req.session
    if (adminSession.adminId) {
        Offer.find({ offer: req.body.input })
            .then((result) => {
                if (adminSession.adminId && req.body.input) {
                    res.render('admin/adminOfferManagement', { title: 'Shop.admin', result, admin: true })
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
}

const addNewOfferGet = function (req, res) {
    adminSession = req.session
    if (adminSession.adminId) {
        if (adminSession.offerExist) {
            req.session.destroy();
            adminSession = req.session
            adminSession.adminId = true;
            const item = [{ message: 'Offer already exist' }]
            res.render('admin/addNewOffer', { title: 'Shop.admin', item, admin: true });
        } else {
            res.render('admin/addNewOffer', { title: 'Shop.admin', admin: true });
        }
    } else {
        res.redirect('/admin');
    }
}

const addNewOfferPost = function (req, res) {
    const errors = validationResult(req);
    console.log(errors)
    var error1 = errors.errors.find(item => item.param === 'minOrder') || '';
    var error2 = errors.errors.find(item => item.param === 'discount') || '';
    var error3 = errors.errors.find(item => item.param === 'maxDiscount') || '';
    var error4 = errors.errors.find(item => item.param === 'offer') || '';
    console.log(error1.msg);
    adminSession = req.session;
    if (!errors.isEmpty()) {
        res.render('admin/addNewOffer', { title: 'Shop.admin', minOrderMsg: error1.msg, discountMsg: error2.msg, maxDiscountMsg: error3.msg, offerMsg: error4.msg, admin: true });
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
}

const editOfferGet = function (req, res) {
    console.log(req.params);
    let offerId = req.params.id;
    console.log(offerId);
    adminSession = req.session;
    if (adminSession.adminId) {
        Offer.findOne({ _id: offerId })
            .then((result) => {

                // let current = result.find(item => item.offer)
                // current.admin = true;
                console.log(result)
                res.render('admin/adminEditOffer', { title: 'Shop.admin', result, admin: true })
            })
            .catch((err) => {
                console.log(err)
            })
    }
    else {
        res.redirect('/admin/adminOfferManagement')
    }
}

const editOfferPost = function (req, res) {
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
}

const deleteOffer = function (req, res) {
    console.log(req.params);
    let offerId = req.params.id;
    console.log(offerId);
    adminSession = req.session
    if (adminSession.adminId) {
        Offer.deleteOne({ _id: offerId })
            .then((result) => {
                if (adminSession.adminId && req.body.input) {
                    res.render('admin/adminOfferManagement', { title: 'Shop.admin', result, admin: true })
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
}

const userHomepageLayoutGet = function (req, res) {
    adminSession = req.session
    if (adminSession.adminId) {
        Product.find({})
            .then((result) => {

                console.log(result);

                res.render('admin/userHomepageLayout', { title: 'Shop.admin', result, admin: true });
            })
            .catch((err) => {
                console.log(err)
            })
    } else {
        res.redirect('/admin');
    }
}

const userHomepageLayoutPost = function (req, res) {
    if (adminSession.adminId) {
        if (req.body.firstRow1) {
            Product.findOne({ productName: req.body.firstRow1 })
                .then((result) => {
                    console.log(result)
                    Homepage.updateOne({}, { $set: { firstRow1: result } })
                        .then((result) => {
                            // res.redirect('/admin')
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
                .catch((err) => {
                    console.log(err)
                })
        }
        if (req.body.firstRow2) {
            Product.findOne({ productName: req.body.firstRow2 })
                .then((result) => {
                    // console.log(result)
                    Homepage.updateOne({}, { $set: { firstRow2: result } })
                        .then((result) => {
                            // res.redirect('/admin')
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
                .catch((err) => {
                    console.log(err)
                })
        }
        if (req.body.firstRow3) {
            Product.findOne({ productName: req.body.firstRow3 })
                .then((result) => {
                    // console.log(result)
                    Homepage.updateOne({}, { $set: { firstRow3: result } })
                        .then((result) => {
                            // res.redirect('/admin')
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
                .catch((err) => {
                    console.log(err)
                })
        }

        if (req.body.firstRow4) {
            Product.findOne({ productName: req.body.firstRow4 })
                .then((result) => {
                    // console.log(result)
                    Homepage.updateOne({}, { $set: { firstRow4: result } })
                        .then((result) => {
                            // res.redirect('/admin')
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
                .catch((err) => {
                    console.log(err)
                })
        }

        if (req.body.banner1) {
            Product.findOne({ productName: req.body.banner1 })
                .then((result) => {
                    // console.log(result)
                    Homepage.updateOne({}, { $set: { banner1: result } })
                        .then((result) => {
                            // res.redirect('/admin')
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
                .catch((err) => {
                    console.log(err)
                })
        }

        if (req.body.banner2) {
            Product.findOne({ productName: req.body.banner2 })
                .then((result) => {
                    // console.log(result)
                    Homepage.updateOne({}, { $set: { banner2: result } })
                        .then((result) => {
                            // res.redirect('/admin')
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
                .catch((err) => {
                    console.log(err)
                })
        }

        if (req.body.banner3) {
            Product.findOne({ productName: req.body.banner3 })
                .then((result) => {
                    // console.log(result)
                    Homepage.updateOne({}, { $set: { banner3: result } })
                        .then((result) => {
                            // res.redirect('/admin')
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
                .catch((err) => {
                    console.log(err)
                })
        }

        if (req.body.lastRow1) {
            Product.findOne({ productName: req.body.lastRow1 })
                .then((result) => {
                    // console.log(result)
                    Homepage.updateOne({}, { $set: { lastRow1: result } })
                        .then((result) => {
                            // res.redirect('/admin')
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
                .catch((err) => {
                    console.log(err)
                })
        }

        if (req.body.lastRow2) {
            Product.findOne({ productName: req.body.lastRow2 })
                .then((result) => {
                    // console.log(result)
                    Homepage.updateOne({}, { $set: { lastRow2: result } })
                        .then((result) => {
                            // res.redirect('/admin')
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
                .catch((err) => {
                    console.log(err)
                })
        }

        if (req.body.lastRow3) {
            Product.findOne({ productName: req.body.lastRow3 })
                .then((result) => {
                    // console.log(result)
                    Homepage.updateOne({}, { $set: { lastRow3: result } })
                        .then((result) => {
                            // res.redirect('/admin')
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
                .catch((err) => {
                    console.log(err)
                })
        }

        if (req.body.lastRow4) {
            Product.findOne({ productName: req.body.lastRow4 })
                .then((result) => {
                    // console.log(result)
                    Homepage.updateOne({}, { $set: { lastRow4: result } })
                        .then((result) => {
                            // res.redirect('/admin')
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
                .catch((err) => {
                    console.log(err)
                })
        }
        res.redirect('/admin')
    } else {
        res.redirect('/admin');
    }
}

const adminLogout = function (req, res) {
    adminSession = req.session
    adminSession.adminId = false
    adminSession.incorrectAdmin = false
    adminSession.incAdminPwd = false
    adminSession.adminAlreadyExist = false
    adminSession.productExist = false
    adminSession.categoryExist = false
    adminSession.offerExist = false
    res.redirect('/admin');
}


module.exports = {
    adminHome,
    adminLoginGet,
    adminLoginPost,
    addNewAdminGet,
    addNewAdminPost,
    adminProductManagement,
    adminProductSearch,
    addNewProductGet,
    addNewProductPost,
    editProductGet,
    editProductPost,
    deleteProduct,
    adminUserManagement,
    adminUserSearch,
    blockUser,
    unblockUser,
    adminCategoryManagement,
    adminCategorySearch,
    addNewCategoryGet,
    addNewCategoryPost,
    deleteCategory,
    adminOfferManagement,
    adminOfferSearch,
    addNewOfferGet,
    addNewOfferPost,
    editOfferGet,
    editOfferPost,
    deleteOffer,
    userHomepageLayoutGet,
    userHomepageLayoutPost,
    adminLogout
}