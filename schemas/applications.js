const { Schema, model } = require("mongoose");
const application = new Schema({
    _id: Schema.Types.ObjectId,
    user: String,
    messages: Array,
    channelId: {type: String, required: true},
    status: String,
    tries: {
        type: Number,
        default: 0,
    },
});

module.exports = new model("Applications", application, "applications");