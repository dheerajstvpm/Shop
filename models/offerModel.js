const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const offerSchema=new Schema({
    offerName:{type:String},
    minOrder:{type:Number},
    discount:{type:Number},
    maxDiscount:{type:Number}
})


module.exports =mongoose.model('Offer', offerSchema)