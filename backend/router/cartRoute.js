const express = require('express');
const route = express.Router();
const cartController = require('../controller/cartController');

route.post('/', cartController.createCart);
route.get('/', cartController.getCart);
route.put('/:id', cartController.updateCart);
route.delete('/:id', cartController.deleteCart);

module.exports = route;