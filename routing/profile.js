const express = require("express");
const router = express.Router();

const Member = require('../models/member');
const db = require("../db/db");
const ObjectId = require('mongodb').ObjectID;

const path = require('path');
const formidable = require('formidable'); 


router.use(function(req,res,next) {
    datas = req.app.locals;
    req.app.locals = {};
    datas.title = 'Mon profil';
    if(req.session.user){
        datas.user = true;
        datas.userInfo = req.session.user;
        next();
    }
    else {
        datas.title = '401';
        res.render('401',datas);
    }
});

//////////////////// REQUETE SE DECONNECTER////////////////////
// GET
router.get('/', function(req, res){
    if(datas.user){
        let members = db.get('toile').collection('members');
        members.findOne({pseudo:datas.userInfo.pseudo})
        .then(function(resMember){
            if(resMember){
                let member = new Member(
                    resMember.pseudo,
                    resMember.email,
                    resMember.lname,
                    resMember.fname,
                    resMember.birthday,
                    resMember.synopsis
                );
                member.gender = resMember.gender;
                member.gendersMovie = resMember.gendersMovie;
                member.originsMovie = resMember.originsMovie;
                member.distributions = resMember.distributions;
                member.times = resMember.times;
                member.idM =  resMember._id;
                
                member.admin = datas.userInfo.admin;
                member.avatar = '/img/avatars/'+resMember.avatar;
                datas.member = member;

                let discussions = db.get('toile').collection('discussions');
                discussions.find({receiver:req.session.user.pseudo,new:1})
                .toArray()
                .then(function(messages){
                    datas.chat = messages.length;
                    if(req.query.a){
                        datas.msg = {text:'Une erreur est survenue,veuillez réessayer ultérieurement', class:'alert alert-danger'};
                        res.render('profile', datas);
                    } else{
                        res.render('profile', datas);
                    }
                });
            } else {
                datas.msg = {text:'Une erreur est survenue,veuillez réessayer ultérieurement', class:'alert alert-danger'};
                res.render('profile', datas);
            }
        })
        .catch(function(err){
            console.log('err find profile',error);
            datas.msg = {text:'Une erreur est survenue,veuillez réessayer ultérieurement', class:'alert alert-danger'};
            res.render('profile', datas);
        });
    }
    
});


// POST
router.post('/', function(req, res){
    ///TRAITEMENT DU FORMULAIRE DE MODIFICATION DE COMPTE
    let idM = new ObjectId(req.body.idM);
    let member = new Member(
        datas.userInfo.pseudo,
        req.body.email,
        req.body.lname,
        req.body.fname,
        req.body.birthday,
        req.body.synopsis
    );
    member.admin=datas.userInfo.admin;;
    member.setValues('gender',req.body.gender);
    member.setValues('gendersMovie',req.body.gendersMovie);
    member.setValues('originsMovie',req.body.originsMovie);
    member.setValues('distributions',req.body.distributions);
    member.setValues('times',req.body.times);           

    let members = db.get("toile").collection("members");
    members.updateOne({_id:idM},{$set: {
        pseudo:member.pseudo,
        email:member.email,
        lname:member.lname,
        fname:member.fname,
        birthday:member.birthday,
        gender:member.gender,
        gendersMovie:member.gendersMovie,
        originsMovie:member.originsMovie,
        distributions:member.distributions,
        times:member.times,
        synopsis:member.synopsis
    }})
    .then(function(){
        //on modifie les infos utiles hez les membres qui le membre pour ami
        members.find({"friends.pseudo":member.pseudo})
        .toArray()
        .then(function(membersFriend){
            membersFriend.forEach(function(memberFriend){
                let newFriends=[];
                memberFriend.friends.forEach(function(friend){
                  if(friend.pseudo===member.pseudo){
                    friend.lname=member.lname;
                    friend.fname=member.fname;
                  }
                  newFriends.push(friend);
                })
                members.updateOne({pseudo:memberFriend.pseudo},{$set:{friends:newFriends}})
                .then(function(){
                  console.log('profile member.friends updated');
                })
                .catch(function(err){
                  console.log('bug profile update member.friend');
                })
              })
              req.session.user.pseudo = member.pseudo;
              req.session.user.lname = member.lname;
              req.session.user.fname = member.fname;
              req.session.user.admin = member.admin;

              datas.userInfo = req.session.user;
              member.idM = req.body.idM;
              member.avatar = '/img/avatars/'+req.session.user.avatar;
              datas.member = member;
              datas.msg = {text:'Votre profil a été modifié avec succès.', class:'alert alert-success'};

              let discussions = db.get('toile').collection('discussions');
                discussions.find({receiver:req.session.user.pseudo,new:1})
                .toArray()
                .then(function(messages){
                    datas.chat = messages.length;
                    if(req.query.a){
                        datas.msg = {text:'Une erreur est survenue,veuillez réessayer ultérieurement', class:'alert alert-danger'};
                        res.render('profile', datas);
                    } else{
                        res.render('profile', datas);
                    }
                });
        })
    })
    .catch(function(err){
        console.log('ERROR Modif Profile : ',error);
        member.admin = datas.userInfo.admin;
        member.idM = req.body.idM;
        datas.member = member;
        datas.msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement.', class:'alert alert-danger'};
        res.render('profile',datas);
    });
});

