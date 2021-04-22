const express = require('express'),
	router = express.Router(),
	{
		asyncErrHandler,
		isEmailExists,
		isUsernameExists,
		isLoggedin,
		isValidPassword,
		changePassword,
	} = require('../middleware'),
	{
		landingPage,
		postRgister,
		postLogin,
		getLogout,
		getInfo,
		putInfo,
		getForgotPw,
		putForgotPw,
		getReset,
		putReset,
		putRandDigets,
		getVerifyEmail,
		putVerifyEmail,
	} = require('../controllers');

router
	.route('/')
	.get(landingPage)
	.post(asyncErrHandler(postLogin));

router.get('/about', (req, res, next) => {
	res.render('about', { title: 'About' });
});

router.post(
	'/register',
	asyncErrHandler(isEmailExists),
	asyncErrHandler(isUsernameExists),
	asyncErrHandler(postRgister)
);

router.get('/logout', getLogout);

router
	.route('/update-info')
	.get(asyncErrHandler(isLoggedin), asyncErrHandler(getInfo))
	.put(
		asyncErrHandler(isLoggedin),
		asyncErrHandler(isValidPassword),
		asyncErrHandler(isEmailExists),
		asyncErrHandler(changePassword),
		asyncErrHandler(putInfo)
	);

router
	.route('/forgot-password')
	.get(getForgotPw)
	.put(asyncErrHandler(putForgotPw));

router
	.route('/reset/:token')
	.get(asyncErrHandler(getReset))
	.put(asyncErrHandler(putReset));

router.put(
	'/send-verify-email',
	asyncErrHandler(isLoggedin),
	asyncErrHandler(putRandDigets)
);

router
	.route('/verify-email')
	.get(
		asyncErrHandler(isLoggedin),
		asyncErrHandler(getVerifyEmail)
	)
	.put(
		asyncErrHandler(isLoggedin),
		asyncErrHandler(putVerifyEmail)
	);

module.exports = router;
