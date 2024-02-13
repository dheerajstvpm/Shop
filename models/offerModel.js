const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const offerSchema = new Schema({
  offerName: { type: String },
  discount: { type: Number },
});

module.exports = mongoose.model("Offer", offerSchema);
