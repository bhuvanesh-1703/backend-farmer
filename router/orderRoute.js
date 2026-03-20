const express=require('express');
const route=express.Router()
const orderController=require('../controller/orderController')

route.get('/',orderController.getOrders)
route.post('/',orderController.placeOrder)
route.put('/:id',orderController.updateOrder)
route.delete('/:id',orderController.deleteOrder)

module.exports=route