const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth/auth');
const homeRoutes = require('./routes/home');
const hisRoutes = require('./routes/his/histo');
const path = require('path');
const { db, checkDatabaseConnection } = require('./database/database');
const { console } = require('inspector');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', authRoutes);
app.use('/homepage', homeRoutes);
app.use('', homeRoutes);
app.use('/history', hisRoutes);

checkDatabaseConnection()
  .then((message) => {
    console.log(message);

    // เริ่มต้นเส้นทาง (routes)
    app.use('/auth', authRoutes);
    app.use('/homepage', homeRoutes);
    app.use('/history', hisRoutes);

    const PORT = process.env.PORT || 80;
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1); // ออกจากกระบวนการหากการเชื่อมต่อฐานข้อมูลล้มเหลว
  });
