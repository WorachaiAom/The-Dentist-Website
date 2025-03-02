const express = require("express");
const router = express.Router();
const path = require("path");
const { db, checkDatabaseConnection } = require("../../database/database");

router.get("/", async(req, res) => {
    const username = req.cookies.username;
    try {
        await checkDatabaseConnection();
        res.render("appoint/customer", {username});
        /*
        const role = req.cookie.role;
        if(role == "customer"){
            res.render("appoint/customer");
        }else{
            res.render("appoint/confirm");
        }*/
    } catch (err) {
        res.status(500).send("Database connection error"+err);
    }
});

module.exports = router;
