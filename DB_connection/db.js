const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10
});

db.getConnection()
  .then((conn) => {
    console.log("DB Connected Successfully");
    conn.release();
  })
  .catch((err) => {
    console.log("DB Connection Failed");
    console.error(err);
  });

module.exports = db;