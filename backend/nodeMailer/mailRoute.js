const express = require('express')
const router = express.Router()
const { orderSuccessMail } = require('./mailSender')

router.post("/order-success", orderSuccessMail)

module.exports = router
