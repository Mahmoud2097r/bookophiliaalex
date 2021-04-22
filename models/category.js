const mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	Book = require('./book');

const ImageSchema = new Schema({
	url: String,
	filename: String,
});

//  Set image width
ImageSchema.virtual('thumbnail').get(function () {
	return this.url.replace('/upload', '/upload/w_300');
});

const CategorySchema = new Schema({
	name: String,
	image: ImageSchema,
	books: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Book',
		},
	],
});

CategorySchema.pre(
	'deleteOne',
	{ document: true, query: false },
	async function () {
		await Book.deleteMany({
			_id: {
				$in: this.books,
			},
		});
	}
);

module.exports = mongoose.model('Category', CategorySchema);
