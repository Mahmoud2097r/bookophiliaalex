const mongoose = require('mongoose'),
	passportLocalMongoose = require('passport-local-mongoose'),
	Schema = mongoose.Schema;

const UserSchema = new Schema({
	email              : {
		type     : String,
		uniqe    : true,
		required : true
	},
	resetPasswordToken : String,
	Expires            : Date,
	isVerified         : {
		type    : Boolean,
		default : false
	},
	randSixDiget       : Number,
	isAdmin            : {
		type    : Boolean,
		default : false
	},
	activity           : [
		{
			type : Schema.Types.ObjectId,
			ref  : 'Activity'
		}
	],
	phonNumber         : String
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
