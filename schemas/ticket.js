const { Schema, model } = require("mongoose");

const ticketSchema = new Schema({
  _id: Schema.Types.ObjectId,
  ticketNumber: { type: Number, required: true, unique: true },
  channelId: { type: String, required: true },
  userId: { type: String, required: true },
  type: String,
  members: Array,
  staff: Array,
  messages: Array,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  closedAt: {
    type: Date,
    default: null,
  },
  closedBy: {
    type: String,
    default: null,
  },
  closedReason: {
    type: String,
    default: null,
  },
});

module.exports = new model("Ticket", ticketSchema, "tickets");
