const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const productSchema = new Schema({
    productName: { type: String },
    description: { type: String },
    price: { type: Number },
    stock: { type: Number },
    image: { type: String },
    croppedImage: { type: String },
    category: { type: String },
    offer: { type: String }
}, { timestamps: true })


module.exports =mongoose.model('Product', productSchema)