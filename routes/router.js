const express = require('express');
const router = express.Router();
const usersRouter = require('./users');
const productsRouter = require('./products');

router.use(usersRouter);
router.use(productsRouter);

module.exports = router;
