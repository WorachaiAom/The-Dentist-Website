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

router.get("/appfilter", (req, res) => {
  try{
    let sql = "SELECT service_id, date FROM appointment WHERE state_id <> 3";
    db.all(sql, [], (err, dates) => {
      if(err)return res.status(500).send("Database error");
      res.send(JSON.stringify(dates));
    })
  }catch(err){
    res.status(500).send("error");
    console.log(err);
  }
});

//Adding appointment route
router.post("/add", (req, res) => {
  const {appointmentId, serviceId, date} = req.body;
  const username = req.cookies.username;

  db.serialize(() => {
     db.run("BEGIN TRANSACTION");
     //to do: more efficient way to identify user cutomer_id
     console.log("hello ",username, serviceId);
     db.all("SELECT users.id AS uid, doctors.id AS did FROM users CROSS JOIN doctors WHERE users.username=? AND doctors.service_id=?", [username, serviceId],
         function (err, user) {
          console.log(user);
          if(appointmentId){
            db.run(
              "UPDATE appointment SET date = ?, state_id = 1 WHERE id = ?",
              [date, appointmentId],//to do: default for doctor strange for test.
              function (err) {
                if (err) {
                  db.run("ROLLBACK"); // Rollback the transaction on error
                  return res.status(400).send("Error adding appointment" + err);
                }
                db.run("COMMIT");
                res.redirect("/editappt");
              }
            );
          }else{
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

module.exports = router;
