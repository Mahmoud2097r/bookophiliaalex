const cloudinary = require('cloudinary').v2;
const { CLOUD_NAME, API_KEY, CLOUDINARY_SECRET } = process.env;
const {
	CloudinaryStorage,
} = require('multer-storage-cloudinary');
cloudinary.config({
	cloud_name: CLOUD_NAME,
	api_key: API_KEY,
	api_secret: CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: 'Bookophilia',
		allowedFormats: ['jpeg', 'jpg', 'png'],
	},
});

module.exports = {
	cloudinary,
	storage,
};
