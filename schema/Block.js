var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/db');

var Schema = mongoose.Schema;

var block_schema = new Schema(
	{
		user: {
			type: Number,
			required: true
		},
		other: {
			type: Number,
			required: true
		}
});

module.exports = mongoose.model('Block', block_schema);
