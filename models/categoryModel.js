const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const categorySchema=new Schema({
    categoryName:{type:String}
})


module.exports =mongoose.model('Category', categorySchema)