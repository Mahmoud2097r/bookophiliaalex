const Book = require('../models/book'),
	Category = require('../models/category'),
	User = require('../models/user'),
	Activity = require('../models/activity'),
	{ cloudinary } = require('../cloudinary'),
	{ MAILGUN_APIKEY, DOMAIN, EMAIL } = process.env,
	mailgun = require('mailgun-js')({
		apiKey: MAILGUN_APIKEY,
		domain: DOMAIN,
	});

module.exports = {
	async bookIndex(req, res, next) {
		const { dbQuery } = res.locals;
		delete res.locals.dbQuery;
		let books = await Book.paginate(dbQuery, {
			page: req.query.page || 1,
			limit: 36,
			sort: '-_id',
		});
		books.page = Number(books.page);
		res.render('books/index', {
			books,
			title: 'Books Exhibition',
		});
	},

	async bookCreate(req, res, next) {
		const user = req.user;
		if (user && user.isAdmin) {
			try {
				const category = await Category.findById(
					req.params.id
				)
					.populate('books')
					.exec();
				if (req.file) {
					const { path, filename } = req.file;
					req.body.image = {
						secure_url: path,
						public_id: filename,
					};
				}
				let book = await new Book(req.body.book);
				book.image = req.body.image;
				book.Expires = Date.now() + 864000000;
				await book.save();
				category.books.push(book);
				await category.save();
				res.redirect(`/categories/${category.id}`);
			} catch (e) {
				await cloudinary.uploader.destroy(
					req.body.image.public_id
				);
				res.redirect(`/categories/${category.id}`);
			}
		} else {
			req.flash(
				'error',
				'You are not authorized to do this!!!'
			);
			res.redirect(`/categories/${category.id}`);
		}
	},

	async newBooks(req, res, next) {
		const books = await Book.find({
			Expires: { $gt: Date.now() },
		})
			.sort('-_id')
			.exec();

		res.render('books/newBooks', {
			books,
			title: 'New Books',
		});
	},

	async showBook(req, res, next) {
		try {
			const book = await Book.findById(
				req.params.id
			).populate({
				path: 'reviews',
				options: { sort: { _id: -1 } },
				populate: {
					path: 'author',
					model: 'User',
				},
			});

			let haveReviewed;
			if (req.user) {
				haveReviewed = book.reviews.filter((review) =>
					review.author.equals(req.user.id)
				).length;
			}

			const floorRating = book.calculateAvgRating();
			res.render('books/show', {
				book,
				floorRating,
				title: book.title,
				haveReviewed,
			});
		} catch (e) {
			console.log(e);
			req.flash(
				'error',
				'The page you tring to get does not exist'
			);
			res.redirect('back');
		}
	},

	async bookUpdate(req, res, next) {
		const user = await User.findById(req.user._id);
		const book = await Book.findById(req.params.id);
		if (user && user.isAdmin) {
			const {
				title,
				author,
				copies,
				price,
				description,
				pdf,
				audioBook,
			} = req.body.book;
			if (title) book.title = title;
			if (author) book.author = author;
			if (copies) book.copies = copies;
			if (price) book.price = price;
			if (description) book.description = description;
			if (pdf) book.pdf = pdf;
			if (audioBook) book.audioBook = audioBook;
			if (req.file) {
				if (book.image.filename)
					await cloudinary.uploader.destroy(
						book.image.public_id
					);
				const { path, filename } = req.file;
				book.image = {
					secure_url: path,
					public_id: filename,
				};
			}
			await book.save();
			res.redirect(`/books/${req.params.id}`);
		} else if (user) {
			const data = {
				to: EMAIL,
				from: req.user.email,
				subject: 'Request - Book A Book Request',
				text: `Hey Bookophlilia Admin, I'm (${user.username}) want to book (${book.title}) this is my phone number (${user.phonNumber}), this is my email ${user.email}, and I work/study at ${req.body.workOrCollege}, Thanks.`,
				html: `<strong>Hey Bookophlilia Admin, I'm (${user.username}) want to book (${book.title}) this is my phone number (${user.phonNumber}), this is my email ${user.email}, and I work/study at ${req.body.workOrCollege}, Thanks.<strong>`,
			};

			try {
				if (book.copies > 0) {
					mailgun.messages().send(data);
					book.copies--;
					await book.save();
					let activity = await Activity.create({
						title: book.title,
					});
					user.activity.push(activity);
					await user.save();
					req.flash(
						'success',
						`We've got your request for this book and we will contact you soon, thanks ${user.username}`
					);
				} else {
					req.flash(
						'error',
						`Sorry We ran out of this book (${book.title}), see our other books until we have more copies of this one, thanks`
					);
				}
			} catch (e) {
				console.log(e);
				if (e.response) {
					console.log(e.response.body);
				}
				req.flash('error', 'Somthing went wrong');
			}

			res.redirect(`/books/${req.params.id}`);
		} else {
			req.flash(
				'error',
				'You are not authorized to do this!!!'
			);
			res.redirect(`/books/${req.params.id}`);
		}
	},

	async bookDestroy(req, res, next) {
		const user = req.user;
		if (user && user.isAdmin) {
			const book = await Book.findById(req.params.id);
			await cloudinary.uploader.destroy(
				book.image.public_id
			);
			await book.deleteOne();
			res.redirect('/categories');
		} else {
			req.flash(
				'error',
				'You are not authorized to do this!!!'
			);
			res.redirect(`/books/${req.params.id}`);
		}
	},
};
