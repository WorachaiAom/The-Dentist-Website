const express = require("express");
const router = express.Router();
const path = require("path");
const sqlite3 = require('sqlite3').verbose();

router.get("/", (req, res) => {
    res.render('histo/history');
});

module.exports = router;