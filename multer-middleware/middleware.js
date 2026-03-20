const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowType = /jpeg|jpg|png|webp/;

  const extname = allowType.test(path.extname(file.originalname).toLowerCase());

  const mimetype = allowType.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else cb(new Error("file type only jpg ,jpeg,png"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

module.exports = upload;
