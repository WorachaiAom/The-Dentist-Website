const express = require("express");
const router = express.Router();
const { db } = require("../../database/database");

router.get("/", (req, res) => {
    const username = req.cookies.username;
    const role = req.cookies.role;
    
    if (!username) {
        return res.status(401).send("Unauthorized");
    }

    let sql;
    let params = [];

    if (role === "customer") {
        // Customers can only see their own appointments
        sql = `
            SELECT 
                appointment.id,
                customers.fname || ' ' || customers.sname AS customer_name,
                state.status AS appointment_status,
                employees.fname || ' ' || employees.sname AS provider_name,
                services.name AS service_name,
                appointment.date,
                appointment.info
            FROM appointment
            JOIN customers ON appointment.customer_id = customers.id
            JOIN state ON appointment.state_id = state.id
            JOIN employees ON appointment.employee_id = employees.id
            JOIN services ON appointment.service_id = services.id
            JOIN users ON customers.id = users.id
            WHERE state.status = 'สำเร็จแล้ว' AND users.username = ?
            ORDER BY appointment.date DESC;
        `;
        params = [username];
    } else {
        // Employees can see all appointments
        sql = `
            SELECT 
                appointment.id,
                customers.fname || ' ' || customers.sname AS customer_name,
                state.status AS appointment_status,
                employees.fname || ' ' || employees.sname AS provider_name,
                services.name AS service_name,
                appointment.date,
                appointment.info
            FROM appointment
            JOIN customers ON appointment.customer_id = customers.id
            JOIN state ON appointment.state_id = state.id
            JOIN employees ON appointment.employee_id = employees.id
            JOIN services ON appointment.service_id = services.id
            WHERE state.status = 'สำเร็จแล้ว'
            ORDER BY appointment.date DESC;
        `;
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error("Error fetching appointment history:", err.message);
            return res.status(500).send("Database error");
        }
        res.render("histo/history", { appointments: rows, username, role });
    });
});

// API สำหรับอัปเดตรายละเอียดเพิ่มเติม
router.post("/update-info", (req, res) => {
    const { appointmentId, info } = req.body;
    const role = req.cookies.role;

    if (role !== "doctor") {
        return res.status(403).send("Unauthorized");
    }

    const sql = "UPDATE appointment SET info = ? WHERE id = ?";
    db.run(sql, [info, appointmentId], (err) => {
        if (err) {
            console.error("Error updating appointment info:", err.message);
            return res.status(500).send("Database error");
        }
        res.send("Update successful");
    });
});

module.exports = router;
