const express = require("express");
const router = express.Router();
const path = require("path");
const sqlite3 = require('sqlite3').verbose();
const { db, checkDatabaseConnection } = require("../../database/database");

// เส้นทางสำหรับหน้าแก้ไขการนัดหมาย
router.get('/', (req, res) => {
    const sql = `
        SELECT 
            appointment.id,
            state.status AS appointment_status,
            state.id AS state_id,
            services.name AS service_name,
            appointment.date
        FROM appointment
        JOIN customers ON appointment.customer_id = customers.id
        JOIN state ON appointment.state_id = state.id
        JOIN employees ON appointment.employee_id = employees.id
        JOIN services ON appointment.service_id = services.id
        ORDER BY appointment.date DESC;
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Error fetching appointment history:", err.message);
            return res.status(500).send("Database error");
        }
        res.render("edit/edit_appointment", { appointments: rows });
    });
});

module.exports = router;
