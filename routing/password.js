var express = require("express");
var router = express.Router();

const nodemailer = require('nodemailer');
const mailUtil = require('../utils/mail.js');
const pwdUtil = require('../utils/pwd.js');

const db = require("../db/db");

const passwordHash = require('password-hash');

router.use(function(req,res,next) {
    datas = req.app.locals;
    req.app.locals = {};
    next();
});

//////////////////// REQUETE SE DECONNECTER////////////////////
// GET
router.get('/', function(req, res){
    if(req.session && req.session.user){
        res.render('password', {user: req.session && req.session.user, dataUser:req.session.user});
    }
    else {
        res.render('password');
    }
});


router.post('/', function(req, res){
    ///TRAITEMENT DU FORMULAIRE OUBLI DE MOT DE PASSE
    let members = db.get("toile").collection("members");
    members.findOne({pseudo:req.body.pseudo,email:req.body.email})
    .then(function(member){
        if(!member){
            datas.msg = {text:'Pseudo et/ou emails non reconnus', class:'alert alert-danger'};
            res.render('password', datas);
        } else {
            let newPwd = pwdUtil.generatePwd();
            let newSecurePwd = passwordHash.generate(newPwd);
            members.updateOne({pseudo:req.body.pseudo},{$set:{pwd:newSecurePwd}})
            .then(function(){
                const transporter = nodemailer.createTransport(mailUtil.configMail);
                let mailOptions = mailUtil.setOptions(1, {pseudo:member.pseudo, pwd:newPwd, email:member.email, fname:member.fname,lname:member.lname});

                transporter.sendMail(mailOptions, function(error){
                    if (error) {
                        console.log('err during send Email',error);
                        datas.msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
                    } else {
                        datas.msg = {text:'Votre nouveau mot de passe vous a été envoyé par email.', class:'alert alert-success'};
                    }
                    res.render('password', datas);
                });
            })
            .catch(function(err){
                console.log('err updatePwd',err);
                throw(err);
            });
        }
    })
    .catch(function(err){
        console.log('err find Member',err);
        datas.msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
        res.render('password', datas);
    });            
});
    

module.exports = router;
