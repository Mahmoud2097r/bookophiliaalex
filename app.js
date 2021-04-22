if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}
const { MONGODB_URL, PORT, SECRET } = process.env;
const express = require('express'),
	engine = require('ejs-mate'),
	mongoose = require('mongoose'),
	ExpressError = require('./middleware/expresserror'),
	path = require('path'),
	flash = require('connect-flash'),
	passport = require('passport'),
	User = require('./models/user'),
	Book = require('./models/book'),
	helmet = require('helmet'),
	session = require('express-session'),
	MongoStore = require('connect-mongo')(session),
	mongoSanitize = require('express-mongo-sanitize'),
	// seedBooks = require('./seeds'),
	methodOverride = require('method-override'),
	favicon = require('serve-favicon'),
	app = express();

// seedBooks();

// Connecting with dataBase

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
let url = MONGODB_URL;
mongoose
	.connect(url)
	.then(() => {
		console.log('Connected!');
	})
	.catch((e) => {
		console.log(`Error: ${e}`);
	});

// Settings engine and static public folder
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Security SetUp
app.use(mongoSanitize({ replaceWith: '_' }));

const {
	scriptSrcUrls,
	styleSrcUrls,
	connectSrcUrls,
	fontSrcUrls,
} = require('./middleware/helmetSettup');

app.use(
	helmet.contentSecurityPolicy({
		directives: {
			defaultSrc: [],
			connectSrc: ["'self'", ...connectSrcUrls],
			scriptSrc: [
				"'unsafe-inline'",
				"'self'",
				...scriptSrcUrls,
			],
			styleSrc: [
				"'self'",
				"'unsafe-inline'",
				...styleSrcUrls,
			],
			workerSrc: ["'self'", 'blob:'],
			objectSrc: [],
			imgSrc: [
				"'self'",
				'blob:',
				'data:',
				`https://res.cloudinary.com/${process.env.CLOUD_NAME}/`, //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
				'https://images.unsplash.com/',
			],
			fontSrc: ["'self'", ...fontSrcUrls],
		},
	})
);

// Configure Passport cookies and session
const store = new MongoStore({
	url: MONGODB_URL,
	secret: SECRET,
	touchAfter: 24 * 60 * 60,
});
store.on('error', function (e) {
	console.log('SESSION STORE ERROR', e);
});
app.use(
	session({
		store,
		name: 'session',
		secret: SECRET,
		resave: false,
		saveUninitialized: true,
		resave: false,
		saveUninitialized: true,
		cookie: {
			httpOnly: true,
			// secure: true,
			expire: Date.now() + 1000 * 60 * 60 * 24 * 7,
			maxAge: 1000 * 60 * 60 * 24 * 7,
		},
	})
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const indexRoutes = require('./routes'),
	categoryRoutes = require('./routes/categories'),
	bookRoutes = require('./routes/books'),
	reviewsRoutes = require('./routes/reviews'),
	eventsRoutes = require('./routes/events');

// Local variables
app.use(flash());
app.use((req, res, next) => {
	if (
		![
			'/',
			'/forgot-password',
			'/reset/:token',
			'/send-verify-email',
			'/verify-email',
		].includes(req.originalUrl)
	) {
		req.session.redirectTo = req.originalUrl;
	}
	res.locals.currentUser = req.user;
	app.locals.moment = require('moment');
	res.locals.success = req.flash('success') || '';
	res.locals.error = req.flash('error') || '';
	next();
});

app.use('/', indexRoutes);
app.use('/categories', categoryRoutes);
app.use('/', bookRoutes);
app.use('/books/:id/reviews', reviewsRoutes);
app.use('/events', eventsRoutes);

// Handel Errors

app.all('*', (req, res, next) => {
	next(new ExpressError('Page not found', 404));
});

app.use((err, req, res, next) => {
	const { statusCode = 500 } = err;
	if (!err.message)
		err.message = 'Oh No, Something Went Wrong!';
	res.status(statusCode).render('error', {
		err,
		title: `Error: ${statusCode}`,
	});
});

app.listen(PORT, () => console.log('http://localhost:8000'));
