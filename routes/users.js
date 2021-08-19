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

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Login a user and get jwt token in response
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjExZTM5ODMyNzQwNTE2YjVlMWM2ZmRiIiwicm9sZSI6ImNsaWVudCJ9LCJpYXQiOjE2MjkzOTA3MjMsImV4cCI6MTYzMjk5MDcyM30.MvkOETRhfWUNl7iFM1UTJW_4vaa3X-ztx-kSoQShiHU
 *                 expiresIn:
 *                   type: number
 *                   example: 3600000
 *       400:
 *         description: Some validation errors if email and password is not provided
 *       500:
 *         description: Some server error
 */
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

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               gender:
 *                 type: string
 *                 description: M or F
 *               phonenumber:
 *                 type: number
 *               role:
 *                 type: string
 *                 description: admin or client
 *     responses:
 *       200:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: 611e88a518a1007722efe893
 *                 name:
 *                   type: string
 *                   example: Waseem Ansar
 *                 email:
 *                   type: number
 *                   example: example@test.com
 *                 gender:
 *                   type: string
 *                   example: M
 *                 phonenumber:
 *                   type: number
 *                   example: 971501234567
 *                 role:
 *                   type: string
 *                   example: client
 *                 createdAt:
 *                   type: string
 *                   example: 2021-08-19T16:41:38.308Z
 *       400:
 *         description: Some validation errors if email and password is not provided
 *       500:
 *         description: Some server error
 */
router.post(
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

			res.json(await User.findById(user.id).select('-password -updatedAt -__v'));
		} catch (err) {
			console.error(`Server Error -- ${err.message}`);
			res.status(500).json({ errors: [{ msg: 'Something went wrong' }] });
		}
	},
);

module.exports = router;
