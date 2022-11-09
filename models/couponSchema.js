const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const couponSchema=new Schema({
    offerName:{type:String},
    minOrder:{type:Number},
    discount:{type:Number},
    maxDiscount:{type:Number},
    expiryDate:{type:Date}
})


module.exports =mongoose.model('Coupon', couponSchema)