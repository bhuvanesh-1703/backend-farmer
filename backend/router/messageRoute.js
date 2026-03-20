const express = require("express");
const route = express.Router();
const messageController = require("../controller/messageController");

route.get("/", messageController.getMessages);
route.post("/", messageController.postMessage);
route.post("/reply", messageController.replyToMessage);
route.delete("/:id", messageController.deleteMessage);

module.exports = route;
