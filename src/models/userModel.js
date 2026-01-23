import mongoose from "mongoose";

const Schema = mongoose.Schema;

const cartSchema = new Schema(
  {
    productName: { type: String },
    description: { type: String },
    price: { type: Number },
    stock: { type: Number },
    image: { type: String },
    croppedImage: { type: String },
    category: { type: String },
    offer: { type: String },
    count: { type: Number },
  },
  { timestamps: true },
);

const wishlistSchema = new Schema(
  {
    productName: { type: String },
    description: { type: String },
    price: { type: Number },
    stock: { type: Number },
    image: { type: String },
    croppedImage: { type: String },
    category: { type: String },
    offer: { type: String },
  },
  { timestamps: true },
);

const orderSchema = new Schema(
  {
    productName: { type: String },
    description: { type: String },
    price: { type: Number },
    stock: { type: Number },
    image: { type: String },
    croppedImage: { type: String },
    category: { type: String },
    offer: { type: String },
    count: { type: Number },
    paymentOption: { type: String },
    address: { type: String },
    unique: { type: String },
    userId: { type: String },
    priceAfterOffer: { type: Number },
    updateBtn: { type: Boolean, default: true },
    returnBtn: { type: Boolean, default: false },
    cancelBtn: { type: Boolean, default: true },
    orderStatus: { type: String, default: "Order is under process" },
  },
  { timestamps: true },
);

const userSchema = new Schema(
  {
    name: { type: String },
    username: { type: String },
    password: { type: String },
    mobile: { type: String },
    address: {
      type: [],
      default: [],
    },
    status: { type: String, default: "" },
    wishlist: {
      type: [wishlistSchema],
      default: [],
    },
    cart: {
      type: [cartSchema],
      default: [],
    },
    order: {
      type: [orderSchema],
      default: [],
    },
  },
  { timestamps: true },
);

export default mongoose.models.User || mongoose.model("User", userSchema);
