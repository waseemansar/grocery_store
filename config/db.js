const mongoose = require('mongoose');

const db = process.env.MONGO_URI;

const connectDB = async () => {
	try {
		let options = {
			useNewUrlParser: true,
			useUnifiedTopology: false,
			useCreateIndex: true,
			useFindAndModify: false,
		};
		if (process.env.NODE_ENV === 'development') options.useUnifiedTopology = true;

		await mongoose.connect(db, options);
		console.log('MongoDB connected...');
	} catch (err) {
		console.error(`MongoDB Error -- ${err.message}`);
		// Exit process with failure
		process.exit(1);
	}
};

module.exports = connectDB;
