const express = require("express");
const router = express.Router();

const db = require("../db/db");

router.use(function(req,res,next) {
    datas = req.app.locals;
    req.app.locals = {};
    datas.title = 'Mes amis';

    if(req.session.user){
        datas.user = true;
        datas.userInfo = req.session.user;

        let members = db.get('toile').collection('members');
        members.findOne({pseudo:datas.userInfo.pseudo})
        .then(function(member){
            nbFriends = member.friends.length;

            let invitations = db.get('toile').collection('invitations');
            invitations.find({"host.pseudo":datas.userInfo.pseudo})
            .sort({date:1})
            .toArray()
            .then(function(invits){
                nbInvits = invits.length;

                invitations.find({"guest.pseudo":datas.userInfo.pseudo})
                .sort({date:1})
                .toArray()
                .then(function(demands){
                    nbDemands = demands.length;

                    let recommandations = db.get('toile').collection('recommandations');
                    recommandations.find({"advisedMember.pseudo":datas.userInfo.pseudo})
                    .toArray()
                    .then(function(recoms){
                        nbRecoms = recoms.length;

                        let sessions = db.get('toile').collection('sessions');
                        sessions.find({})
                        .toArray()
                        .then(function(currentSessions){
                            let pseudosSessions=[];
                            currentSessions.forEach(function(session){
                                pseudosSessions.push(session.pseudo);
                            });

                            datas.friends = member.friends;
                            datas.nbFriends = nbFriends;
                            datas.invits = invits;
                            datas.nbInvits = nbInvits;
                            datas.demands = demands;
                            datas.nbDemands = nbDemands;
                            datas.recommandations = recoms;
                            datas.nbRecoms = nbRecoms;
                            datas.pseudosSessions = pseudosSessions;

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


// Display the friends
router.get('/', function(req, res){
    datas.tab = 'amis';
    if (datas.err){
        datas.msg = {text:'Une erreur est survenue,veuillez réessayer ultérieurement', class:'alert alert-danger'};
        res.render('friends', datas);
    } else {
        let newFriends=[];
        datas.friends.forEach(function(friend){
            friend.inline=false;
            if(datas.pseudosSessions.indexOf(friend.pseudo)!=-1){
                friend.inline=true;
            }
            newFriends.push(friend);
        })
        datas.friends = newFriends;
        res.render('friends', datas);
    }
});

// AJAX : members'pseudo recommanded by the user
// au final on peut recommander quelqu'un deja recommandé, il sera juste pas ajouté dans les recos
// en revanche, il ne faut disabled mes amis deja amis avec l'ami que je veux recommander.
// du coup il faut faire une requete aggreation ou on va chercher tous les amis du recommandeur (pseudo:$in) qu'on agrege dans une variable friendsOfMyFrienc
router.post('/recommandations', function(req, res){
    var pseudosFriends = [];
    var friendsToDisplay = [];

    datas.friends.forEach(function(friend){
        if(friend.pseudo != req.body.pseudoFriend){
            //on ne veut pas l'ami qu'on recommande
            pseudosFriends.push(friend.pseudo);
        }
    });

    //j'ai le tableau des noms de mes amis sauf celui qui est recommandé
    let members = db.get('toile').collection('members');
    members.find(
        {pseudo:{$in:pseudosFriends},"friends.pseudo":{$ne:req.body.pseudoFriend}},
        {projection:{_id:0,pseudo:1}})
    .toArray()
    .then(function(withoutRecommended){
        //j'ai le tableau des amis de mes amis qui n'ont pas l'amiRecom en amis ( pseudo de mon amis + ses amis)
        let pseudosWithoutRec = [];
        withoutRecommended.forEach(function(withoutRec){
            pseudosWithoutRec.push(withoutRec.pseudo);
        })

        let invitations = db.get('toile').collection('invitations');
        invitations.find(
            {$or : [
                    {"host.pseudo":{$in:pseudosWithoutRec},"guest.pseudo":req.body.pseudoFriend},
                    {"guest.pseudo":{$in:pseudosWithoutRec},"host.pseudo":req.body.pseudoFriend},
                ]
            }
        )
        .toArray()
        .then(function(invits){
            datas.friends.forEach(function(friend){
                if(friend.pseudo === req.body.pseudoFriend){
                    friend.display = null;
                } else {
                    if(pseudosWithoutRec.indexOf(friend.pseudo)!=-1){
                        friend.display = true;
                        invits.forEach(function(invit){
                            if(invit.host.pseudo === friend.pseudo || invit.guest.pseudo === friend.pseudo){
                                friend.display = false;
                            }
                        })
                    } else {
                        friend.display = false;
                    }
                }
                friendsToDisplay.push(friend);
            });
            res.json(friendsToDisplay);
        });
    });
});


// Display the invitations from the user
router.get('/invitations', function(req,res){
    datas.tab = 'invitations';
    if (datas.err){
        datas.msg = {text:'Une erreur est survenue,veuillez réessayer ultérieurement', class:'alert alert-danger'};
        res.render('friends', datas);
    } else {
        res.render('friends', datas);
    }
});

// Display the invitations to the user 
router.get('/demandes', function(req,res){
    datas.tab = 'demandes';
    if (datas.err){
        datas.msg = {text:'Une erreur est survenue,veuillez réessayer ultérieurement', class:'alert alert-danger'};
        res.render('friends', datas);
    } else {
        res.render('friends', datas);
    }
});


// Display the recommandations to invite a member from the user
router.get('/recommandations', function(req,res){
    datas.tab = 'recommandations';
    if (datas.err){
        datas.msg = {text:'Une erreur est survenue,veuillez réessayer ultérieurement', class:'alert alert-danger'};
        res.render('friends', datas);
    } else {
        res.render('friends', datas);
    }
});
    

module.exports = router;
