const { func, string } = require('joi');

const mongoose = require('mongoose'),
	{ Schema } = mongoose;

const ImageSchema = new Schema({
	url      : String,
	filename : String
});
ImageSchema.virtual('thumbnail').get(function () {
	return this.url.replace('/upload', '/upload/w_350');
});
const EventSchema = new Schema({
	eventTitle  : { type: String, required: true },
	eventDate   : { type: Date, required: true },
	description : { type: String, required: true },
	eventLink   : String,
	eventTime   : String,
	expire      : { type: Boolean, default: false },
	image       : ImageSchema
});

module.exports = mongoose.model('Event', EventSchema);
