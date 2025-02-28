const express = require("express");
const router = express.Router();
const path = require("path");
const sqlite3 = require('sqlite3').verbose();
const { db, checkDatabaseConnection } = require("../../database/database");

// เส้นทางสำหรับหน้าแก้ไขโปรไฟล์
router.get('/', (req, res) => {
    res.render('edit/edit_profile');
});

module.exports = router;