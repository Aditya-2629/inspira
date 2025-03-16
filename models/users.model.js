require("dotenv").config();
const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/Inspira";
mongoose
  .connect(mongoURI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String },
  profilePic: { type: String, default: "/images/default.png" },
  contact: { type: Number },
  boards: [{ type: mongoose.Schema.Types.ObjectId, ref: "board" }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

userSchema.plugin(plm);

module.exports = mongoose.model("user", userSchema);
