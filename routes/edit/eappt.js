const express = require("express");
const router = express.Router();
const path = require("path");
const { db, checkDatabaseConnection } = require("../../database/database");

router.use((req, res, next) => {
    if (!req.cookies.username) {
        return res.redirect("/auth/login"); // ถ้าไม่มีคุกกี้ username ให้เด้งไปหน้า login
    }
    next();
});

// เส้นทางสำหรับหน้าแก้ไขการนัดหมาย
router.get('/', (req, res) => {
    const username = req.cookies.username;
    const role = req.cookies.role;

    if (!username) {
        return res.redirect("/auth/login");
    }

    let sql;
    console.log(username);
    let params = [username];

    if (role === "customer") {
        sql = `
            SELECT 
                appointment.id,
                state.status AS appointment_status,
                state.id AS state_id,
                services.name AS service_name,
                appointment.date,
                appointment.service_id AS service_id,
                employees.fname || ' ' || employees.sname AS provider_name
            FROM appointment
            JOIN customers ON appointment.customer_id = customers.id
            JOIN state ON appointment.state_id = state.id
            JOIN employees ON appointment.employee_id = employees.id
            JOIN services ON appointment.service_id = services.id
            JOIN users ON customers.id = users.id
            WHERE users.username = ? 
            ORDER BY appointment.date DESC;
        `;
    }else if (role === "doctor") {
        return res.redirect("/appointment");
    } 
    else {
        return res.status(403).send("ปฎิเสธการเข้าถึง");
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error("Error fetching appointment:", err.message);
            return res.status(500).send("Database error");
        }
        res.render("edit/edit_appointment", { appointment: rows, username });
    });
});

// เส้นทางสำหรับการลบการนัดหมาย
router.post('/delete', (req, res) => {
    const { appointmentId } = req.body;  // รับข้อมูลจาก body

    if (!appointmentId) {
        return res.status(400).send("Missing appointment ID");
    }

    // คำสั่ง SQL สำหรับการลบการนัดหมาย
    const sqlDelete = `
        DELETE FROM appointment
        WHERE id = ?;
    `;

    // ทำการลบการนัดหมาย
    db.run(sqlDelete, [appointmentId], function (err) {
        if (err) {
            console.error("Error deleting appointment:", err.message);
            return res.status(500).send("ฐานข้อมูลมีปัญหา");
        }

        if (this.changes === 0) {
            return res.status(404).send("ไม่เจอรายการจองหรือคุณไม่มีสิทธิ์เข้าถึง");
        }

        res.send({ message: "ลบรายการจองสำเร็จ" });
    });
});

module.exports = router;
