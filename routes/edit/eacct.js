const express = require("express");
const router = express.Router();
const path = require("path");
const { db, checkDatabaseConnection } = require("../../database/database");

// Middleware เช็คว่า login แล้วหรือยัง
router.use((req, res, next) => {
    if (!req.cookies.username) {
        return res.redirect("auth/login"); // ถ้าไม่มีคุกกี้ username ให้เด้งไปหน้า login
    }
    next();
});

// เส้นทางสำหรับหน้าแก้ไขโปรไฟล์
router.get('/', async (req, res) => {
    const username = req.cookies.username;

    try {
        await checkDatabaseConnection();

        const query = `
            SELECT 
                users.username, 
                customers.fname, 
                customers.sname
            FROM 
                users 
            LEFT JOIN 
                customers ON users.id = customers.id
            WHERE 
                users.username = ?;
        `;

        db.get(query, [username], (err, user) => {
            if (err || !user) {
                return res.status(500).send("ไม่พบข้อมูลผู้ใช้");
            }

            res.render('edit/edit_profile', {
                username: user.username,
                fname: user.fname,
                sname: user.sname
            });
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล");
    }
});

module.exports = router;
