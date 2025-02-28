const express = require("express");
const app = express();
const PORT = process.env.PORT || 80;
const sqlite3 = require('sqlite3').verbose();

app.use(express.static("public"));

// Set EJS as the view engine
app.set("view engine", "ejs");

// Middleware to serve static files
app.use(express.static("public"));

// Route
app.get("/", (req, res) => {
    res.render("homepage");
});

app.get("/homepage", (req, res) => {
    res.render("homepage");
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

