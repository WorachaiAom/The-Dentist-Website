const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const authRoutes = require('./routes/auth/auth');
const homeRoutes = require('./routes/home');
const hisRoutes = require('./routes/his/histo');
const { checkDatabaseConnection } = require('./database/database');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// กำหนดเส้นทาง (routes)
app.use('/auth', authRoutes);
app.use('/', homeRoutes);
app.use('/history', hisRoutes);

// Route สำหรับออกจากระบบ
app.get('/logout', (req, res) => {
    res.clearCookie('username');
    res.redirect('/');
});

// ตรวจสอบการเชื่อมต่อฐานข้อมูลก่อนเริ่มเซิร์ฟเวอร์
checkDatabaseConnection()
    .then((message) => {
        console.log(message);
        const PORT = process.env.PORT || 80;
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error(err.message);
        process.exit(1);
    });
