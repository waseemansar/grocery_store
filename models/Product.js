const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		barcode: {
			type: Number,
			required: true,
			unique: true,
		},
		brand: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		price: {
			type: Number,
			required: true,
		},
		available: {
			type: Boolean,
			required: true,
		},
	},
	{
		timestamps: true,
	},
);

module.exports = Product = mongoose.model('Product', ProductSchema);
