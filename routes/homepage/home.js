const express = require('express');
const router = express.Router();
const { db } = require('../../database/database');

// แสดงหน้า Homepage
router.get('/', (req, res) => {
    const cardService = 'SELECT id, name, description, detail, rate FROM services WHERE id != 0';
    const username = req.cookies.username; // ตรวจสอบว่ามี cookie หรือไม่

    db.all(cardService, [], (err, rows) => {
        if (err) {
            console.error('Error fetching services:', err.message);
            return res.status(500).send('Error fetching services');
        }

        // เลือก navigation ตามสถานะการเข้าสู่ระบบ
        const navTemplate = username ? '../nav_login' : '../nav';

        res.render('homepage/homepage', { data: rows, username, navTemplate });
    });
});

//แสดงหน้า "ข้อมูลเพิ่มเติม/เกี่ยวกับเรา"
router.get('/aboutus', (req, res) => {
    const username = req.cookies.username; // ตรวจสอบว่ามี cookie หรือไม่
    const navTemplate = username ? '../nav_login' : '../nav'; // เลือก navigation ตามสถานะการเข้าสู่ระบบ
    res.render('homepage/aboutus', { username, navTemplate });

});

//แสดง popup card
router.get('/cardpopup/:id', (req, res) => {
    const serviceId = req.params.id;
    const query = 'SELECT * FROM services WHERE id = ?';

    db.get(query, [serviceId], (err, service) => {
        if (err) {
            console.error('Error fetching service details:', err.message);
            return res.status(500).send('Error fetching service details');
        }

        if (!service) {
            return res.status(404).send('Service not found');
        }

        // ถ้าคุณต้องการดึงข้อมูลอื่นๆ เพิ่มเติม เช่น รายการทั้งหมด
        const allServicesQuery = 'SELECT * FROM services';

        db.all(allServicesQuery, [], (err, rows) => {
            if (err) {
                console.error('Error fetching all services:', err.message);
                return res.status(500).send('Error fetching all services');
            }

            res.render('homepage/cardpopup', { service, data: rows });
        });
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

module.exports = router;
