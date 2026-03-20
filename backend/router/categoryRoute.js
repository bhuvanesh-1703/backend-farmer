const express = require('express');
const route= express.Router()
const categoryController=require('../controller/categoryController')
const upload = require('../multer-middleware/middleware')


route.get('/', categoryController.getCategory)

route.get("/:id", categoryController.getProductsByCategory);
route.post('/', upload.single('image'), categoryController.addCategory)
route.put('/:id', upload.single('image'), categoryController.updateCategory)
route.delete('/:id', categoryController.deleteCategory)

module.exports = route
