const User = require('../models/user'),
	Review = require('../models/review'),
	{ cloudinary } = require('../cloudinary'),
	{
		bookSchema,
		reivewSchema,
		catSchema,
		eventSchema,
	} = require('./schemas'),
	ExpressError = require('./expresserror');

function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const middleware = {
	asyncErrHandler: (fn) => (req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch((err) => {
			console.log(err.message);
			req.flash('error', err.message);
			next();
		});
	},

	async isReviewAuthor(req, res, next) {
		let review = await Review.findById(req.params.review_id);
		if (review.author.equals(req.user._id)) {
			return next();
		}
		req.flash('error', 'You cannot do that');
		res.redirect('/');
	},

	async isEmailExists(req, res, next) {
		let userExists = await User.findOne({
			email: req.body.email,
		});
		const { user } = res.locals;
		if (userExists) {
			if (user) {
				if (userExists.email === user.email) {
					next();
				} else {
					req.flash(
						'error',
						'A user with the given email is already registered'
					);
					return res.redirect('back');
				}
			} else {
				req.flash(
					'error',
					'A user with the given email is already registered'
				);
				return res.redirect('back');
			}
		}
		next();
	},

	async isUsernameExists(req, res, next) {
		let userExists = await User.findOne({
			username: req.body.username,
		});
		const { user } = res.locals;
		if (userExists) {
			if (user) {
				if (userExists.username === user.username) {
					next();
				} else {
					req.flash(
						'error',
						'A user with the given username is already registered'
					);
					return res.redirect('back');
				}
			} else {
				req.flash(
					'error',
					'A user with the given username is already registered'
				);
				return res.redirect('back');
			}
		}
		next();
	},
	async isLoggedin(req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		} else {
			req.flash('error', 'You need to be logged in first');
			req.session.redirectTo = req.originalUrl;
			res.redirect('/categories');
		}
	},
	async checkUserForBooking(req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		} else {
			req.flash('error', 'You need to be logged in first');
			res.redirect(`/books/${req.params.id}`);
		}
	},
	async isValidPassword(req, res, next) {
		const { user } = await User.authenticate()(
			req.user.username,
			req.body.currentPassword
		);
		if (user) {
			// add user to res.locals
			res.locals.user = user;
			next();
		} else {
			req.flash('error', 'Incorrect current password!');
			return res.redirect('/update-info');
		}
	},
	async changePassword(req, res, next) {
		const { newPassword, passwordConfirmation } = req.body;

		if (newPassword && !passwordConfirmation) {
			req.flash('error', 'Missing password confirmation!');
			return res.redirect('/update-info');
		} else if (newPassword && passwordConfirmation) {
			const { user } = res.locals;
			if (newPassword === passwordConfirmation) {
				await user.setPassword(newPassword);
				next();
			} else {
				req.flash('error', 'New passwords must match!');
				return res.redirect('/update-info');
			}
		} else {
			next();
		}
	},

	async deleteCoverImage(req) {
		if (req.file)
			await cloudinary.uploader.destroy(
				req.file.public_id
			);
	},

	async isThisUserVerified(req, res, next) {
		const user = req.user;
		if (user.isVerified) {
			next();
		} else {
			req.flash(
				'error',
				'You have to verify your email address first'
			);
			req.session.redirectTo = req.originalUrl;
			res.redirect('/update-info');
		}
	},

	async searchBooks(req, res, next) {
		const queryKey = Object.keys(req.query);

		if (queryKey.length) {
			const dbQueries = [];
			let { search } = req.query;

			if (search) {
				search = new RegExp(escapeRegExp(search), 'gi');
				dbQueries.push({
					$or: [
						{ title: search },
						{ author: search },
						{ description: search },
						{ label: search },
					],
				});
			}
			res.locals.dbQuery = dbQueries.length
				? { $and: dbQueries }
				: {};
		}

		res.locals.query = req.query;

		queryKey.splice(queryKey.indexOf('page'), 1);
		const delimiter = queryKey.length ? '&' : '?';
		res.locals.paginateUrl =
			req.originalUrl.replace(/(\?|\&)page=\d+/g, '') +
			`${delimiter}page=`;

		next();
	},

	// Validation
	validateBook(req, res, next) {
		const { error } = bookSchema.validate(req.body);
		if (
			error &&
			error.message !== `"workOrCollege" is not allowed` &&
			error.message !==
				`"book.pdf" is not allowed to be empty`
		) {
			console.log(error.message);
			const msg = error.details
				.map((el) => el.message)
				.join(',');
			throw new ExpressError(msg, 400);
		} else {
			next();
		}
	},

	validateCat(req, res, next) {
		const { error } = catSchema.validate(req.body);
		if (error) {
			const msg = error.details
				.map((el) => el.message)
				.join(',');
			throw new ExpressError(msg, 400);
		} else {
			next();
		}
	},

	validateReview(req, res, next) {
		const { error } = reivewSchema.validate(req.body);
		if (error) {
			const msg = error.details
				.map((el) => el.message)
				.join(',');
			throw new ExpressError(msg, 400);
		} else {
			next();
		}
	},

	validateEvent(req, res, next) {
		const { error } = eventSchema.validate(req.body);
		if (error) {
			const msg = error.details
				.map((el) => el.message)
				.join(',');
			throw new ExpressError(msg, 400);
		} else {
			next();
		}
	},
};

module.exports = middleware;
