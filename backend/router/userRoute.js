const express = require("express");
const route = express.Router();
const userController = require("../controller/usersController");

route.get("/", userController.getUsers);
route.post("/", userController.postUsers);
route.put("/:id", userController.updateUsers);
route.delete("/:id", userController.deleteUsers);

module.exports = route;
