const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
const userRoute = require("./router/userRoute");
const productRoute=require("./router/productRoute")
const categoryRoute=require("./router/categoryRoute")
const orderRoute=require("./router/orderRoute")
const authRouter=require("./router/authRouter")
const vendorRouter=require("./router/vendorRoute")
const cartRouter=require("./router/cartRoute")
const messageRouter=require("./router/messageRoute")
const mailRouter=require("./nodeMailer/mailRoute")
const adminRouter=require("./router/adminRoute")
const notificationRouter=require("./router/notificationRoute")

dotenv.config();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server Created Successfully");
});
app.use("/uploads",express.static("uploads"))

app.use("/api/users", userRoute);
app.use("/api/product",productRoute)
app.use("/api/categories",categoryRoute)
app.use("/api/orders",orderRoute)
app.use("/api/auth",authRouter)
app.use("/api/vendor",vendorRouter)
app.use("/api/cart",cartRouter)
app.use("/api/messages",messageRouter)
app.use("/api/mail",mailRouter)
app.use("/api/admin",adminRouter)
app.use("/api/notifications",notificationRouter)

const PORT = process.env.PORT || 5100;

app.listen(PORT, () => {
  // console.log(`Server running on port ${PORT}`);
});
