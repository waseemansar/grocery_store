const jwt = require('jsonwebtoken');

const User = require('../models/User');

module.exports = async (req, res, next) => {
	// Get token from header
	const token = req.header('x-auth-token');

	// Check if no token
	if (!token) return res.status(401).json({ errors: [{ msg: 'No token, authorization denied' }] });

	// Verify token
	try {
		const decoded = jwt.verify(token, process.env.jwtSecret);

		// Check if user exists with presented token
		const user = await User.findById(decoded.user.id);
		if (!user) return res.status(401).json({ errors: [{ msg: 'Token is not valid' }] });

		req.user = decoded.user;
		next();
	} catch (err) {
		console.error(`Server Error -- ${err.message}`);
		res.status(401).json({ errors: [{ msg: 'Token is not valid' }] });
	}
};
