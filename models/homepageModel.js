const mongoose = require("mongoose")

const Schema = mongoose.Schema;


const homepageSchema=new Schema({
    firstRow1:{type:String},
    firstRow2:{type:String},
    firstRow3:{type:String},
    firstRow4:{type:String},
    banner1:{type:String},
    banner2:{type:String},
    banner3:{type:String},
    lastRow1:{type:String},
    lastRow2:{type:String},
    lastRow3:{type:String},
    lastRow4:{type:String}
})





module.exports =mongoose.model('Homepage', homepageSchema)