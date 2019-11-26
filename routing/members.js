var express = require("express");
var router = express.Router();

const nodemailer = require('nodemailer');
const mail = require('../utils/mail.js');

const db = require("../db/db");
const regex = require('../utils/regex.js')

router.use(function(req,res,next) {
    datas = req.app.locals;
    req.app.locals = {};
    datas.title = 'Tous les membres';
    if(req.session.user){
        datas.user = true;
        datas.userInfo = req.session.user;
        let pseudosFriends=[];
        let pseudosGuests=[];
        let pseudosHosts=[];
        let pseudosRecommanded=[];
        let pseudosSessions=[];

        let members = db.get('toile').collection('members');
        members.findOne({pseudo:datas.userInfo.pseudo},{projection: {_id:0, friends:1}})
        .then(function(member){
            if(member.friends){
                member.friends.forEach(function(friend){
                    pseudosFriends.push(friend.pseudo);
                });
            }
            let invitations = db.get('toile').collection('invitations');
            invitations.find({"host.pseudo":datas.userInfo.pseudo})
            .toArray()
            .then(function(invits){
                if(invits.length){
                    invits.forEach(function(invit){
                        pseudosGuests.push(invit.guest.pseudo);
                    })
                }

                invitations.find({"guest.pseudo":datas.userInfo.pseudo})
                .toArray()
                .then(function(demands){
                    if(demands.length){
                        demands.forEach(function(demand){
                            pseudosHosts.push(demand.host.pseudo);
                        })
                    }

                    let recommandations = db.get('toile').collection('recommandations');
                    recommandations.find({"advisedMember.pseudo":datas.userInfo.pseudo})
                    .toArray()
                    .then(function(recoms){
                        if(recoms.length){
                            recoms.forEach(function(recom){
                                if(pseudosRecommanded.indexOf(recom.recommandedMember.pseudo)==-1){
                                    pseudosRecommanded.push(recom.recommandedMember.pseudo);
                                }
                            });
                        }

                        let sessions = db.get('toile').collection('sessions');
                        sessions.find({})
                        .toArray()
                        .then(function(currentSessions){
                            currentSessions.forEach(function(session){
                                pseudosSessions.push(session.pseudo);
                            });

                            datas.friends = pseudosFriends;
                            datas.guests = pseudosGuests;
                            datas.hosts = pseudosHosts;
                            datas.recoms = pseudosRecommanded;
                            datas.sessions = pseudosSessions;

                            let discussions = db.get('toile').collection('discussions');
                            discussions.find({receiver:req.session.user.pseudo,new:1})
                            .toArray()
                            .then(function(messages){
                                datas.chat = messages.length;
                                next();
                            })
                            .catch(function(error){
                                console.log('ERROR chat : ',error);
                                datas.msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
                                next();
                            }) 
                        })
                        .catch(function(err){
                            console.log('err sessions',err);
                            datas.err = err;
                            next();
                        });
                    })
                    .catch(function(err){
                        console.log('err recoms',err);
                        datas.err = err;
                        next();
                    });
                })
                .catch(function(err){
                    console.log('err demands',err);
                    datas.err = err;
                    next();
                });
            })
            .catch(function(err){
                console.log('err invits',err)
                datas.err = err;
                next();
            });
        })
        .catch(function(err){
            console.log('err friends',err)
            datas.err = err;
            next();
        });
    }
    else {
        datas.title = '401';
        res.render('401',datas);
    }
});

// GET
router.get('/', function(req, res){
    if(datas.user){
        let members = db.get('toile').collection('members');
        members.find({})
        .toArray()
        .then(function(members){
            datas.members=[];
            if(members.length){
                members.forEach(function(member){
                    member.friend=false;
                    member.guest=false;
                    member.host=false;
                    member.recom=false;
                    member.linked = false;
                    member.inline = false;
                    if(datas.friends.indexOf(member.pseudo)!=-1){
                        member.friend=true;
                        member.linked = true;
                    }
                    if(datas.guests.indexOf(member.pseudo)!=-1){
                        member.guest=true;
                        member.linked = true;
                    }
                    if(datas.hosts.indexOf(member.pseudo)!=-1){
                        member.host = true;
                        member.linked = true;
                    }
                    if(datas.recoms.indexOf(member.pseudo)!=-1){
                        member.recom = true;
                        member.linked = true;
                    }
                    if(datas.sessions.indexOf(member.pseudo)!=-1){
                        member.inline = true;
                    }
                    datas.members.push(member);
                })
            }
            datas.filters = {filtering: false, lname: '', fname: '', pseudo: ''};
            res.render('members', datas);
        })
        .catch(function(err){
            datas.msg = {text:'Une erreur est survenue,veuillez réessayer ultérieurement', class:'alert alert-danger'};
            datas.filters = {filtering: false, lname: '', fname: '', pseudo: ''};
            res.render('members', datas);
        });
    } else {
        res.render('members', datas);
    }
});

// Filtrer les membres
router.post('/', function(req, res){
   let members = db.get('toile').collection('members');
   members.find(
       {lname: {$regex: `${regex.buildRegex(req.body.lname)}`, $options: 'i'},
       fname: {$regex: `${regex.buildRegex(req.body.fname)}`, $options: 'i'},
       pseudo: {$regex: `${regex.buildRegex(req.body.pseudo)}`, $options: 'i'}
    })
   .toArray()
   .then(function(members){
    datas.members=[];
    if(members.length){
        members.forEach(function(member){
            member.friend=false;
            member.guest=false;
            member.host=false;
            member.linked = false;
            member.inline = false;
            if(datas.friends.indexOf(member.pseudo)!=-1){
                member.friend=true;
                member.linked = true;
            }
            if(datas.guests.indexOf(member.pseudo)!=-1){
                member.guest=true;
                member.linked = true;
            }
            if(datas.hosts.indexOf(member.pseudo)!=-1){
                member.host = true;
                member.linked = true;
            }
            if(datas.sessions.indexOf(member.pseudo)!=-1){
                member.inline = true;
            }
            datas.members.push(member);
        })
    }
    datas.filters = {filtering: true, lname: req.body.lname, fname: req.body.fname, pseudo: req.body.pseudo}
    res.render('members', datas);
   })
   .catch(function(err){
        console.log('err',err);
        datas.msg = {text:'Une erreur est survenue,veuillez réessayer ultérieurement', class:'alert alert-danger'};
        datas.filters = {filtering: false, lname: '', fname: '', pseudo: ''};
        res.render('members', datas);
   });
});


module.exports = router;
