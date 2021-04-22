const mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	Review = require('./review'),
	mongoosePaginate = require('mongoose-paginate');

const ImageSchema = new Schema({
	secure_url: String,
	public_id: String,
});

// Set image width
ImageSchema.virtual('thumbnail').get(function () {
	return this.secure_url.replace('/upload', '/upload/w_300');
});

const BookSchema = new Schema({
	author: {
		type: String,
		required: true,
	},

	title: {
		type: String,
		required: true,
	},

	image: ImageSchema,

	description: String,

	price: {
		type: String,
		defualt: 5,
	},

	copies: {
		type: String,
		defualt: 1,
	},

	activities: [
		{
			title: String,
			type: Schema.Types.ObjectId,
			ref: 'Activity',
		},
	],
	reviews: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Review',
		},
	],

	Expires: Date,

	pdf: { type: String, required: false },

	audioBook: String,

	label: String,
});

BookSchema.pre(
	'deleteOne',
	{ document: true, query: false },
	async function () {
		await Review.deleteMany({
			_id: {
				$in: this.reviews,
			},
		});
	}
);

BookSchema.methods.calculateAvgRating = function () {
	let ratingsTotal = 0;
	if (this.reviews.length) {
		this.reviews.forEach((review) => {
			ratingsTotal += review.rating;
		});
		this.avgRating =
			Math.round(
				(ratingsTotal / this.reviews.length) * 10
			) / 10;
	} else {
		this.avgRating = ratingsTotal;
	}
	const floorRating = Math.floor(this.avgRating);
	this.save();
	return floorRating;
};

BookSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Book', BookSchema);
