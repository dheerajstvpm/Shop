const mongoose = require("mongoose")

const Schema = mongoose.Schema;


const saleSchema = new Schema({
    sale: { type: String },
    productId: { type: String },
}, { timestamps: true })


module.exports =mongoose.model('Sale', saleSchema)