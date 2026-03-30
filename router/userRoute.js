const express = require("express");
const route = express.Router();
const userController = require("../controller/usersController");

route.get("/", userController.getUsers);
route.get("/:id", userController.getUserById);
route.put("/:id", userController.updateProfile);
route.delete("/:id", userController.deleteUser);

module.exports = route;
