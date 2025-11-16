const { Schema, model } = require("mongoose");

const roleplaySchema = new Schema({
  _id: Schema.Types.ObjectId,
  hosts: { type: Array, required: true },
  participants: {
    ontime: { type: Array, required: false },
    late: [{
      userId: { type: String, required: true },
      time: { type: String, required: false },
    }],
    absent: { type: Array, required: false },
    clockedIn: { type: Array, required: false, default: [] },
    attendance: { cops: { type: Array, required: false, default: [] }, civilians: { type: Array, required: false, default: [] }, safr: { type: Array, required: false, default: [] } },
  },
  timestamp: {
    type: Number,
    required: true,
  },
  messageId: {
    type: String,
    required: false,
  },
  location: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["scheduled", "ongoing", "completed", "canceled"],
    default: "scheduled",
  },
});

module.exports = new model("Roleplay", roleplaySchema, "roleplays");
