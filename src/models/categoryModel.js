import mongoose from "mongoose";

const Schema = mongoose.Schema;

const categorySchema = new Schema({
  categoryName: { type: String },
});

export default mongoose.models.Category || mongoose.model("Category", categorySchema);
