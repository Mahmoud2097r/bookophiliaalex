const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ActivitySchema = new Schema({
	title    : String,
	bookDate : {
		type    : Date,
		default : Date.now()
	},
	book     : {
		type : Schema.Types.ObjectId,
		ref  : 'Book'
	}
});

module.exports = mongoose.model('Activity', ActivitySchema);
