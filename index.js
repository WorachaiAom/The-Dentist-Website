const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

// Set EJS as the view engine
app.set("view engine", "ejs");

// Middleware to serve static files
app.use(express.static("public"));

// Home route using EJS
app.get("/", (req, res) => {
    res.render("homepage");
});

app.get("/homepage", (req, res) => {
    res.render("homepage");
});

// History 
app.get("/History", (req, res) => {
    res.render("history");
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
