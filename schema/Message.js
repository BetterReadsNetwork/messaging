var mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/db");

var Schema = mongoose.Schema;

var message_schema = new Schema({
  from_uuid: {
    type: Number,
    required: true
  },
  to_uuid: {
    type: Number,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  ts: {
    type: Date,
    required: true
  }
});

module.exports = mongoose.model("Message", message_schema);
