const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const offerSchema=new Schema({
    offer:{type:String},
    minimum:{type:String},
    discount:{type:String},
    maxDiscount:{type:String}
})


module.exports =mongoose.model('Offer', offerSchema)