router.post('/fileupload', function(req, res){

    let userId = req.session.user.id;
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req);

    form.on('fileBegin', (name, file) => {
        file.name=userId+'.jpg';
        file.path = path.join(__dirname, '../public/img/avatars',file.name);
    })
    
    form.on('file', function (name, file){
        let avatar = req.session.user.id+'.jpg';
        if(req.session.user.avatar==='default_avatar.png'){
            let members = db.get("toile").collection("members");
            members.updateOne({_id:new ObjectId(req.session.user.id)},{$set:{avatar:avatar}})
            .then(function(){
                let publications = db.get("toile").collection("publications");
                publications.updateMany({writerPseudo:req.session.user.pseudo},{$set:{writerAvatar:avatar}})
                .then(function(){
                    let comments = db.get("toile").collection("comments");
                    comments.updateMany({writerPseudo:req.session.user.pseudo},{$set:{writerAvatar:avatar}})
                    .then(function(){
                        let members = db.get("toile").collection("members");
                        members.find({"friends.pseudo":req.session.user.pseudo})
                        .toArray()
                        .then(function(membersFriend){
                            membersFriend.forEach(function(memberFriend){
                                let newFriends=[];
                                memberFriend.friends.forEach(function(friend){
                                    if(friend.pseudo === req.session.user.pseudo){
                                        friend.avatar = avatar;
                                    }
                                    newFriends.push(friend);
                                })
                                members.updateOne({pseudo:memberFriend.pseudo},{$set:{friends:newFriends}})
                                .then(function(){
                                    req.session.user.avatar=avatar;
                                    res.redirect(`/profil`); 
                                })
                                .catch(function(err){
                                    console.log('update friends avatar',err);
                                    res.redirect(`/profil?a=error`);
                                })
                            })
                        })
                        .catch(function(err){
                            console.log('find friends avatar',err);
                            res.redirect(`/profil?a=error`);
                        })
                    })
                    .catch(function(err){
                        console.log('update comments avatar',err);
                        res.redirect(`/profil?a=error`);
                    })
                })
                .catch(function(err){
                    console.log('update publications avatar',err);
                    res.redirect(`/profil?a=error`);
                })
            })
            .catch(function(err){
                console.log('update member avatar',err);
                res.redirect(`/profil?a=error`);
            })
        }
        else {
            res.redirect(`/profil`);
        }
    });

    form.on('error', (err) => {
        console.log('ParsingError',err);
        res.redirect(`/profil?a=error`);
    });
});


module.exports = router;
