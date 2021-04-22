const express = require('express'),
	router = express.Router({ mergeParams: true }),
	{
		asyncErrHandler,
		isReviewAuthor,
		isLoggedin,
		validateReview,
	} = require('../middleware'),
	{
		reviewCreate,
		reviewUpdate,
		reviewDestroy,
	} = require('../controllers/reviews');

router.post(
	'/',
	asyncErrHandler(isLoggedin),
	asyncErrHandler(isReviewAuthor),
	validateReview,
	asyncErrHandler(reviewCreate)
);

router
	.route('/:review_id')
	.put(
		asyncErrHandler(isLoggedin),
		asyncErrHandler(isReviewAuthor),
		validateReview,
		asyncErrHandler(reviewUpdate)
	)
	.delete(
		asyncErrHandler(isLoggedin),
		asyncErrHandler(isReviewAuthor),
		asyncErrHandler(reviewDestroy)
	);

module.exports = router;
