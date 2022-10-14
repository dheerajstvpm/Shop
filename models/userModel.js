const mongoose = require("mongoose")

const Schema = mongoose.Schema;


const Product = require('../models/productModel')

const productSchema = new Schema({
    productName: { type: String },
    description: { type: String },
    price: { type: String },
    stock: { type: String },
    image: { type: String },
    croppedImage: { type: String },
    category: { type: String },
    offer: { type: String }
}, { timestamps: true })

const userSchema = new Schema({
    name: { type: String },
    username: { type: String },
    mobile: { type: String },
    address: {
        type: [],
        default: undefined
    },
    status: { type: String },
    wishlist: {
        type: productSchema,
        default: {}
    },
    cart: {
        type: productSchema,
        default: {}
    },
    order: {
        type: productSchema,
        default: {}
    },
    password: { type: String }
}, { timestamps: true })



module.exports = mongoose.model('User', userSchema)



// User schema
// User ID: _id
// Name: string
// Username: string
// Mobile number: number
// Password: string
// User status: string
// Address: string

// Wishlist Product ID: _id(from Product schema)

// Cart Product ID: _id(from Product schema)

// Order Schema
// Username: string(from User schema)
// Product ID: _id(from Product schema)
// Order status: string

// Product Schema
// Product ID: _id
// Name: string
// Description: string
// Price: string
// Image: image
// Cropped image: image
// Stock: string
// Category: string(from Category schema)
// Offer: string(from Offers schema)

// Offers Schema
// Offer ID: _id
// Offer name: string
// Minimum amount to qualify for discount: number
// Discount percent: number
// Maximum discount: number


// Category schema
// Category ID: _id
// Category name: string

// Homepage schema
// FirstRow1: _id(from Product schema)
// FirstRow2: _id(from Product schema)
// FirstRow3: _id(from Product schema)
// FirstRow4: _id(from Product schema)
// Banner1: _id(from Product schema)
// Banner2: _id(from Product schema)
// Banner3: _id(from Product schema)
// LastRow1: _id(from Product schema)
// LastRow2: _id(from Product schema)
// LastRow3: _id(from Product schema)
// LastRow4: _id(from Product schema)
