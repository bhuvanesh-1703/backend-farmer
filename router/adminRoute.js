const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");

router.post("/login", adminController.adminLogin);
router.get("/stats", adminController.getDashboardStats);
router.put("/vendor-status/:id", adminController.updateVendorStatus);
router.put("/product-status/:id", adminController.updateProductStatus);

module.exports = router;
