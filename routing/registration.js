const express = require("express");
const router = express.Router();

const Member = require('../models/member');
const nodemailer = require('nodemailer');
const mail = require('../utils/mail.js');

const db = require("../db/db");

const passwordHash = require('password-hash');

router.use(function(req,res,next) {
    member = req.app.locals;
    req.app.locals = {};
    member=new Member();
    next();
});

//////////////////// Page d'inscription////////////////////
// GET
router.get('/', function(req, res){
    if(req.session && req.session.user){
        res.render('registration', {user: req.session && req.session.user, dataUser:req.session.user, title:'Inscription'});
    } else {
        res.render('registration',member);
    }
    
});


// POST
router.post('/', function(req, res){
    ///TRAITEMENT DU FORMULAIRE DE CREATION DE COMPTE
    let member = new Member(
        req.body.pseudo,
        req.body.email,
        req.body.lname,
        req.body.fname,
        req.body.birthday,
        req.body.synopsis
    );
    member.setValues('gender',req.body.gender);
    member.setValues('gendersMovie',req.body.gendersMovie);
    member.setValues('originsMovie',req.body.originsMovie);
    member.setValues('distributions',req.body.distributions);
    member.setValues('times',req.body.times);


    let members = db.get("toile").collection("members");
    members.findOne({pseudo:req.body.pseudo})
    .then(function(result){
        if(result){
            datas = member;
            datas.msg = {text:'Ce pseudonyme est déjà utilisé, veuillez en choisir un autre', class:'alert alert-danger'};
            res.render('registration', datas);
        } else {
            member.pwd = passwordHash.generate(req.body.pwd);
            member.admin = false;
            member.avatar = "default_avatar.png"
            member.friends = [];
            members.insertOne(member)
            .then(function(){
                const transporter = nodemailer.createTransport(mail.configMail);
                let mailOptions = mail.setOptions(0, {pseudo:member.pseudo, pwd:req.body.pwd,email:member.email, fname:member.fname,lname:member.lname});
                transporter.sendMail(mailOptions, function(error){
                    if (error) {
                        datas.msg = {text:'Votre compte a été créé avec succès.', class:'alert alert-success'};
                    } else {
                        datas.msg = {text:'Votre compte a été créé avec succès. Le rappel de vos identifiants a été envoyé à l\'adresse : '+req.body.email, class:'alert alert-success'};
                    }
                    datas.title='Inscription';
                    res.render('registration', datas);
                })
            })
            .catch(function(err){
                console.log('err insert member',err);
                datas.title='Inscription';
                datas.msg = {text:'Problème d\'accès à la base de données, votre compte n\'a pas été créé, veuillez réessayer ultérieurement', class:'alert alert-danger'};
                res.render('registration', datas);
            })
        }
    })
    .catch(function(err){
        console.log('err find member',err);
        datas.title='Inscription';
        datas.msg = {text:'Problème d\'accès à la base de données, votre compte n\'a pas été créé, veuillez réessayer ultérieurement', class:'alert alert-danger'};
        res.render('registration', datas);
    });
});
    

module.exports = router;
