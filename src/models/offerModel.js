import mongoose from "mongoose";

const Schema = mongoose.Schema;

const offerSchema = new Schema({
  offerName: { type: String },
  discount: { type: Number },
});

export default mongoose.models.Offer || mongoose.model("Offer", offerSchema);
