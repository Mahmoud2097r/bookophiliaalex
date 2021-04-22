const Event = require('../models/events'),
	moment = require('moment'),
	{ cloudinary } = require('../cloudinary');

module.exports = {
	async indexEvents (req, res, next) {
		const events = await Event.find({});
		for (const event of events) {
			let evDate = moment(event.eventDate);
			evDate.set({
				H : parseInt(event.eventTime),
				m : 00
			});

			if (!moment(Date.now()).isSame(evDate)) {
				event.expire =
					moment(Date.now()).isAfter(evDate) &&
					true;
				await event.save();
			}
		}

		res.render('siteEvents/index', {
			title  : 'Events',
			events
		});
	},

	async createEvent (req, res, next) {
		const user = req.user;
		if (user && user.isAdmin) {
			try {
				if (req.file) {
					const { path, filename } = req.file;
					req.body.image = {
						url      : path,
						filename
					};
				}
				const newEvent = await new Event(
					req.body.event
				);
				newEvent.image = req.body.image;
				await newEvent.save();

				res.redirect('/events');
			} catch (e) {
				await cloudinary.uploader.destroy(
					newEvent.image.filename
				);
				res.redirect('/events');
			}
		} else {
			req.flash(
				'error',
				'Your Not Allowed To Do This Action!!!'
			);
			res.redirect('/events');
		}
	},

	async editEvent (req, res, next) {
		const user = req.user;
		if (user && user.isAdmin) {
			const foundEvent = await Event.findById(
				req.params.id
			);
			foundEvent.eventTitle =
				req.body.event.eventTitle;
			foundEvent.eventLink = req.body.event.eventLink;
			foundEvent.description =
				req.body.event.description;
			foundEvent.eventDate = req.body.event.eventDate;
			foundEvent.eventTime = req.body.event.eventTime;
			if (req.file) {
				await cloudinary.uploader.destroy(
					foundEvent.image.filename
				);
				const { path, filename } = req.file;
				foundEvent.image = { url: path, filename };
			}
			await foundEvent.save();
			res.redirect('/events');
		} else {
			req.flash(
				'error',
				'Your Not Allowed To Do This Action!!!'
			);
			res.redirect('/events');
		}
	},

	async deleteEvent (req, res, next) {
		const user = req.user;
		if (user && user.isAdmin) {
			const foundEvent = await Event.findById(
				req.params.id
			);
			await foundEvent.deleteOne();
			res.redirect('/events');
		} else {
			req.flash(
				'error',
				'Your Not Allowed To Do This Action!!!'
			);
			res.redirect('/events');
		}
	}
};
