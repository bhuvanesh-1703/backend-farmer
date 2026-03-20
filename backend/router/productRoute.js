const express = require('express')
const route = express.Router();
const productController = require('../controller/productController')
const upload = require('../multer-middleware/middleware')

route.get("/",productController.getProduct)
route.get("/:id", productController.getProductById)
route.post("/",upload.array("image",5), productController.addProduct)
route.put("/:id/status", productController.updateProductStatus)
route.put("/:id",upload.array("image",5), productController.updateProduct)
route.delete("/:id", productController.deleteProduct)

module.exports=route