import mongoose from "mongoose";

const Schema = mongoose.Schema;

// Product import removed as it was unused in the original file.
// import Product from "./productModel.js";

const productSchema = new Schema(
  {
    productName: { type: String },
    description: { type: String },
    price: { type: String },
    stock: { type: String },
    image: { type: String },
    croppedImage: { type: String },
    category: { type: String },
    offer: { type: String },
  },
  { timestamps: true },
);

const homepageSchema = new Schema({
  firstRow1: {
    type: productSchema,
    default: {},
  },
  firstRow2: {
    type: productSchema,
    default: {},
  },
  firstRow3: {
    type: productSchema,
    default: {},
  },
  firstRow4: {
    type: productSchema,
    default: {},
  },
  banner1: {
    type: productSchema,
    default: {},
  },
  banner2: {
    type: productSchema,
    default: {},
  },
  banner3: {
    type: productSchema,
    default: {},
  },
  lastRow1: {
    type: productSchema,
    default: {},
  },
  lastRow2: {
    type: productSchema,
    default: {},
  },
  lastRow3: {
    type: productSchema,
    default: {},
  },
  lastRow4: {
    type: productSchema,
    default: {},
  },
  // Ensure we can add more fields without error if schema evolves
}, { strict: false });

export default mongoose.models.Homepage || mongoose.model("Homepage", homepageSchema);
