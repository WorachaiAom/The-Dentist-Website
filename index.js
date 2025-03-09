const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const authRoutes = require('./routes/auth/auth');
const homeRoutes = require('./routes/homepage/home');
const hisRoutes = require('./routes/his/histo');
const eapptRoutes = require('./routes/edit/eappt');
const eacctRoutes = require('./routes/edit/eacct');
const appointRoutes = require('./routes/app/appoint');
const { checkDatabaseConnection, db } = require('./database/database');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

function notificationsfunction(req, res, next) {
    if (!req.cookies.username) {
        res.locals.notifications = [];
        return next();
    }

    db.all(
        `SELECT 
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
        WHERE 
            state.status = 'ยืนยันแล้ว'
            AND customer_id = (SELECT id FROM users WHERE username = ?)
            AND datetime(appointment.date) BETWEEN 
            datetime('now', 'localtime') AND 
            datetime('now', 'localtime', '+2 hours')`,
        [req.cookies.username],
        (err, rows) => {
            if (err) {
                console.error("Database Error:", err);
                return next(err);
            }
            res.locals.notifications = rows || [];
            next();
        }
    );
}

// กำหนดเส้นทาง (routes)
app.use('/auth', authRoutes);
app.use('/', (req, res, next) => {
    notificationsfunction(req, res, next);
}, homeRoutes);
app.use('/history', (req, res, next) => {
    notificationsfunction(req, res, next);
}, hisRoutes);
app.use('/editappt', (req, res, next) => {
    notificationsfunction(req, res, next);
}, eapptRoutes);
app.use('/editacct', (req, res, next) => {
    notificationsfunction(req, res, next);
}, eacctRoutes);
app.use('/appointment', (req, res, next) => {
    notificationsfunction(req, res, next);
}, appointRoutes);

// เพิ่มเส้นทางสำหรับจัดการบริการ
const serviceRoutes = require('./routes/service/service'); // แก้ไขพาธให้ถูกต้อง
app.use('/service', serviceRoutes);

// Route สำหรับออกจากระบบ
app.get('/logout', (req, res) => {
    res.clearCookie('username');
    res.clearCookie('role');
    res.redirect('/');
});

// ตรวจสอบการเชื่อมต่อฐานข้อมูลก่อนเริ่มเซิร์ฟเวอร์
checkDatabaseConnection()
    .then((message) => {
        console.log(message);
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log("\x1b[32mServer is running on \x1b[33mhttp://localhost:3000");// แสดงข้อความนี้ใน console
        });
    })
    .catch((err) => {
        console.error(err.message);
        process.exit(1);
    });

// Global error handler
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err);
    res.status(500).render('error', { message: "Internal Server Error" });
});
