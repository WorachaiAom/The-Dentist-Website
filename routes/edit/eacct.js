const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { db, checkDatabaseConnection } = require("../../database/database");

// Middleware เช็คว่า login แล้วหรือยัง
router.use((req, res, next) => {
    if (!req.cookies.username) {
        return res.redirect("/auth/login"); // ถ้าไม่มีคุกกี้ username ให้เด้งไปหน้า login
    }
    next();
});

// เส้นทางสำหรับหน้าแก้ไขโปรไฟล์
router.get('/', async (req, res) => {
    const username = req.cookies.username;
    const role = req.cookies.role;

    if (!username) {
        return res.status(401).send("Unauthorized");
    }

    let sql;

    try {
        await checkDatabaseConnection();

        if (role === 'customer') {
            sql = `
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
        } else {
            return res.status(403).send("Unauthorized: Invalid Role");
        }

        db.get(sql, [username], (err, user) => {
            if (err || !user) {
                return res.status(500).send("ไม่พบข้อมูลผู้ใช้");
            }

            res.render('edit/edit_profile', {
                ausername: user.username,
                fname: user.fname,
                sname: user.sname,
                username
            });
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล");
    }
});

// เส้นทางสำหรับอัปเดตโปรไฟล์
router.post('/update-profile', async (req, res) => {
    const { username, password, fname, sname } = req.body;
    const currentUsername = req.cookies.username;
    let usernameChanged = false;

    try {
        await new Promise((resolve, reject) => {
            db.run("BEGIN TRANSACTION", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            const updatePasswordSql = `UPDATE users SET password = ? WHERE username = ?;`;
            db.run(updatePasswordSql, [hashedPassword, currentUsername], (err) => {
                if (err){
                    console.log(err);
                }
            });
        }

        if (fname){
            let query = `UPDATE customers SET fname = ?  WHERE id = (SELECT id FROM users WHERE username = ?)`
            db.run(query, [fname, currentUsername], (err) => {
                if (err){
                    console.log(err);
                }
            });
        }
        if (sname){
            let query = `UPDATE customers SET sname = ?  WHERE id = (SELECT id FROM users WHERE username = ?)`
            db.run(query, [sname, currentUsername], (err) => {
                if (err){
                    console.log(err);
                }
            });
        }

        if (username !== currentUsername && username != undefined) {
            const updateUsernameSql = `UPDATE users SET username = ? WHERE username = ?;`;
            await new Promise((resolve, reject) => {
                db.run(updateUsernameSql, [username, currentUsername], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // อัปเดตคุกกี้ใหม่
            res.cookie('username', username, { httpOnly: true });
            usernameChanged = true;
        }

        await new Promise((resolve, reject) => {
            db.run("COMMIT", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        res.json({ success: true, refresh: usernameChanged });

    } catch (err) {
        console.error(err);
        await new Promise((resolve) => db.run("ROLLBACK", () => resolve()));
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
    }
});

// เส้นทางสำหรับลบบัญชีผู้ใช้
router.delete('/delete-account', async (req, res) => {
    const { username } = req.body; // รับชื่อผู้ใช้จากคำขอที่ส่งมา

    if (!username) {
        return res.status(400).json({ success: false, message: 'ไม่พบชื่อผู้ใช้' });
    }

    try {
        // เริ่มต้นการทำงานกับฐานข้อมูล
        await new Promise((resolve, reject) => {
            db.run("BEGIN TRANSACTION", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // ลบ appointment ที่เกี่ยวข้องกับ customer_id
        const deleteAppointmentsSql = `DELETE FROM appointment WHERE customer_id = (SELECT id FROM users WHERE username = ?);`;
        await new Promise((resolve, reject) => {
            db.run(deleteAppointmentsSql, [username], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // ลบข้อมูลจากตาราง customers
        const deleteCustomerSql = `DELETE FROM customers WHERE id = (SELECT id FROM users WHERE username = ?);`;
        await new Promise((resolve, reject) => {
            db.run(deleteCustomerSql, [username], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // ลบข้อมูลจากตาราง users
        const deleteUserSql = `DELETE FROM users WHERE username = ?;`;
        await new Promise((resolve, reject) => {
            db.run(deleteUserSql, [username], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // เสร็จสิ้นการลบข้อมูลทั้งหมด
        await new Promise((resolve, reject) => {
            db.run("COMMIT", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        res.json({ success: true, message: 'บัญชีถูกลบเรียบร้อยแล้ว' });
    } catch (err) {
        console.error(err);
        await new Promise((resolve) => db.run("ROLLBACK", () => resolve()));
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบบัญชี' });
    }
});

module.exports = router;
