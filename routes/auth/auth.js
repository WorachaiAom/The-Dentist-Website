const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { db, checkDatabaseConnection } = require("../../database/database");

router.get("/login", async (req, res) => {
  try {
    await checkDatabaseConnection();
    res.render("auth/login");
  } catch (err) {
    res.status(500).send("Database connection error");
  }
});

router.get("/register", async (req, res) => {
  try {
    await checkDatabaseConnection();
    res.render("auth/register");
  } catch (err) {
    res.status(500).send("Database connection error");
  }
});

router.post("/register", async (req, res) => {
  const { username, fname, sname, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).send("Passwords do not match");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // Insert into users table
    db.run(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hashedPassword],
      function (err) {
        if (err) {
          db.run("ROLLBACK"); // Rollback the transaction on error
          return res.status(400).send("Error registering user 1 " + err);
        }

        db.all("SELECT * FROM users WHERE username= ?", [username],
          function (err, user) {
            if (err) {
              db.run("ROLLBACK"); // Rollback the transaction on error
              return res.status(400).send("Error registering user 2 " + err);
            }
            console.log(user[0].id);
            // Insert into customers table
            db.run(
              "INSERT INTO customers (id, fname, sname) VALUES (?, ?, ?)",
              [user[0].id, fname, sname],
              function (err) {
                if (err) {
                  db.run("ROLLBACK"); // Rollback the transaction on error
                  return res.status(400).send("Error registering user 3 " + err);
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
        return res.status(400).send("Invalid username");
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).send("Invalid password");
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
