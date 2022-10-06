const mongoose = require("mongoose")

const Schema = mongoose.Schema;


const orderSchema = new Schema({
    username: { type: String },
    productId: { type: String },
    deliveryStatus: { type: String }
}, { timestamps: true })


module.exports =mongoose.model('Order', orderSchema)