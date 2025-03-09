const express = require("express");
const router = express.Router();
const { db, checkDatabaseConnection } = require("../../database/database");


//appointment main route
router.get("/", async (req, res) => {
  const username = req.cookies.username;
  const user_role = req.cookies.role;
  try {
    await checkDatabaseConnection();
    //TODO: More efficiency to identify user's role.
    if (user_role == "customer") {
      res.render("appoint/customer", { username });
    } else {
      let sql = `
          SELECT 
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
          JOIN users ON customers.id = users.id
          WHERE employees.id = (SELECT users.id FROM users WHERE username = ?)
          ORDER BY appointment.date DESC;
          `;
      db.all(sql, [username], (err, rows) => {
        if (err) {
          console.error("Error fetching appointment history:", err.message);
          return res.status(500).send("Database error");
        }
        res.render("appoint/confirm", { appointments: rows, username })
      });
    }
  } catch (err) {
    res.status(500).send("Database connection error" + err);
  }
});

router.get("/before", async (req, res) => {
  const username = req.cookies.username;
      let sql = `
          SELECT 
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
          JOIN users ON customers.id = users.id
          WHERE employees.id = (SELECT users.id FROM users WHERE username = ?)
          ORDER BY appointment.date DESC;
          `;
      db.all(sql, [username], (err, rows) => {
        if (err) {
          console.error("Error fetching appointment history:", err.message);
          return res.status(500).send("Database error");
        }
        res.render("appoint/confirm", { appointments: rows, username })
      });
});

//Adding appointment route
router.post("/add", (req, res) => {
  const {serviceId, date} = req.body;
  const username = req.cookies.username;

  db.serialize(() => {
     db.run("BEGIN TRANSACTION");
     //to do: more efficient way to identify user cutomer_id
     db.all("SELECT users.id AS uid, doctors.id AS did FROM users CROSS JOIN doctors WHERE users.username=? AND doctors.service_id=?", [username, serviceId],
         function (err, user) {
          console.log(user);
           db.run(
             "INSERT INTO appointment (customer_id, state_id, employee_id, service_id, date) VALUES (?, ?, ?, ?, ?)",
             [user[0].uid, 1, user[0].did, serviceId, date],//to do: default for doctor strange for test.
             function (err) {
               if (err) {
                 db.run("ROLLBACK"); // Rollback the transaction on error
                 return res.status(400).send("Error adding appointment" + err);
               }
               db.run("COMMIT");
               res.redirect("/editappt");
             }
           );
         }
       );
 }); 
});

//Confirm appointment
router.post("/confirm", (req, res) => {
  const { appointment_id } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION", (err) => {
      if (err) {
        return res.status(500).send("Error starting transaction: " + err.message);
      }

      db.all("SELECT state_id FROM appointment WHERE id = ?", [appointment_id], function (err, rows) {
        if (err || rows.length === 0) {
          return db.run("ROLLBACK", () => {
            return res.status(400).send("Error retrieving appointment state: " + (err ? err.message : "No record found"));
          });
        }

        const newState = parseInt(rows[0].state_id) == 1 ? 2 : 3;

        db.run("UPDATE appointment SET state_id = ? WHERE id = ?", [newState, appointment_id], function (err) {
          if (err) {
            return db.run("ROLLBACK", () => {
              return res.status(400).send("Error updating appointment state: " + err.message);
            });
          }

          db.run("COMMIT", (err) => {
            if (err) {
              return res.status(500).send("Error committing transaction: " + err.message);
            }
            res.redirect("/");  // Fixed redirect path
          });
        });
      });
    });
  });
});


//Denied appointment
router.post("/denied", (req, res) => {
  const { appointment_id } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION", (err) => {
      if (err) {
        return res.status(500).send("Error starting transaction: " + err.message);
      }

      db.run("DELETE FROM appointment WHERE id = ?", [appointment_id], function (err) {
        if (err) {
          return db.run("ROLLBACK", () => {
            return res.status(400).send("Error deleting appointment: " + err.message);
          });
        }

        db.run("COMMIT", (err) => {
          if (err) {
            return res.status(500).send("Error committing transaction: " + err.message);
          }
          res.redirect("/");  // Fixed redirect path
        });
      });
    });
  });
});
/*
router.post("/add", (req, res) => {
  const { serviceId, date, appointmentId } = req.body;
  const username = req.cookies.username;
  const isEdit = !!appointmentId; // ตรวจสอบว่ามี appointmentId หรือไม่

  db.serialize(() => {
      const queryCustomer =
      `
          SELECT customers.id 
          FROM customers 
          JOIN users ON users.id = customers.id 
          WHERE users.username = ?;`

      db.get(queryCustomer, [username], (err, row) => {
          if (err || !row) return res.status(400).send("User not found");

          const customerId = row.id;

          const queryDoctor = 
             ` SELECT employees.id AS employee_id
              FROM employees
              JOIN doctors ON doctors.id = employees.id
              WHERE doctors.service_id = ?;`

          db.get(queryDoctor, [serviceId], (err, doctorRow) => {
              if (err || !doctorRow) return res.status(400).send("No doctor found for this service");

              const employeeId = doctorRow.employee_id;

              if (isEdit) { // ถ้ามี appointmentId ให้ทำการอัปเดต
                  const updateSQL = 
                      `UPDATE appointment 
                      SET date = ?, service_id = ?, employee_id = ?, state_id = 1
                      WHERE id = ?;`

                  db.run(updateSQL, [date, serviceId, employeeId, appointmentId], (err) => {
                      if (err) return res.status(500).send("Error updating appointment");
                      res.redirect("/editappt"); // กลับไปหน้ารายการนัดหมาย
                  });
              } else { // ถ้าไม่มี appointmentId ให้เพิ่มนัดหมายใหม่
                  const insertSQL = 
                      `INSERT INTO appointment (customer_id, service_id, date, employee_id, state_id) 
                      VALUES (?, ?, ?, ?, 1);`

                  db.run(insertSQL, [customerId, serviceId, date, employeeId], (err) => {
                      if (err) return res.status(500).send("Error creating appointment: " + err.message);
                      res.redirect("/editappt");
                  });
              }
          });
      });
  });
});
*/
module.exports = router;
