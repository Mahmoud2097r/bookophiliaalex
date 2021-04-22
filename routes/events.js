const express = require('express'),
	router = express.Router(),
	{ storage } = require('../cloudinary'),
	upload = require('multer')({ storage }),
	{
		indexEvents,
		createEvent,
		editEvent,
		deleteEvent
	} = require('../controllers/events'),
	{
		asyncErrHandler,
		validateEvent
	} = require('../middleware');

router
	.route('/')
	.get(asyncErrHandler(indexEvents))
	.post(
		validateEvent,
		upload.single('image'),
		asyncErrHandler(createEvent)
	);

router
	.route('/:id')
	.put(
		validateEvent,
		upload.single('image'),
		asyncErrHandler(editEvent)
	)
	.delete(asyncErrHandler(deleteEvent));

module.exports = router;
