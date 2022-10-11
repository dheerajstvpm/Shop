const mongoose = require("mongoose")

const Schema = mongoose.Schema;


const homepageSchema=new Schema({
    firstRow1:{type:String},
    firstRow1Id:{type:String},
    firstRow2:{type:String},
    firstRow2Id:{type:String},
    firstRow3:{type:String},
    firstRow3Id:{type:String},
    firstRow4:{type:String},
    firstRow4Id:{type:String},
    banner1:{type:String},
    banner1Id:{type:String},
    banner2:{type:String},
    banner2Id:{type:String},
    banner3:{type:String},
    banner3Id:{type:String},
    lastRow1:{type:String},
    lastRow1Id:{type:String},
    lastRow2:{type:String},
    lastRow2Id:{type:String},
    lastRow3:{type:String},
    lastRow3Id:{type:String},
    lastRow4:{type:String},
    lastRow4Id:{type:String}
})





module.exports =mongoose.model('Homepage', homepageSchema)