# Grocery Store API

As this api server is build in Node Js Express framework with mongoldb using mongoose.

### Steps to Run

1. Clone this repository

> git clone https://github.com/waseemansar/grocery_store.git

2. Navigate into the directory grocery_store

> cd your-path-to/grocery_store

3. Run this command to install dependencies

> npm install

4. Rename .env.example file to .env and add your own MONGO_URI

5. Run local server with following command

> npm start

Local server will run on
https://localhost:30005

### API Endpoints

Users Registration
https://localhost:30005/users/register

Users Login
https://localhost:30005/users/login

Products Bulk Upload from CSV file
https://localhost:30005/products

Products Review
https://localhost:30005/products/review

Products Search
https://localhost:30005/products/search?page=1
