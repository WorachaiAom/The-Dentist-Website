const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { db } = require("../../database/database");
require('dotenv').config();
const nodemailer = require('nodemailer');

// สร้าง Transporter (ใช้ Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  secure: true
});

// ส่งอีเมลยืนยัน
const sendVerificationEmail = async (email, user) => {
  const verificationLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${user}`;

  try {
    await transporter.sendMail({
      from: `"ระบบลงทะเบียน" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'ยืนยันอีเมลของคุณ',
      html: `
        <h1>ยืนยันอีเมล</h1>
        <p>คลิกลิงก์ด้านล่างเพื่อยืนยันอีเมลของคุณ:</p>
        <a href="${verificationLink}">ยืนยันอีเมล</a>
        <p>ลิงก์จะหมดอายุใน 1 ชั่วโมง</p>
      `
    });
    console.log('ส่งอีเมลยืนยันเรียบร้อยแล้ว');
  } catch (error) {
    console.error('ส่งอีเมลไม่สำเร็จ:', error.message);
    throw new Error('ไม่สามารถส่งอีเมลได้');
  }
};

router.get("/login", async (req, res) => {
  const messages = {
    error: req.flash('error') || [] // กำหนดค่าเริ่มต้นเป็น array ว่าง
  };
  res.render('auth/login', { messages });
});

router.get('/register', (req, res) => {

  const messages = {
    error: req.flash('error') || [] // กำหนดค่าเริ่มต้นเป็น array ว่าง
  };
  res.render('auth/register', { messages });
});

router.post("/register", async (req, res) => {
  const { username, fname, sname, password, confirmPassword, email, tel } = req.body;
  console.log(process.env.EMAIL_USER)
  if (password !== confirmPassword) {
    req.flash('error', 'รหัสผ่านไม่ตรงกัน');
    return res.redirect('register');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // Insert into users table
    db.run(
      "INSERT INTO users (username, password, email, tel) VALUES (?, ?, ?, ?)",
      [username, hashedPassword, email, tel],
      function (err) {
        if (err) {
          db.run("ROLLBACK"); // Rollback the transaction on error
          req.flash('error', 'มีบางอย่างไม่ถูกต้อง');
          return res.redirect('register');
        }

        db.all("SELECT * FROM users WHERE username= ?", [username],
          function (err, user) {
            if (err) {
              db.run("ROLLBACK"); // Rollback the transaction on error
              req.flash('error', 'มีบางอย่างไม่ถูกต้อง');
              return res.redirect('register');
            }
            // Insert into customers table
            db.run(
              "INSERT INTO customers (id, fname, sname) VALUES (?, ?, ?)",
              [user[0].id, fname, sname],
              async function (err) {
                if (err) {
                  db.run("ROLLBACK"); // Rollback the transaction on error
                  req.flash('error', 'มีบางอย่างไม่ถูกต้อง');
                  return res.redirect('register');
                }

                // Commit the transaction if both queries succeed
                await sendVerificationEmail(email, username);
                db.run("COMMIT");
                const { default: open } = await import('open'); // ใช้ dynamic import
                open(`https://mail.google.com/mail`);
                res.redirect("/auth/login");
              }
            );

          }
        );
      }
    );
  });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    `SELECT 
      users.id AS user_id, 
      users.username, 
      users.password,
      users.verify, 
      customers.fname AS customer_fname, 
      customers.sname AS customer_sname, 
      employees.role_id, 
      employees.fname AS employee_fname, 
      employees.sname AS employee_sname,
      roles.role
    FROM 
      users 
    LEFT JOIN 
        customers ON users.id = customers.id 
    LEFT JOIN 
        employees ON users.id = employees.id 
    LEFT JOIN
      roles on employees.role_id = roles.id
    WHERE 
        users.username = ?;`,
    [username],
    async (err, user) => {
      if (user.verify != "true") {
        req.flash('error', 'บัญชียังไม่ได้ยืนยัน');
        return res.redirect('login');
      }
      if (err || !user) {
        req.flash('error', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        return res.redirect('login');
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        req.flash('error', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        return res.redirect('login');
      }

      res.cookie("username", user.username);
      if (user.role_id) {
        res.cookie("role", user.role);
      } else {
        res.cookie("role", "customer");
      }
      res.redirect("/");
    }
  );
});

router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  try {
    // ค้นหาผู้ใช้ด้วย Token
    const user = await new Promise((resolve, reject) => {
      db.all(
        'SELECT id FROM users WHERE username = ?',
        [token], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(400).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
    // อัปเดตสถานะผู้ใช้
    await db.run(
      'UPDATE users SET verify = "true" WHERE id = ?',
      [user[0].id]
    );

    return res.redirect('login');
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการยืนยันอีเมล' });
  }
});

module.exports = router;
