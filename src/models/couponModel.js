import mongoose from "mongoose";

const Schema = mongoose.Schema;

const couponSchema = new Schema({
  coupon: { type: String },
  reduction: { type: Number },
  minOrder: { type: Number },
  expiry: { type: Date },
  users: {
    type: [],
    default: [],
  },
});

export default mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
