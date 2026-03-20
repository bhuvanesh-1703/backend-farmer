const express = require("express");
const route = express.Router();
const vendorController = require("../controller/vendorController");
const upload = require("../multer-middleware/middleware");

route.post("/register", upload.single("idProof"), vendorController.register);
route.post("/login", vendorController.login);
route.get("/", vendorController.getAllVendors);
route.get("/:id", vendorController.getVendorById);
route.put("/profile/:id", vendorController.updateVendorProfile);
route.put("/status/:id", vendorController.updateVendorStatus);

module.exports = route;
