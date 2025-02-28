const express = require("express");
const router = express.Router();
const path = require("path");
const sqlite3 = require('sqlite3').verbose();

// เส้นทางสำหรับหน้าแก้ไขการนัดหมาย
router.get('/EditAppt', (req, res) => {
    res.render('edit/edit_appointment');
});

// เส้นทางสำหรับหน้าแก้ไขโปรไฟล์
router.get('/EditAcct', (req, res) => {
    res.render('edit/edit_profile');
});

module.exports = router;
