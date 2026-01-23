import mongoose from "mongoose";

const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    productName: { type: String },
    description: { type: String },
    price: { type: Number },
    stock: { type: Number, min: 0 },
    sales: { type: Number, default: 0 },
    category: { type: String },
    offer: { type: String },
  },
  { timestamps: true },
);

export default mongoose.models.Product || mongoose.model("Product", productSchema);
