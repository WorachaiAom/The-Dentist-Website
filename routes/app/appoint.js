const express = require("express");
const router = express.Router();
const { db, checkDatabaseConnection } = require("../../database/database");


//appointment main route
router.get("/", async(req, res) => {
  const username = req.cookies.username;
  const user_role = req.cookies.role;
  try {
      await checkDatabaseConnection();
      //TODO: More efficiency to identify user's role.
      if(user_role == "customer"){
        res.render("appoint/customer", { username });
      }else{
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
          WHERE state.status = 'รอยืนยัน'
          ORDER BY appointment.date DESC;
          `;
        db.all(sql, [], (err, rows) => {
          if (err) {
            console.error("Error fetching appointment history:", err.message);
            return res.status(500).send("Database error");
          }
          res.render("appoint/confirm", { appointments: rows , username})
        });
      }
  } catch (err) {
      res.status(500).send("Database connection error"+err);
  }
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
    // Start the transaction
    db.run("BEGIN TRANSACTION", (err) => {
      if (err) {
        return res.status(500).send("Error starting transaction: " + err.message);
      }
      
      // Update the appointment state
      db.all("SELECT state_id FROM appointment WHERE id = ?", [appointment_id], function (err, stateid) {
        db.run("UPDATE appointment SET state_id = ? WHERE id = ?", [(parseInt(stateid[0].state_id)>3)? 3:2, appointment_id], function (err) {
          if (err) {
            // If there's an error, rollback and send error response
            return db.run("ROLLBACK", () => {
              return res.status(400).send("Error updating appointment state: " + err.message);
            });
          }
      })
      
        // If update is successful, commit the transaction
        db.run("COMMIT", (err) => {
          if (err) {
            return res.status(500).send("Error committing transaction: " + err.message);
          }
          // Finally, redirect after a successful commit
          res.redirect("/");
        });
      });
    });
  });
});


//Denied appointment
router.post("/denied", (req, res) => {
  const { appointment_id } = req.body;
  db.serialize(() => {
    // Start the transaction
    db.run("BEGIN TRANSACTION", (err) => {
      if (err) {
        return res.status(500).send("Error starting transaction: " + err.message);
      }
      
      // Update the appointment state
      db.run("DELETE FROM appointment WHERE id = ?", [appointment_id], function (err) {
        if (err) {
          // If there's an error, rollback and send error response
          return db.run("ROLLBACK", () => {
            return res.status(400).send("Error deleting appointment: " + err.message);
          });
        }
        
        // If update is successful, commit the transaction
        db.run("COMMIT", (err) => {
          if (err) {
            return res.status(500).send("Error committing transaction: " + err.message);
          }
          // Finally, redirect after a successful commit
          res.redirect("/");
        });
      });
    });
  });
});

module.exports = router;
