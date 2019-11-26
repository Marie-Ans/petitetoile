var express = require("express");
var router = express.Router();
const db = require("../db/db");
const DB_URL = "mongodb+srv://Marie:jeuback2019@divjs10ma-csygg.gcp.mongodb.net/test?retryWrites=true&w=majority";

router.get("/", function(req, res, next) {

    let pseudoSession = req.session.user.pseudo;

    let sessions = db.get("toile").collection("sessions");
    sessions.deleteOne({pseudo:pseudoSession}, function(){
        req.session.destroy();
        res.redirect("/");
    });
});

module.exports = router;
