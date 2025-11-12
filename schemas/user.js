const { Schema, model } = require("mongoose");
const userSchema = new Schema({
  _id: Schema.Types.ObjectId,
  token: { type: String, required: true, unique: true },
  discordToken: {
    type: Array,
  },
  discordID: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  lastRP: {
    type: Number,
  },
  clan: {
    type: String,
  },
});

module.exports = new model("User", userSchema, "user");
