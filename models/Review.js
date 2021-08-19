const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		barcode: {
			type: Number,
			required: true,
		},
		review: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
	},
);

module.exports = Review = mongoose.model('Review', ReviewSchema);
