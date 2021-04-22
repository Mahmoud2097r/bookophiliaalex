const sanitizeHtml = require('sanitize-html'),
	BaseJoi = require('joi');

const extenison = (joi) => ({
	type: 'string',
	base: joi.string(),
	messages: {
		'string.escapHTML': '{{#label}} must not include HTML!',
	},
	rules: {
		escapHTML: {
			validate(value, helpers) {
				const clean = sanitizeHtml(value, {
					allowedTags: [],
					allowedAttributes: {},
				});
				if (clean !== value)
					return helpers.errir('string.escapHTML', {
						value,
					});
				return clean;
			},
		},
	},
});

const Joi = BaseJoi.extend(extenison);

module.exports.catSchema = Joi.object({
	category: Joi.object({
		name: Joi.string().required().escapHTML(),
	}).required(),
});

module.exports.bookSchema = Joi.object({
	book: Joi.object({
		title: Joi.string().required().escapHTML(),
		author: Joi.string().required().escapHTML(),
		description: Joi.string().required().escapHTML(),
		price: Joi.number().required().min(0),
		copies: Joi.number().required().min(0),
		pdf: Joi.string().escapHTML(),
		label: Joi.string().escapHTML(),
		audioBook: Joi.string().escapHTML(),
	}),
	image: Joi.string(),
});

module.exports.reivewSchema = Joi.object({
	review: Joi.object({
		body: Joi.string().required().escapHTML(),
		rating: Joi.number().required().min(1).max(5),
	}).required(),
});

module.exports.eventSchema = Joi.object({
	event: Joi.object({
		eventTitle: Joi.string().required().escapHTML(),
		description: Joi.string().required().escapHTML(),
		eventLink: Joi.string().required().escapHTML(),
		eventDate: Joi.string().required(),
	}),
	image: Joi.string(),
});
