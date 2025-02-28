const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth/auth');
const homeRoutes = require('./routes/home');
const path = require('path');
const { db, checkDatabaseConnection } = require('./database/database');
const { console } = require('inspector');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', authRoutes);
app.use('/home', homeRoutes);
app.use('', homeRoutes);

checkDatabaseConnection()
  .then((message) => {
    console.log(message);

    // เริ่มต้นเส้นทาง (routes)
    app.use('/', authRoutes);
    app.use('/home', homeRoutes);

    const PORT = process.env.PORT || 80;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1); // ออกจากกระบวนการหากการเชื่อมต่อฐานข้อมูลล้มเหลว
  });
