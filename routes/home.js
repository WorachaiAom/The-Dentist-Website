const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const username = req.cookies.username;
  if (!username) {
    return res.redirect('/login');
  }
  res.render('home', { username });
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