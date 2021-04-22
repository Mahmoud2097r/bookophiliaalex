const mongoose = require('mongoose'),
	{ Schema } = mongoose;

const ReviewSchema = new Schema({
	body: String,
	rating: Number,
	author: {
		type: Schema.Types.ObjectId,
		ref: 'User',
	},
});

module.exports = mongoose.model('Review', ReviewSchema);
