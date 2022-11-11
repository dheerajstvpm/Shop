const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const couponSchema = new Schema({
    coupon: { type: String },
    reduction: { type: Number },
    minOrder: { type: Number },
    expiry: { type: Date },
    users:{
        type: [],
        default: []
    }
})


module.exports = mongoose.model('Coupon', couponSchema)