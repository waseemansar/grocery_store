const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const auth = require('../middleware/auth');

// @route    GET users
// @desc     Get all users
// @access   Private: Admin
router.get('/', auth, async (req, res) => {
	if (req.user.role !== 'admin') return res.status(401).json({ errors: [{ msg: 'Not allowed to perform this operation' }] });

	try {
		const users = await User.find().select('-__v -password -updatedAt');
		res.json(users);
	} catch (err) {
		console.error(`Server Error -- ${err.message}`);
		res.status(500).json({ errors: [{ msg: 'Something went wrong' }] });
	}
});

// @route    POST users/login
// @desc     Login a user
// @access   Public
router.post(
	'/login',
	[check('email', 'Email is required').isEmail(), check('password', 'Password is required').not().isEmpty()],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

		try {
			let { email, password } = req.body;

			const user = await User.findOne({ email });
			if (!user) return res.status(400).json({ errors: [{ msg: 'Invalid email or password' }] });

			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) return res.status(400).json({ errors: [{ msg: 'Invalid email or password' }] });

			const payload = { user: { id: user.id, role: user.role } };
			const expiresIn = +process.env.tokenExpiry;

			// Create and send JWT token in response
			jwt.sign(payload, process.env.jwtSecret, { expiresIn: expiresIn }, (err, token) => {
				if (err) throw err;
				res.json({ token, expiresIn });
			});
		} catch (err) {
			console.error(`Server Error -- ${err.message}`);
			res.status(500).json({ errors: [{ msg: 'Something went wrong' }] });
		}
	},
);

// @route    POST users/register
// @desc     Register a user
// @access   Public
router.get(
	'/register',
	[
		check('name', 'Name is required').not().isEmpty(),
		check('email', 'Please enter a valid email').isEmail(),
		check('password', 'Password is required').not().isEmpty(),
		check('gender', 'Gender can only be: M or F').isIn(['M', 'F']),
		check('phonenumber', 'Phone number cannot have characters').matches(/^\d+$/),
		check('role', 'Role can only be: admin or client').isIn(['admin', 'client']),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

		try {
			let { name, email, password, gender, phonenumber, role } = req.body;

			let user = await User.findOne({ email });
			if (user) return res.status(400).json({ errors: [{ msg: 'User already exists' }] });

			const salt = await bcrypt.genSalt(10);
			password = await bcrypt.hash(password, salt);
			phonenumber = +phonenumber;

			user = new User({ name, email, password, gender, phonenumber, role });
			await user.save();

			res.send(user);
		} catch (err) {
			console.error(`Server Error -- ${err.message}`);
			res.status(500).json({ errors: [{ msg: 'Something went wrong' }] });
		}
	},
);

module.exports = router;
