import mongoose from "mongoose";

const Schema = mongoose.Schema;

const couponSchema = new Schema({
  offerName: { type: String },
  minOrder: { type: Number },
  discount: { type: Number },
  maxDiscount: { type: Number },
  expiryDate: { type: Date },
});

// Note: Exporting as CouponSchema to arguably allow usage as a sub-schema if needed, 
// though the original exported a model 'Coupon' which conflicts with couponModel.js if both are used as models.
// Assuming this might be intended as a schema or a different model. 
// Given the name couponSchema.js, it might be a subdocument schema.
// However, the original code did `mongoose.model('Coupon', couponSchema)`.
// I will keep it as a model export to match original behavior, but be aware of potential overwrite if both are loaded.
// Just in case, I will export the schema as default if it's meant to be a schema, 
// OR I will trust the original code's intent. 
// The original code exported a MODEL named 'Coupon'. 
// couponModel.js ALSO exported a MODEL named 'Coupon'.
// This is a bug in the original code if both are used.
// I will use mongoose.models.Coupon || ... to prevent error, but logical ambiguity remains.

export default mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
