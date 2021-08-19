const path = require('path');
const fs = require('fs');

module.exports.formatErrors = (data) => {
	let formatedErrors = {};

	data.forEach((err) => (formatedErrors[err.path] = err.errors));

	return formatedErrors;
};

module.exports.removeFile = (filePath) => {
	filePath = path.join(__dirname, '..', filePath);
	fs.unlink(filePath, (err) => console.group(err));
};
