const express = require('express');
const router = express.Router();
const {db} = require('../database/database');

router.get('/', (req, res) => {
  const cardService = 'SELECT name, description FROM services';
  db.all(cardService, [], (err, rows) => {
    if (err) {
      console.error('Error fetching users:', err.message);
      return res.status(500).send('Error fetching users');
    }
    res.render('homepage', {data: rows});
  })
});

router.get('/users', (req, res) => {
  const query = 'SELECT username, password FROM users';

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching users:', err.message);
      return res.status(500).send('Error fetching users');
    }

    // ส่งข้อมูลผู้ใช้ไปยังหน้า EJS
    res.render('users', { users: rows });
  });
});

module.exports = router;