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
    const { name, description, detail, rate } = req.body;
    const query = 'INSERT INTO services (name, description, detail, rate) VALUES (?, ?, ?, ?)';
    db.run(query, [name, description, detail, rate], function (err) {
        if (err) {
            console.error('Error adding service:', err.message);
            return res.status(500).send('เกิดข้อผิดพลาดในการเพิ่มบริการ');
        }
        res.redirect('/services');
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
    const { name, description, detail, rate } = req.body;
    const query = 'UPDATE services SET name = ?, description = ?, detail = ?, rate = ? WHERE id = ?';
    db.run(query, [name, description, detail, rate, serviceId], function (err) {
        if (err) {
            console.error('Error updating service:', err.message);
            return res.status(500).send('เกิดข้อผิดพลาดในการแก้ไขบริการ');
        }
        res.redirect('/services');
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
        res.redirect('/services');
    });
});

module.exports = router;
