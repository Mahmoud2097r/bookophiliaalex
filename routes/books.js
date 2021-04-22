const express = require('express'),
	router = express.Router(),
	multer = require('multer'),
	{ storage } = require('../cloudinary'),
	upload = multer({ storage }),
	{
		asyncErrHandler,
		isLoggedin,
		checkUserForBooking,
		isThisUserVerified,
		searchBooks,
		validateBook,
	} = require('../middleware'),
	{
		bookIndex,
		newBooks,
		bookCreate,
		showBook,
		bookUpdate,
		bookDestroy,
	} = require('../controllers/books');

router
	.route('/books')
	.get(
		asyncErrHandler(searchBooks),
		asyncErrHandler(bookIndex)
	);

router.get('/books/newbooks', asyncErrHandler(newBooks));

router.post(
	'/category/:id/books',
	asyncErrHandler(isLoggedin),
	upload.single('image'),
	validateBook,
	asyncErrHandler(bookCreate)
);

router
	.route('/books/:id')
	.get(asyncErrHandler(showBook))
	.put(
		asyncErrHandler(checkUserForBooking),
		asyncErrHandler(isThisUserVerified),
		upload.single('image'),
		validateBook,
		asyncErrHandler(bookUpdate)
	)
	.delete(asyncErrHandler(bookDestroy));

module.exports = router;
