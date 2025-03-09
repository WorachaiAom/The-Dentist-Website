const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { db, checkDatabaseConnection } = require("../../database/database");

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
            console.log(user[0].id);
            // Insert into customers table
            db.run(
              "INSERT INTO customers (id, fname, sname) VALUES (?, ?, ?)",
              [user[0].id, fname, sname],
              function (err) {
                if (err) {
                  db.run("ROLLBACK"); // Rollback the transaction on error
                  req.flash('error', 'มีบางอย่างไม่ถูกต้อง');
                  return res.redirect('register');
                }

                // Commit the transaction if both queries succeed
                db.run("COMMIT");
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
      if (user.role_id){
        res.cookie("role", user.role);
      }else{
        res.cookie("role", "customer");}
      res.redirect("/");
    }
  );
});

module.exports = router;
