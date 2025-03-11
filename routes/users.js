const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/Inspira");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String },
  profilePic: { type: String, default: "/images/default.png" },
  contact: { type: Number },
  boards: [{ type: mongoose.Schema.Types.ObjectId, ref: "board" }], // Reference to board collection
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }], // Followers list
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }], // Following list
  resetPasswordToken: { type: String }, // New field
  resetPasswordExpires: { type: Date }, // New field
});

// Use passport-local-mongoose for authentication
userSchema.plugin(plm);

module.exports = mongoose.model("user", userSchema);
