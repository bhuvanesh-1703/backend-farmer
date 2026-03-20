const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "farmer_db",
  port: process.env.DB_PORT || 3306,
});

db.getConnection()
  .then((conn) => {
    // console.log(" DB Connected Successfully");
    conn.release();
  })
  .catch((err) => {
    // console.log(" DB Connection Failed");
    console.error(err.message);
  });


module.exports = db;
