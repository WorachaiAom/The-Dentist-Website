const express = require('express');
const router = express.Router();
const { db } = require('../database/database');

// แสดงหน้า Homepage
router.get('/', (req, res) => {
    const cardService = 'SELECT id, name, description FROM services';
    const username = req.cookies.username; // ตรวจสอบว่ามี cookie หรือไม่

        db.all(cardService, [], (err, rows) => {
            if (err) {
                console.error('Error fetching services:', err.message);
                return res.status(500).send('Error fetching services');
            }
    
            // เลือก navigation ตามสถานะการเข้าสู่ระบบ
            const navTemplate = username ? 'nav_login' : 'nav';
                res.render('homepage', { data: rows, username, navTemplate });
            });
        });

// จัดการการเข้าสู่ระบบ
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
    }

    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';

    db.get(query, [username, password], (err, user) => {
        if (err) {
            console.error('Error querying database:', err.message);
            return res.status(500).send('เกิดข้อผิดพลาดในระบบ');
        }

        if (!user) {
            return res.status(401).send('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }

        // ตั้งค่า Cookie เพื่อบันทึกการเข้าสู่ระบบ
        res.cookie('username', username, { httpOnly: true });

        // เปลี่ยนเส้นทางไปยังหน้า Homepage
        res.redirect('/');
    });
});

router.get('/aboutus', (req, res) => {
    const username = req.cookies.username;
    res.render('aboutus', {username});
});

router.get('/notifications', (req, res) => {
  const username = req.cookies.username;
  
  db.all(`
    SELECT 
                appointment.id,
                customers.fname || ' ' || customers.sname AS customer_name,
                state.status AS appointment_status,
                employees.fname || ' ' || employees.sname AS provider_name,
                services.name AS service_name,
                appointment.date
            FROM appointment
            JOIN customers ON appointment.customer_id = customers.id
            JOIN state ON appointment.state_id = state.id
            JOIN employees ON appointment.employee_id = employees.id
            JOIN services ON appointment.service_id = services.id
            WHERE state.status = 'ยืนยันแล้ว'
			AND customer_id = (SELECT id FROM users WHERE username = ?)
			AND datetime(appointment.date) BETWEEN datetime('now', 'localtime') AND datetime('now', 'localtime', '+2 hours');
  `, [username], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database Error' });
    res.json(rows);
  });
});

module.exports = router;
