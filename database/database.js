const sqlite3 = require('sqlite3').verbose();

// เชื่อมต่อกับฐานข้อมูล (หรือสร้างใหม่ถ้ายังไม่มี)
const db = new sqlite3.Database('./database/database.db', (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// ฟังก์ชันสำหรับตรวจสอบการเชื่อมต่อ
const checkDatabaseConnection = () => {
  return new Promise((resolve, reject) => {
    db.get("SELECT 1", (err) => {
      if (err) {
        reject(new Error('Database connection failed: ' + err.message));
      } else {
        resolve('Database connection is successful.');
      }
    });
  });
};

// สร้างตาราง users หากยังไม่มี
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT
    )
  `);
  db.run('PRAGMA journal_mode=WAL;', (err) => {
    if (err) {
      console.error('Error enabling WAL mode:', err);
    } else {
      console.log('WAL mode enabled');
    }
  });
});

module.exports = { db, checkDatabaseConnection };