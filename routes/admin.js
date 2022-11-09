const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');

const adminController = require('../controllers/adminController');

const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const Homepage = require('../models/homepageModel')
const Offer = require('../models/offerModel')
const Product = require('../models/productModel')
const Order = require('../models/orderModel')
const Admin = require('../models/adminModel')

const { check, validationResult } = require('express-validator');

let adminSession;

router.get('/', adminController.adminHome)

router.get('/adminLogin', adminController.adminLoginGet)

router.post('/adminLogin', adminController.adminLoginPost);

router.get('/addNewAdmin', adminController.addNewAdminGet)

router.post('/addNewAdmin', check('username').notEmpty()
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
        .withMessage("Password must contain at least one special character"), adminController.addNewAdminPost);

router.get('/adminProductManagement',adminController.adminProductManagement);

router.post('/adminProductSearch', adminController.adminProductSearch);

router.get('/addNewProduct', adminController.addNewProductGet);

router.post('/addNewProduct',
    check('productName').notEmpty().withMessage('Please enter a Name'),
    check('description').notEmpty().withMessage('Please enter a description'),
    check('price').notEmpty().withMessage('Please enter price of the product'),
    check('stock').notEmpty().withMessage('Please enter number of items'),
    check('category').notEmpty().withMessage('Please enter category'),
    adminController.addNewProductPost);

router.get('/editProduct/:id', adminController.editProductGet);

router.post('/editProduct/:id', adminController.editProductPost)

router.get('/deleteProduct/:id', adminController.deleteProduct);

router.get('/adminUserManagement', adminController.adminUserManagement);

router.post('/adminUserSearch', adminController.adminUserSearch);

router.get('/block/:id', adminController.blockUser);

router.get('/unblock/:id', adminController.unblockUser);

router.get('/adminCategoryManagement', adminController.adminCategoryManagement);

router.post('/adminCategorySearch', adminController.adminCategorySearch);

router.get('/addNewCategory', adminController.addNewCategoryGet);

router.post('/addNewCategory',
    check('category').notEmpty().withMessage('Please enter a category'),
    adminController.addNewCategoryPost);

router.get('/deleteCategory/:id', adminController.deleteCategory);

router.get('/adminOfferManagement', adminController.adminOfferManagement);

router.post('/adminOfferSearch', adminController.adminOfferSearch);

router.get('/addNewOffer', adminController.addNewOfferGet);

router.post('/addNewOffer',
    check('offer').notEmpty().withMessage('Please enter an offer'),
    check('minOrder').notEmpty().withMessage('Please enter a minimum order'),
    check('discount').notEmpty().withMessage('Please enter a discount'),
    check('maxDiscount').notEmpty().withMessage('Please enter a maximum discount'),
    adminController.addNewOfferPost);

router.get('/editOffer/:id', adminController.editOfferGet);

router.post('/editOffer/:id', adminController.editOfferPost)

router.get('/deleteOffer/:id', adminController.deleteOffer);

router.get('/userHomepageLayout', adminController.userHomepageLayoutGet);

router.post('/userHomepageLayout', adminController.userHomepageLayoutPost);

router.get('/orderManagement/:id', adminController.adminOrderManagementGet);

router.get('/allOrderManagement/:page', adminController.adminAllOrderManagementGet);

router.get('/datatableOrderManagement', adminController.adminDatatableOrderManagementGet);

router.get('/adminOrderCancel/:id', adminController.adminOrderCancel);

router.get('/adminDashboard/', adminController.adminDashboard);

router.post('/adminAllOrderUpdate/:unique', adminController.adminAllOrderUpdate);

router.post('/adminCategoryOfferUpdate/:category', adminController.adminCategoryOfferUpdate);

router.post('/adminLogout', adminController.adminLogout);


module.exports = router;