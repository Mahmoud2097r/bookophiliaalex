const express = require('express'),
	router = express.Router(),
	multer = require('multer'),
	{ storage } = require('../cloudinary'),
	upload = multer({ storage }),
	{ asyncErrHandler, validateCat } = require('../middleware'),
	{
		homePage,
		postCat,
		showCat,
		updateCat,
		deleteCat,
	} = require('../controllers/categories');

router
	.route('/')
	.get(asyncErrHandler(homePage))
	.post(
		upload.single('image'),
		validateCat,
		asyncErrHandler(postCat)
	);

router
	.route('/:id')
	.get(asyncErrHandler(showCat))
	.put(
		upload.single('image'),
		validateCat,
		asyncErrHandler(updateCat)
	)
	.delete(asyncErrHandler(deleteCat));

module.exports = router;
