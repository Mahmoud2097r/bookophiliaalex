const Category = require('../models/category'),
	{ cloudinary } = require('../cloudinary'),
	{ deleteCoverImage } = require('../middleware');

module.exports = {
	async homePage(req, res, next) {
		let categories = await Category.find({});
		res.render('category/index', {
			categories,
			title: 'Home',
		});
	},

	async postCat(req, res, next) {
		const user = req.user;
		if (user && user.isAdmin) {
			try {
				if (req.file) {
					const { path, filename } = req.file;
					req.body.image = {
						url: path,
						filename,
					};
				}
				let category = await new Category(
					req.body.category
				);
				category.image = req.body.image;
				await category.save();
				req.flash('success', 'Category added');
				res.redirect('/categories');
			} catch (e) {
				deleteCoverImage(req);
				req.flash('error', 'somthing went wrong');
				console.log(e);
				res.redirect('/categories');
			}
		} else {
			req.flash(
				'error',
				'You are not authorized to do this!!!'
			);
			res.redirect('/categories');
		}
	},

	async showCat(req, res, next) {
		let category = await Category.findById(
			req.params.id
		).populate({
			path: 'books',
			options: { sort: { _id: -1 } },
		});
		res.render('category/showCat', {
			category,
			title: category.name,
		});
	},

	async updateCat(req, res, next) {
		const user = req.user;
		if (user && user.isAdmin) {
			try {
				let category = await Category.findById(
					req.params.id
				);
				const { name } = req.body.category;
				if (name) category.name = name;

				if (req.file) {
					await cloudinary.uploader.destroy(
						category.image.filename
					);
					const { path, filename } = req.file;
					category.image = {
						url: path,
						filename,
					};
				}
				await category.save();
				res.redirect(`/categories/${category.id}`);
			} catch (e) {
				req.flash('error', 'Somthing went wrong!');
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
	async deleteCat(req, res, next) {
		const user = req.user;
		if (user && user.isAdmin) {
			const category = await Category.findById(
				req.params.id
			).populate({
				path: 'books',
				model: 'Book',
				populate: {
					path: 'reviews',
					model: 'Review',
				},
			});
			await cloudinary.uploader.destroy(
				category.image.filename
			);

			for (const book of category.books) {
				await cloudinary.uploader.destroy(
					book.image.public_id
				);
				for (const review of book.reviews) {
					await review.deleteOne();
				}
			}

			await category.deleteOne();
			req.flash('success', 'Category Deleted');
			res.redirect('/categories');
		} else {
			req.flash(
				'error',
				'You are not authorized to do this!!!'
			);
			res.redirect(`/categories/${category.id}`);
		}
	},
};
