const User = require('../models/user'),
	util = require('util'),
	crypto = require('crypto'),
	randomize = require('randomatic'),
	{ MAILGUN_APIKEY, DOMAIN, EMAIL } = process.env,
	mailgun = require('mailgun-js')({
		apiKey: MAILGUN_APIKEY,
		domain: DOMAIN,
	});

module.exports = {
	landingPage(req, res, next) {
		res.render('landing', { title: 'Bookophilia' });
	},

	async postRgister(req, res, next) {
		const newUser = req.body;
		const user = await User.register(
			new User(newUser),
			req.body.password
		);
		req.login(user, (err) => {
			if (err) return next(err);
			req.flash('success', `Welcome in our site`);
			res.redirect('/update-info');
		});
		try {
			const newUser = req.body;
			const user = await User.register(
				new User(newUser),
				req.body.password
			);
			req.login(user, (err) => {
				if (err) return next(err);
				req.flash('success', `Welcome in our site`);
				res.redirect('/update-info');
			});
		} catch (e) {
			req.flash('error', e.message);
			res.redirect('/back');
		}
	},

	async postLogin(req, res, next) {
		const { username, password } = req.body;
		const { user, error } = await User.authenticate()(
			username,
			password
		);
		if (!user && error) {
			req.flash('error', error.message);
			return next(error);
		}
		req.login(user, (err) => {
			if (err) return next(err);
			const redirectUrl =
				req.session.returnTo || '/categories';
			delete req.session.returnTo;
			req.flash(
				'success',
				`Welcome back, ${user.username}`
			);
			res.redirect(redirectUrl);
		});
	},

	getLogout(req, res, next) {
		req.logout();
		const redirectUrl =
			req.session.returnTo || '/categories';
		delete req.session.returnTo;
		req.flash('success', `You've been logged out`);
		res.redirect(redirectUrl);
	},

	async getInfo(req, res, next) {
		let user = await User.findById(req.user._id).populate({
			path: 'activity',
			options: { sort: { _id: -1 } },
		});
		res.render('info', { user, title: 'Profile' });
	},
	async putInfo(req, res, next) {
		const { email, phonNumber } = req.body;
		const { user } = res.locals;
		if (email) {
			user.email = email;
			user.isVerified = false;
		}
		if (phonNumber) user.phonNumber = phonNumber;
		await user.save();
		const login = util.promisify(req.login.bind(req));
		await login(user);
		req.flash('success', 'Profile successfully updated!');
		res.redirect('/update-info');
	},

	getForgotPw(req, res, next) {
		res.render('users/forgot', {
			title: 'Forget Password Form',
		});
	},

	async putForgotPw(req, res, next) {
		const token = await crypto
			.randomBytes(20)
			.toString('hex');

		const user = await User.findOne({
			email: req.body.email,
		});
		if (!user) {
			req.flash(
				'error',
				'No account with that email address exists.'
			);
			return res.redirect('/forgot-password');
		}

		user.resetPasswordToken = token;
		user.Expires = Date.now() + 3600000; // 1 hour

		await user.save();

		const data = {
			to: user.email,
			from: `Bookophilia <${EMAIL}>`,
			subject: 'Bookophlilia - Forgot Password / Reset',
			text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.
				Please click on the following link, or copy and paste it into your browser to complete the process:
				http://${req.headers.host}/reset/${token}
				If you did not request this, please ignore this email and your password will remain unchanged.`.replace(
				/				/g,
				''
			),
			html: `<strong>You are receiving this because you (or someone else) have requested the reset of the password for your account.<br>
				Please click on the following link, or copy and paste it into your browser to complete the process:<br>
				http://${req.headers.host}/reset/${token}<br>
				If you did not request this, please ignore this email and your password will remain unchanged.<strong>`,
		};

		try {
			mailgun.messages().send(data);
		} catch (e) {
			console.log(e);
			if (e.response) {
				console.log(e.response.body);
			}
			req.flash('error', 'Somthing went wrong');
		}
		req.flash(
			'success',
			`Hey ${user.username}, Check your email`
		);
		res.redirect('/forgot-password');
	},

	async getReset(req, res, next) {
		const { token } = req.params;
		const user = await User.findOne({
			resetPasswordToken: token,
			Expires: { $gt: Date.now() },
		});
		if (!user) {
			req.flash(
				'error',
				'Password reset token is invalid or has expired.'
			);
			return res.redirect('/forgot-password', {
				title: 'Reset Password Form',
			});
		}
		res.render('users/reset', {
			token,
			title: 'Reset Password',
		});
	},

	async putReset(req, res, next) {
		const { token } = req.params;
		const user = await User.findOne({
			resetPasswordToken: token,
			Expires: { $gt: Date.now() },
		});

		if (!user) {
			req.flash(
				'error',
				'Password reset token is invalid or has expired.'
			);
			return res.redirect(`/reset/${token}`);
		}

		if (req.body.password === req.body.confirm) {
			await user.setPassword(req.body.password);
			user.resetPasswordToken = null;
			user.Expires = null;
			await user.save();
			const login = util.promisify(req.login.bind(req));
			await login(user);
		} else {
			req.flash('error', 'Passwords do not match.');
			return res.redirect(`/reset/${token}`);
		}

		const data = {
			to: user.email,
			from: `Bookophilia <${EMAIL}>`,
			subject: 'Bookophlilia - Password Changed',
			text: `Hello,
  	  	This email is to confirm that the password for your account has just been changed.
  	  	If you did not make this change, please hit reply and notify us at once.`.replace(
				/		  	/g,
				''
			),
			html: `<strong>Hello,<br>
  	  	This email is to confirm that the password for your account has just been changed.<br>
  	  	If you did not make this change, please hit reply and notify us at once.<strong>`,
		};

		try {
			mailgun.messages().send(data, (error, body) => {
				req.flash(
					'success',
					'Password successfully updated!'
				);
			});
		} catch (e) {
			console.log(e);
			if (e.response) {
				console.log(e.response.body);
			}
			req.flash('error', 'Somthing went wrong');
		}
		res.redirect('/categories');
	},

	async putRandDigets(req, res, next) {
		const randDiget = parseInt(randomize('0', 6));

		const { currentUser } = res.locals;

		const user = await User.findOne({
			email: currentUser.email,
		});

		user.randSixDiget = randDiget;
		user.Expires = Date.now() + 3600000; // 1 hour

		await user.save();

		let data = {
			to: user.email,
			from: `Bookophilia <${EMAIL}>`,
			subject: 'Bookophlilia - Verify Email',
			text: `You are receiving this because you (or someone else) have requested to verify your email adress, enter this ---${randDiget}--- to confirm your email adress.`,
		};

		try {
			mailgun.messages().send(data, (error, body) => {
				req.flash(
					'success',
					`Hey ${user.username}, Check your email`
				);
			});
		} catch (e) {
			console.log(e);
			if (e.response) {
				console.log(e.response.body);
			}
			req.flash('error', 'Somthing went wrong');
		}

		res.redirect('/verify-email');
	},

	getVerifyEmail(req, res, next) {
		res.render('users/verify-email', {
			title: 'Verify Email',
		});
	},

	async putVerifyEmail(req, res, next) {
		const { currentUser } = res.locals;
		const user = await User.findOne({
			randSixDiget: currentUser.randSixDiget,
			Expires: { $gt: Date.now() },
		});

		if (!user) {
			req.flash(
				'error',
				'The provided number is invalid or has expired.'
			);
			return res.redirect(`/update-info`);
		}

		if (
			req.body.randDigetNumber == currentUser.randSixDiget
		) {
			user.isVerified = true;
			user.randSixDiget = null;
			user.Expires = null;
			await user.save();
			const login = util.promisify(req.login.bind(req));
			await login(user);

			const data = {
				to: user.email,
				from: `Bookophlilia <${EMAIL}>`,
				subject: 'Bookophlilia - Email Confirmed',
				text: `Hello ${currentUser.username}, Thanks for joining to our community`,
				html: `<strong>Hello ${currentUser.username}, Thanks for joining to our community<strong>`,
			};

			mailgun.messages().send(data);
			req.flash(
				'success',
				`Yor email ${user.email} has been verified`
			);
			return res.redirect('/categories');
		} else {
			req.flash('error', 'Incorrect Digits');
			return res.redirect('back');
		}
	},
};
