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
        return res.redirect("/auth/login");
    }

    let sql;

    try {
        await checkDatabaseConnection();
            sql = `
                SELECT 
                    users.username, 
                    customers.fname AS customer_fname, 
                    customers.sname AS customer_sname,
                    employees.fname AS employee_fname, 
                    employees.sname AS employee_sname,
                    users.email,
                    users.tel
                FROM 
                    users 
                LEFT JOIN 
                    customers ON users.id = customers.id
                LEFT JOIN 
                    employees ON users.id = employees.id
                WHERE 
                    users.username = ?;
            `;
        db.get(sql, [username], (err, user) => {
            if (err || !user) {
                return res.status(500).send("ไม่พบข้อมูลผู้ใช้");
            }

            if (role === "customer") {
                res.render('edit/edit_profile', {
                    ausername: user.username,
                    fname: user.customer_fname,
                    sname: user.customer_sname,
                    email: user.email,
                    tel: user.tel,
                    username
                });
            } else {
                res.render('edit/edit_profile', {
                    ausername: user.username,
                    fname: user.employee_fname,
                    sname: user.employee_sname,
                    email: user.email,
                    tel: user.tel,
                    username
                });
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล");
    }
});

// เส้นทางสำหรับอัปเดตโปรไฟล์
router.post('/update-profile', async (req, res) => {
    const { username, password, fname, sname, email, tel } = req.body;
    const currentUsername = req.cookies.username;
    let usernameChanged = false;

    try {
        db.run("BEGIN TRANSACTION", (err) => {
            if (err){
                console.log(err);
            }
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

        if (email){
            let query = `UPDATE users SET email = ?  WHERE id = (SELECT id FROM users WHERE username = ?)`
            db.run(query, [email, currentUsername], (err) => {
                if (err){
                    console.log(err);
                }
            });
        }

        if (tel){
            let query = `UPDATE users SET tel = ?  WHERE id = (SELECT id FROM users WHERE username = ?)`
            db.run(query, [tel, currentUsername], (err) => {
                if (err){
                    console.log(err);
                }
            });
        }

        if (username !== currentUsername && username != undefined) {
            const updateUsernameSql = `UPDATE users SET username = ? WHERE username = ?;`;
            db.run(updateUsernameSql, [username, currentUsername], (err) => {
                if (err){
                    console.log(err);
                }
            });
            // อัปเดตคุกกี้ใหม่
            res.cookie('username', username, { httpOnly: true });
            usernameChanged = true;
        }

        db.run("COMMIT", (err) => {
            if (err){
                console.log(err);
            }
        });

        res.json({ success: true, refresh: usernameChanged });

    } catch (err) {
        console.error(err);
        db.run("ROLLBACK", () => resolve());
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
        db.run("BEGIN TRANSACTION", (err) => {
            if (err){
                console.log(err);
            }
        });

        // ลบ appointment ที่เกี่ยวข้องกับ customer_id
        const deleteAppointmentsSql = `DELETE FROM appointment WHERE customer_id = (SELECT id FROM users WHERE username = ?);`;
        db.run(deleteAppointmentsSql, [username], (err) => {
            if (err){
                console.log(err);
            }
        });

        // ลบข้อมูลจากตาราง customers
        const deleteCustomerSql = `DELETE FROM customers WHERE id = (SELECT id FROM users WHERE username = ?);`;
        db.run(deleteCustomerSql, [username], (err) => {
            if (err){
                console.log(err);
            }
        });

        // ลบข้อมูลจากตาราง users
        const deleteUserSql = `DELETE FROM users WHERE username = ?;`;
        db.run(deleteUserSql, [username], (err) => {
            if (err){
                console.log(err);
            }
        });

        // เสร็จสิ้นการลบข้อมูลทั้งหมด
        db.run("COMMIT", (err) => {
            if (err){
                console.log(err);
            }
        });

        res.json({ success: true, message: 'บัญชีถูกลบเรียบร้อยแล้ว' });
    } catch (err) {
        console.error(err);
        db.run("ROLLBACK", () => resolve());
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบบัญชี' });
    }
});

module.exports = router;
