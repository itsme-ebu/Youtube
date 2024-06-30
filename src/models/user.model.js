import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  subscribedChannels: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  subscriptions: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
  ],
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
});

const User = mongoose.model("User", userSchema);
export default User;
