const express = require("express");
const router = express.Router();
const path = require("path");
const { db, checkDatabaseConnection } = require("../../database/database");

router.use((req, res, next) => {
    if (!req.cookies.username) {
        return res.redirect("auth/login"); // ถ้าไม่มีคุกกี้ username ให้เด้งไปหน้า login
    }
    next();
});

// เส้นทางสำหรับหน้าแก้ไขการนัดหมาย
router.get('/', (req, res) => {

    const username = req.cookies.username;
    const role = req.cookies.role;
    
    if (!username) {
        return res.status(401).send("Unauthorized");
    }
    
    let sql;
    let params = [];

    if (role === "customer") {
        sql = `
            SELECT 
                appointment.id,
                state.status AS appointment_status,
                state.id AS state_id,
                services.name AS service_name,
                appointment.date,
                employees.fname || ' ' || employees.sname AS provider_name
            FROM appointment
            JOIN customers ON appointment.customer_id = customers.id
            JOIN state ON appointment.state_id = state.id
            JOIN employees ON appointment.service_id = services.id
            JOIN services ON appointment.service_id = services.id
            JOIN users ON customers.id = users.id
            ORDER BY appointment.date DESC;
        `;
    };

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error("Error fetching appointment:", err.message);
            return res.status(500).send("Database error");
        }
        res.render("edit/edit_appointment", { appointment: rows, username });
    });
});

module.exports = router;
