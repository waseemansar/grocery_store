const http = require('http');
const fs = require('fs');
const express = require('express');
const path = require('path');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
require('dotenv').config();

const connectDB = require('./config/db');

const port = process.env.PORT;
const app = express();

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'Grocery Application API',
			version: '1.0.0',
			description: 'An simple NodeJS/ Express API for Grocery Application',
		},
		servers: [
			{
				url: `http://localhost:${port}`,
			},
		],
	},
	apis: ['./routes/*.js'],
};

const specs = swaggerJsDoc(options);

// Connect Database
connectDB();

// Init Middlewares
app.use(express.json({ extended: false, limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(cors());

app.use('/public', express.static(path.join(__dirname, 'public')));

// Define Routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use('/users', require('./routes/users'));
app.use('/products', require('./routes/products'));
app.get('/', (req, res) => {
	res.send('Welcome to Grocery Store');
});

// Create and Run HTTP Server
http.createServer(app)
	.listen(port, () => console.log(`Server is running on port ${port}`))
	.on('error', (e) => console.log(e));
