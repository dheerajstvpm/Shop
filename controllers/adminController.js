

var bcrypt = require('bcryptjs');

const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const Homepage = require('../models/homepageModel')
const Offer = require('../models/offerModel')
const Coupon = require('../models/couponModel')
const Product = require('../models/productModel')
const Order = require('../models/orderModel')
const Admin = require('../models/adminModel')

const { check, validationResult } = require('express-validator');

const fs = require('fs');
const fileUpload = require('express-fileupload');
const { FieldValueList } = require('twilio/lib/rest/autopilot/v1/assistant/fieldType/fieldValue');


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
    // To be deleted
    // adminSession.adminId = 'admin';
    //
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

const addNewProductPost = async function (req, res) {
    const errors = validationResult(req);
    console.log(errors)
    var error1 = errors.errors.find(item => item.param === 'productName') || '';
    var error2 = errors.errors.find(item => item.param === 'description') || '';
    var error3 = errors.errors.find(item => item.param === 'price') || '';
    var error4 = errors.errors.find(item => item.param === 'stock') || '';
    var error5 = errors.errors.find(item => item.param === 'category') || '';
    console.log(req.files)
    if (req.files == null) {
        image1Msg = "Please upload an image";
        image2Msg = "Please upload an image";
        image3Msg = "Please upload an image";
    } else if (req.files.image1 == null) {
        image1Msg = "Please upload an image";
    } else if (req.files.image2 == null) {
        image2Msg = "Please upload an image";
    } else if (req.files.image3 == null) {
        image3Msg = "Please upload an image";
    }
    console.log(error5.msg);
    adminSession = req.session;
    if (!errors.isEmpty()) {
        let offerResult;
        try {
            offerResult = await Offer.find({})
            categoryResult = await Category.find({})
            res.render('admin/addNewProduct', { title: 'Shop.admin', offerResult, categoryResult, productNameMsg: error1.msg, descriptionMsg: error2.msg, priceMsg: error3.msg, stockMsg: error4.msg, image1Msg: image1Msg, image2Msg: image2Msg, image3Msg: image3Msg, categoryMsg: error5.msg, admin: true });
        }
        catch (err) {
            console.log(err)
        }
    } else if (adminSession.adminId) {
        try {
            result = await Product.find({ productName: req.body.productName })

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
                    // image: req.body.image,
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
                let image1 = req.files.image1;
                image1.mv('./public/image/' + "image1" + product._id + ".jpg");
                let image2 = req.files.image2;
                image2.mv('./public/image/' + "image2" + product._id + ".jpg");
                let image3 = req.files.image3;
                image3.mv('./public/image/' + "image3" + product._id + ".jpg");
                adminSession = req.session;
                console.log(adminSession)
                res.redirect('/admin/adminProductManagement');
            }
        }
        catch (err) {
            console.log(err)
        }
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

const editProductPost = async function (req, res) {
    console.log(req.params);
    console.log(req.body);
    let newProductId = req.params.id;
    console.log(newProductId);

    adminSession = req.session;
    if (adminSession.adminId) {
        if (req.body.newDescription) {
            //--------------------------------
            try {
                const results = await User.find({})
                for (result of results) {
                    carts = result.cart
                    for (let cart of carts) {
                        cartId = "" + cart._id
                        if (cartId === newProductId) {
                            result2 = await User.updateOne({ "_id": result._id, "cart._id": newProductId }, { $set: { "cart.$.description": req.body.newDescription } })
                        }
                    }
                }
            }
            catch (err) {
                console.log(err)
            }
            //--------------------------------
            try {
                const results = await User.find({})
                for (result of results) {
                    wishlists = result.wishlist
                    for (let wishlist of wishlists) {
                        wishlistId = "" + wishlist._id
                        if (wishlistId === newProductId) {
                            result2 = await User.updateOne({ "_id": result._id, "wishlist._id": newProductId }, { $set: { "wishlist.$.description": req.body.newDescription } })
                        }
                    }
                }
            }
            catch (err) {
                console.log(err)
            }
            //-----------------------------------
            //-----------------------------------
            try {
                await Product.updateOne({ _id: newProductId }, { $set: { description: req.body.newDescription } })
            }
            catch (err) {
                console.log(err)
            }
            // } else {
            //     res.redirect('/admin/adminProductManagement')
        }
        if (req.body.newPrice) {

            //--------------------------------
            try {
                const results = await User.find({})
                for (result of results) {
                    carts = result.cart
                    for (let cart of carts) {
                        cartId = "" + cart._id
                        if (cartId === newProductId) {
                            result2 = await User.updateOne({ "_id": result._id, "cart._id": newProductId }, { $set: { "cart.$.price": req.body.newPrice } })
                        }
                    }
                }
            }
            catch (err) {
                console.log(err)
            }
            //-----------------------------------

            //--------------------------------
            try {
                const results = await User.find({})
                for (result of results) {
                    wishlists = result.wishlist
                    for (let wishlist of wishlists) {
                        wishlistId = "" + wishlist._id
                        if (wishlistId === newProductId) {
                            result2 = await User.updateOne({ "_id": result._id, "wishlist._id": newProductId }, { $set: { "wishlist.$.price": req.body.newPrice } })
                        }
                    }
                }
            }
            catch (err) {
                console.log(err)
            }
            //-----------------------------------
            try {
                await Product.updateOne({ _id: newProductId }, { $set: { price: req.body.newPrice } })
            }
            catch (err) {
                console.log(err)
            }
            //-----------------------------------
        }
        if (req.body.newStock) {
            Product.updateOne({ _id: newProductId }, { $set: { stock: req.body.newStock } })
                .then((result) => {
                    // console.log("hi");
                    // console.log(result);
                    // res.redirect('/admin/adminProductManagement')
                })
                .catch((err) => {
                    console.log(err)
                })
            // } else {
            //     res.redirect('/admin/adminProductManagement')
        }
        if (req.files?.newImage1 || '') {
            Product.findOne({ _id: newProductId })
                .then((result) => {
                    console.log("image1");
                    let image1 = req.files.newImage1;
                    image1.mv('./public/images/' + "image1" + result._id + ".jpg");
                    // res.redirect('/admin/adminProductManagement')
                })
                .catch((err) => {
                    console.log(err)
                })
            // } else {
            //     res.redirect('/admin/adminProductManagement')
        }
        if (req.files?.newImage2 || '') {
            console.log("image2");
            Product.findOne({ _id: newProductId })
                .then((result) => {
                    console.log(result);
                    let image2 = req.files.newImage2;
                    image2.mv('./public/images/' + "image2" + result._id + ".jpg");
                    // res.redirect('/admin/adminProductManagement')
                })
                .catch((err) => {
                    console.log(err)
                })

        }
        if (req.files?.newImage3 || '') {
            console.log("image3");
            Product.findOne({ _id: newProductId })
                .then((result) => {
                    console.log(result);
                    let image3 = req.files.newImage3;
                    image3.mv('./public/images/' + "image3" + result._id + ".jpg");
                    // res.redirect('/admin/adminProductManagement')
                })
                .catch((err) => {
                    console.log(err)
                })
        }
        if (req.body.newCategory) {
            //--------------------------------
            try {
                const results = await User.find({})
                for (result of results) {
                    carts = result.cart
                    for (let cart of carts) {
                        cartId = "" + cart._id
                        if (cartId === newProductId) {
                            result2 = await User.updateOne({ "_id": result._id, "cart._id": newProductId }, { $set: { "cart.$.category": req.body.newCategory } })
                        }
                    }
                }
            }
            catch (err) {
                console.log(err)
            }
            //-----------------------------------
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
            //--------------------------------
            try {
                const results = await User.find({})
                for (result of results) {
                    carts = result.cart
                    for (let cart of carts) {
                        cartId = "" + cart._id
                        if (cartId === newProductId) {
                            result2 = await User.updateOne({ "_id": result._id, "cart._id": newProductId }, { $set: { "cart.$.offer": req.body.newOffer } })
                        }
                    }
                }
            }
            catch (err) {
                console.log(err)
            }
            //-----------------------------------
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
                fs.unlink('./public/image/' + "image1" + productId + ".jpg");
                fs.unlink('./public/image/' + "image2" + productId + ".jpg");
                fs.unlink('./public/image/' + "image3" + productId + ".jpg");
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
        User.updateOne({ _id: userId }, { $set: { status: '' } })
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

const adminCategoryManagement = async function (req, res) {
    adminSession = req.session;

    offerResult = await Offer.find({})
    categoryResult = await Category.find({}).sort({ _id: -1 })
    let newArray = []
    for (let category of categoryResult) {
        // category=category.toJSON()
        category.offerResult = offerResult
        newArray.push(category)
    }
    if (adminSession.categoryProductExist) {
        adminSession.categoryProductExist = false
        console.log(`categoryResult:${categoryResult}`)
        console.log(offerResult)
        res.render('admin/adminCategoryManagement', { title: 'Shop.admin', newArray, categoryMsg: "Can not delete this category. Product in this category exists.", admin: true })
    } else if (adminSession.adminId) {
        console.log(categoryResult)

        console.log(offerResult)

        console.log(newArray)
        res.render('admin/adminCategoryManagement', { title: 'Shop.admin', newArray, admin: true })
    } else {
        res.redirect('/admin');
    }
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
            adminSession = req.session
            adminSession.categoryExist = false;
            // const item = [{ message: 'Category already exist' }]
            res.render('admin/addNewCategory', { title: 'Shop.admin', categoryMsg: 'Category already exist', admin: true });
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
        Category.find({ categoryName: req.body.category.toUpperCase() })
            .then((result) => {
                let temp = result.find(item => item.categoryName)
                if (temp) {
                    adminSession = req.session;
                    adminSession.categoryExist = true;
                    res.redirect('/admin/addNewCategory');
                } else {
                    const category = new Category({
                        categoryName: req.body.category.toUpperCase()
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
        Product.findOne({ category: categoryId })
            .then((product) => {
                console.log(product)
                if (product === null) {
                    Category.deleteOne({ categoryName: categoryId })
                        .then((result) => {
                            res.redirect('/admin/adminCategoryManagement');
                        })
                        .catch((err) => {
                            console.log(err)
                            // res.redirect('/admin');
                        })
                } else {
                    adminSession.categoryProductExist = true
                    res.redirect('/admin/adminCategoryManagement');
                }
            })
            .catch((err) => {
                console.log(err)
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

const editOfferPost = async function (req, res) {
    console.log(req.params);
    console.log(req.body);
    let newOfferId = req.params.id;
    console.log(newOfferId);

    adminSession = req.session;
    if (adminSession.adminId) {
        if (req.body.newName) {
            try {
                const result = await Offer.findOneAndUpdate({ _id: newOfferId }, { $set: { offerName: req.body.newName } })
                const prdt = await Product.updateMany({ offer: result.offerName }, { $set: { offer: req.body.newName } })
            } catch (err) {
                console.log(err)
            }
        }
        if (req.body.newMinOrder) {
            try {
                const result = await Offer.updateOne({ _id: newOfferId }, { $set: { minOrder: req.body.newMinOrder } })
            } catch (err) {
                console.log(err)
            }
        }
        if (req.body.newDiscount) {
            try {
                const result = await Offer.updateOne({ _id: newOfferId }, { $set: { discount: req.body.newDiscount } })
            } catch (err) {
                console.log(err)
            }
        }
        if (req.body.newMaxDiscount) {
            try {
                const result = await Offer.updateOne({ _id: newOfferId }, { $set: { maxDiscount: req.body.newMaxDiscount } })
            } catch (err) {
                console.log(err)
            }
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

let customerId;
const adminOrderManagementGet = function (req, res) {
    adminSession = req.session;
    customerId = req.params.id
    console.log(customerId)
    if (adminSession.adminId) {
        User.findOne({ _id: customerId })
            .then((result) => {
                console.log(result)
                result = result.order.reverse()
                res.render('admin/adminOrderManagement', { title: 'Shop.admin', admin: true, result })
            })
            .catch((err) => {
                console.log(err)
            })
    } else {
        res.redirect('/admin')
    }
}


const adminAllOrderManagementGet = async (req, res) => {
    adminSession = req.session;
    if (adminSession.adminId) {
        const result = await User.find({})

        // console.log(result)
        let orders = []
        for (item of result) {
            orders = orders.concat(item.order)
        }
        // result = result.order.reverse()
        orders.sort((a, b) => {
            return b.createdAt - a.createdAt;
        });
        const limit = 10
        const pages = Math.ceil(orders.length / limit)
        console.log(orders.length)
        console.log(orders.length / limit)
        console.log(pages)
        const page = {}
        page.page = req.params.page
        if (page.page > 1) {
            page.previous = parseInt(page.page) - 1
        } else {
            page.previous = false
        }
        if (page.page < pages) {
            page.next = parseInt(page.page) + 1
        } else {
            page.next = false
        }
        if (page.page > 0 && page.page < pages - 1) {
            page.page1 = parseInt(page.page)
            page.page1Active = true
        } else {
            page.page1 = pages - 2
            page.page1Active = false
        }
        if (page.page > 0 && page.page < pages - 1) {
            page.page2 = parseInt(page.page) + 1
        } else {
            page.page2 = pages - 1
        }
        if (page.page2 == page.page) {
            page.page2Active = true
        } else {
            page.page2Active = false
        }
        if (page.page > 0 && page.page < pages - 1) {
            page.page3 = parseInt(page.page) + 2
        } else {
            page.page3 = pages
        }
        if (page.page3 == page.page) {
            page.page3Active = true
        } else {
            page.page3Active = false
        }

        console.log(page)

        start = (page.page - 1) * limit
        end = start + limit
        // console.log(orders)
        console.log(start)
        console.log(end)
        order = orders.slice(start, end)
        // console.log(order)

        res.render('admin/adminAllOrderManagement', { title: 'Shop.admin', admin: true, order, page })

    } else {
        res.redirect('/admin')
    }
}

const adminDatatableOrderManagementGet = async (req, res) => {
    adminSession = req.session;
    if (adminSession.adminId) {
        const result = await User.find({})

        // console.log(result)
        let orders = []
        for (item of result) {
            orders = orders.concat(item.order)
        }
        // result = result.order.reverse()
        orders.sort((a, b) => {
            return b.createdAt - a.createdAt;
        });
        res.render('admin/adminDatatableOrderManagement', { title: 'Shop.admin', admin: true, orders })

    } else {
        res.redirect('/admin')
    }
}


const adminOrderCancel = async (req, res) => {
    adminSession = req.session;
    uniqueId = req.params.id;
    console.log(uniqueId)
    console.log(customerId)
    if (adminSession.adminId) {
        result = await User.findOne({ _id: customerId })
        // console.log(result)

        const orders = result.order

        console.log(orders)

        for (let order of orders) {
            order = order.toJSON();
            if (order.unique === uniqueId) {
                await User.updateOne({ "_id": customerId, "order.unique": uniqueId }, { $set: { "order.$.orderStatus": "Order cancelled" } })
                await User.updateOne({ "_id": customerId, "order.unique": uniqueId }, { $set: { "order.$.cancelBtn": false } })
                await User.updateOne({ "_id": customerId, "order.unique": uniqueId }, { $set: { "order.$.returnBtn": false } })
                await User.updateOne({ "_id": customerId, "order.unique": uniqueId }, { $set: { "order.$.updateBtn": false } })
                await Product.updateOne({ "_id": order._id }, { $inc: { "stock": order.count, "sales": (order.count * -1) } })
            }

        }
        res.redirect('back')
    } else {
        res.redirect('/admin')
    }
}



const adminDashboard = (req, res) => {
    adminSession = req.session;
    if (adminSession.adminId) {
        const sales = [];
        const timeOfSale = [];
        let k = 0;
        let l = 0;
        let m = [];
        let n;

        User.find({})
            .then((results) => {
                // console.log(result)
                let sums;
                n = results.length;
                console.log(`n:${n}`);
                for (result of results) {
                    k++;
                    console.log(`k:${k}`);
                    const orders = result.order
                    m.push(orders.length);
                    console.log(`m:${m}`);

                    console.log(`sums:${sums}`)
                    for (let order of orders) {
                        l++;
                        console.log(`l:${l}`);
                        sums = m.reduce((partialSum, a) => partialSum + a, 0);
                        order = order.toJSON();

                        if (order.orderStatus !== "Order cancelled") {
                            console.log(order.count);
                            console.log(order.price);
                            sales.push(order.count * order.price);
                            console.log(sales);
                            timeOfSale.push(order.createdAt.toISOString().substring(0, 10));
                            console.log(timeOfSale);
                        }

                        // operation();
                    }
                    if (l === sums && k === n) {
                        console.log(sales);
                        console.log(typeof (sales[0]));

                        console.log(timeOfSale);
                        console.log(typeof (timeOfSale[0]));
                        Product.find({})
                            .then((result) => {
                                const sum = function (items, prop1, prop2) {
                                    return items.reduce(function (a, b) {
                                        return parseInt(a) + (parseInt(b[prop1]) * parseInt(b[prop2]));
                                    }, 0);
                                };
                                const total = sum(result, 'price', 'sales');
                                res.render('admin/adminDashboard', { title: 'Shop.admin', admin: true, result, total: total, sales, timeOfSale })
                            }).catch((err) => {
                                console.log(err)
                            })
                    }
                }
            })
    } else {
        res.redirect('/admin')
    }
}

const adminAllOrderUpdate = async (req, res) => {
    adminSession = req.session;
    if (adminSession.adminId) {
        uniqueId = req.params.unique
        try {
            result = await User.find({})
            // console.log(result)
            let orders = []
            for (item of result) {
                orders = orders.concat(item.order)
            }
            // console.log(orders)

            for (let order of orders) {
                order = order.toJSON();
                if (order.unique === uniqueId) {
                    console.log(req.body)
                    console.log(req.params)
                    if (req.body.status === "Cancelled") {
                        console.log("cancelled")
                        await User.updateOne({ "order.unique": uniqueId }, { $set: { "order.$.orderStatus": "Order cancelled", "order.$.cancelBtn": false, "order.$.returnBtn": false, "order.$.updateBtn": false } })
                        await Product.updateOne({ "_id": order._id }, { $inc: { "stock": order.count, "sales": (order.count * -1) } })
                    } else if (req.body.status === "Dispatched") {
                        console.log("dispatched")
                        await User.updateOne({ "order.unique": uniqueId }, { $set: { "order.$.orderStatus": "Order dispatched", "order.$.cancelBtn": true, "order.$.returnBtn": false, "order.$.updateBtn": true } })
                    } else if (req.body.status === "Delivered") {
                        console.log("delivered")
                        await User.updateOne({ "order.unique": uniqueId }, { $set: { "order.$.orderStatus": "Order delivered", "order.$.cancelBtn": false, "order.$.returnBtn": true, "order.$.updateBtn": false } })
                    }
                }
            }
            res.redirect('back')
        } catch (err) {
            console.log(err)
        }

    } else {
        res.redirect('/admin')
    }
}


const adminCategoryOfferUpdate = async function (req, res) {
    console.log(req.params);
    console.log(req.body);
    let category = req.params.category;
    console.log(category);
    console.log(req.body.offer);

    adminSession = req.session;
    if (adminSession.adminId) {
        if (req.body.offer) {
            try {
                //--------------------------------
                try {
                    const results = await User.find({})
                    for (result of results) {
                        carts = result.cart
                        for (let cart of carts) {
                            cartCategory = cart.category
                            if (cartCategory === req.params.category) {
                                result2 = await User.updateOne({ "_id": result._id, "cart._id": cart._id }, { $set: { "cart.$.offer": req.body.offer } })
                            }
                        }
                    }
                }
                catch (err) {
                    console.log(err)
                }
                //-----------------------------------
                await Product.updateMany({ category: req.params.category }, { $set: { offer: req.body.offer } })
                offerResult = await Offer.find({})
                categoryResult = await Category.find({}).sort({ _id: -1 })
                console.log(categoryResult)
                let newArray = []
                console.log(offerResult)
                for (let category of categoryResult) {
                    // category=category.toJSON()
                    category.offerResult = offerResult
                    newArray.push(category)
                }
                console.log(newArray)
                res.render('admin/adminCategoryManagement', { title: 'Shop.admin', newArray, admin: true })
            } catch (err) {
                console.log(err)
            }
        }
    } else {
        res.redirect('/admin')
    }
}



const adminCouponManagement = async function (req, res) {
    adminSession = req.session;
    console.log(adminSession)
    Coupon.find({}).sort({ _id: -1 })
        .then((result) => {
            if (adminSession.adminId) {
                res.render('admin/adminCouponManagement', { title: 'Shop.admin', result, admin: true })
            } else {
                res.redirect('/admin');
            }
        })
        .catch((err) => {
            console.log(err)
            res.redirect('/admin');
        })
}

const addNewCouponGet = async function (req, res) {
    adminSession = req.session;
    if (adminSession.adminId) {
        res.render('admin/addNewCoupon', { title: 'Shop.admin', admin: true })

    } else {
        res.redirect('/admin');
    }
}

const addNewCouponPost = async function (req, res) {
    adminSession = req.session;
    if (adminSession.adminId) {
        const errors = validationResult(req);
        console.log(errors)
        const error1 = errors.errors.find(item => item.param === 'coupon') || '';
        const error2 = errors.errors.find(item => item.param === 'reduction') || '';
        const error3 = errors.errors.find(item => item.param === 'minOrder') || '';
        if (!errors.isEmpty()) {
            res.render('admin/addNewCoupon', { title: 'Shop.admin', couponMsg: error1.msg, reductionMsg: error2.msg, minOrderMsg: error3.msg, admin: true });
        } else {
            const coupon = new Coupon({
                coupon: req.body.coupon,
                reduction: req.body.reduction,
                minOrder: req.body.minOrder,
                expiry: req.body.expiry
            })
            coupon.save()
                .then((result) => {
                    // console.log(result)
                    res.redirect('/admin/adminCouponManagement')
                })
                .catch((err) => {
                    console.log(err)
                })
        }
    } else {
        res.redirect('/admin');
    }
}

const adminEditCouponGet = async function (req, res) {
    adminSession = req.session;
    if (adminSession.adminId) {
        console.log(req.params)
        const result = await Coupon.findOne({ _id: req.params.id })
        console.log(result)
        res.render('admin/adminEditCoupon', { title: 'Shop.admin', result, admin: true })
    } else {
        res.redirect('/admin');
    }
}

const adminEditCouponPost = async function (req, res) {
    adminSession = req.session;
    if (adminSession.adminId) {
        if (req.body.newName) {
            await Coupon.updateOne({ _id: req.params.id }, { $set: { coupon: req.body.newName } })
        }
        if (req.body.newReduction) {
            await Coupon.updateOne({ _id: req.params.id }, { $set: { reduction: req.body.newReduction } })
        }
        if (req.body.newMinOrder) {
            await Coupon.updateOne({ _id: req.params.id }, { $set: { minOrder: req.body.newMinOrder } })
        }
        if (req.body.newExpiry) {
            await Coupon.updateOne({ _id: req.params.id }, { $set: { expiry: req.body.newExpiry } })
        }
        res.redirect('/admin/adminCouponManagement')
    } else {
        res.redirect('/admin');
    }
}

const adminDeleteCoupon = async function (req, res) {
    adminSession = req.session;
    if (adminSession.adminId) {
        await Coupon.deleteOne({ _id: req.params.id })
        res.redirect('/admin/adminCouponManagement')
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
    adminSession.categoryProductExist = false
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
    adminOrderManagementGet,
    adminAllOrderManagementGet,
    adminOrderCancel,
    adminLogout,
    adminDashboard,
    adminAllOrderUpdate,
    adminDatatableOrderManagementGet,
    adminCategoryOfferUpdate,
    adminCouponManagement,
    addNewCouponGet,
    addNewCouponPost,
    adminEditCouponGet,
    adminEditCouponPost,
    adminDeleteCoupon
}