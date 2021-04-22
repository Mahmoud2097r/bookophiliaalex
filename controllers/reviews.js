const Book = require('../models/book'),
	Review = require('../models/review');

module.exports = {
	async reviewCreate(req, res, next) {
		let book = await Book.findById(req.params.id);

		let haveReviewed = book.reviews.filter((review) => {
			return review.author.equals(req.user._id);
		}).length;

		if (haveReviewed) {
			req.flash(
				'error',
				'You already reviewed on this book, Thanks'
			);
			return res.redirect(`/books/${book.id}`);
		}

		const review = new Review(req.body.review);
		review.author = req.user.id;
		book.reviews.push(review);
		await review.save();
		await book.save();
		req.flash('success', 'Thanks for your review');
		res.redirect(`/books/${book.id}`);
	},

	async reviewUpdate(req, res, next) {
		await Review.findByIdAndUpdate(
			req.params.review_id,
			req.body.review
		);
		res.redirect(`/books/${req.params.id}`);
	},

	async reviewDestroy(req, res, next) {
		await Book.findByIdAndUpdate(req.params.id, {
			$pull: { reviews: req.params.review_id },
		});
		await Review.findByIdAndDelete(req.params.review_id);
		res.redirect(`/books/${req.params.id}`);
	},
};
