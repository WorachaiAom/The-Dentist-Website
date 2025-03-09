const express = require('express');
const router = express.Router();
const { db } = require('../../database/database');

// แสดงรายการบริการทั้งหมด
router.get('/', (req, res) => {
    const query = 'SELECT * FROM services WHERE id != 0'; // ไม่แสดงบริการ GODMODE
    const username = req.cookies.username;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching services:', err.message);
            return res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูลบริการ');
        }
        res.render('services/manage', { services: rows ,username});
    });
});

// แสดงฟอร์มเพิ่มบริการ
router.get('/add', (req, res) => {
    res.render('services/add');
});

// เพิ่มบริการใหม่
router.post('/add', (req, res) => {
    const { name, description, detail, price_estimate, duration, recommendations } = req.body;

    // ตรวจสอบข้อมูลที่ส่งมา
    if (!name || !description || !detail || !price_estimate || !duration || !recommendations) {
        return res.status(400).send('กรุณากรอกข้อมูลให้ครบถ้วน');
    }

    // เพิ่มข้อมูลลงในฐานข้อมูล
    const query = 'INSERT INTO services (name, description, detail, price_estimate, duration, recommendations ) VALUES (?, ?, ?, ?, ?, ?)';
    db.run(query, [name, description, detail, price_estimate, duration, recommendations], function (err) {
        if (err) {
            console.error('Error adding service:', err.message);
            return res.status(500).send('เกิดข้อผิดพลาดในการเพิ่มบริการ');
        }

        // ส่งกลับไปยังหน้า manage-services หลังจากเพิ่มสำเร็จ
        res.redirect('/service');
    });
});

// แสดงฟอร์มแก้ไขบริการ
router.get('/edit/:id', (req, res) => {
    const username = req.cookies.username;
    const serviceId = req.params.id;
    const query = 'SELECT * FROM services WHERE id = ?';
    db.get(query, [serviceId], (err, service) => {
        if (err) {
            console.error('Error fetching service:', err.message);
            return res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูลบริการ');
        }
        res.render('services/edit', { service, username});
    });
});

// แก้ไขบริการ
router.post('/edit/:id', (req, res) => {
    const serviceId = req.params.id;
    const { name, description, detail, price_estimate, duration, recommendations } = req.body;

    // ตรวจสอบข้อมูลที่ส่งมา
    if (!name || !description || !detail || !price_estimate || !duration || !recommendations) {
        return res.status(400).send('กรุณากรอกข้อมูลให้ครบถ้วน');
    }

    // อัปเดตข้อมูลในฐานข้อมูล
    const query = 'UPDATE services SET name = ?, description = ?, detail = ?, price_estimate = ?, duration = ?, recommendations = ? WHERE id = ?';
    db.run(query, [name, description, detail, price_estimate, duration, recommendations, serviceId], function (err) {
        if (err) {
            console.error('Error updating service:', err.message);
            return res.status(500).send('เกิดข้อผิดพลาดในการแก้ไขบริการ');
        }

        // ส่งกลับไปยังหน้า manage-services หลังจากแก้ไขสำเร็จ
        res.redirect('/service');
    });
});

// ลบบริการ
router.post('/delete/:id', (req, res) => {
    const serviceId = req.params.id;
    const query = 'DELETE FROM services WHERE id = ?';
    db.run(query, [serviceId], function (err) {
        if (err) {
            console.error('Error deleting service:', err.message);
            return res.status(500).send('เกิดข้อผิดพลาดในการลบบริการ');
        }
        res.redirect('/service');
    });
});

module.exports = router;