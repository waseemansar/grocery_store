const express = require('express');
const router = express.Router();
const csv = require('csvtojson');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const upload = multer({ dest: './public/uploads/' });
const path = require('path');

const Product = require('../models/Product');
const Review = require('../models/Review');
const { removeFile } = require('../util/helpers');
const auth = require('../middleware/auth');

// @route    Post products
// @desc     Upload products from file: csv
// @access   Private: Admin
router.post(
	'/',
	[
		auth,
		upload.single('productsfile'),
		[
			check('productsfile', 'Products file should of type csv').custom((value, { req }) => {
				if (req.file) {
					const extension = req.file && path.extname(req.file.originalname).toLowerCase();
					switch (extension) {
						case '.csv':
							return true;
						default:
							return false;
					}
				} else {
					throw new Error('Products file is required');
				}
			}),
		],
	],
	async (req, res) => {
		if (req.user.role !== 'admin') return res.status(401).json({ errors: [{ msg: 'Not allowed to perform this operation' }] });

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			req.file && removeFile(req.file.path);
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const newProducts = await csv({
				colParser: {
					price: 'number',
					barcode: 'number',
				},
				checkType: true,
			}).fromFile(req.file.path);
			removeFile(req.file.path);

			await Product.insertMany(newProducts);
			res.json({ msg: 'Products added successfully' });
		} catch (err) {
			req.file && removeFile(req.file.path);
			console.error(`Server Error -- ${err.message}`);
			if (err.code) return res.status(500).json({ errors: [{ msg: 'Duplicate products not allowed' }] });
			res.status(500).json({ errors: [{ msg: 'Something went wrong' }] });
		}
	},
);

// @route    POST products/review
// @desc     add review for a products
// @access   Private: Client
router.post(
	'/review',
	[
		auth,
		[
			check('userId', 'user id is required').not().isEmpty(),
			check('barcode', 'Product barcode id is required').not().isEmpty(),
			check('review', 'Review is required').not().isEmpty(),
		],
	],
	async (req, res) => {
		if (req.user.role !== 'client') return res.status(401).json({ errors: [{ msg: 'Not allowed to perform this operation' }] });

		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

		try {
			const review = new Review({ ...req.body });
			await review.save();
			res.json({ msg: 'Review added successfully' });
		} catch (err) {
			console.error(`Server Error -- ${err.message}`);
			res.status(500).json({ errors: [{ msg: 'Something went wrong' }] });
		}
	},
);

// @route    POST products/search
// @desc     search for products
// @access   Private
router.post('/search', auth, async (req, res) => {
	if (req.user.role !== 'client') return res.status(401).json({ errors: [{ msg: 'Not allowed to perform this operation' }] });

	try {
		const { searchText } = req.body;
		const page = req.query.page ? +req.query.page : 0;
		const limit = 10;
		const skipIndex = page ? (page - 1) * limit : 0;

		const regex = new RegExp(searchText, 'i');
		const products = await Product.aggregate([
			{ $match: { name: { $regex: regex } } },
			{
				$unwind: {
					path: '$reviews',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$lookup: {
					from: 'reviews',
					let: { barcode: '$barcode' },
					pipeline: [
						{ $match: { $expr: { $eq: ['$barcode', '$$barcode'] } } },
						{
							$lookup: {
								from: 'users',
								let: { userId: '$userId' },
								pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$userId'] } } }],
								as: 'user',
							},
						},
						{
							$unwind: '$user',
						},
						{
							$addFields: {
								name: '$user.name',
							},
						},
						{ $sort: { createdAt: -1 } },
						{ $limit: 2 },
					],
					as: 'reviews',
				},
			},
			{
				$project: {
					_id: 0,
					name: 1,
					brand: 1,
					barcode: 1,
					price: 1,
					description: 1,
					available: 1,
					reviews: {
						review: 1,
						name: 1,
					},
				},
			},
			{ $skip: skipIndex },
			{ $limit: limit },
		]);
		res.json({
			totalCount: await Product.countDocuments(),
			products: products,
		});
	} catch (err) {
		console.error(`Server Error -- ${err.message}`);
		res.status(500).json({ errors: [{ msg: 'Something went wrong' }] });
	}
});

module.exports = router;
