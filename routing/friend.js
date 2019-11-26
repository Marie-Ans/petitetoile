var express = require("express");
var router = express.Router();

const nodemailer = require('nodemailer');
const mail = require('../utils/mail.js');

const dateUtil = require('../utils/date.js');

const db = require("../db/db");


router.use(function(req,res,next) {
    datas = req.app.locals;
    req.app.locals = {};
    datas.title = 'La toile de mon ami';

    if(req.session.user){
        datas.user = true;
        datas.userInfo = req.session.user;

        let discussions = db.get('toile').collection('discussions');
        discussions.find({receiver:req.session.user.pseudo,new:1})
        .toArray()
        .then(function(messages){
            datas.chat = messages.length;

            let members = db.get('toile').collection('members');
            members.findOne({pseudo:req.session.user.pseudo,"friends.pseudo":req.query.p})
            .then(function(friend){
                console.log(req.session.user.admin);
                console.log(typeof(req.session.user.admin));
                if(friend || req.session.user.admin===true){
                    next();
                }else{
                    datas.notfriend = true;
                    datas.title = '401';
                    res.render('401',datas);
                }
            })
            .catch(function(error){
                console.log('err find members',error);
                next();
            })
        })
        .catch(function(error){
            console.log('err find chats',error);
            next();
        })
    }
    else {
        datas.title = '401';
        res.render('401',datas);
    }
});


// Display friend's publications
router.get('/', function(req, res){
    datas.tab = 'publis';

    //Récupération des infos sur le membre
    let members = db.get('toile').collection('members');
    members.findOne({pseudo:req.query.p})
    .then(function(friend){
        //DATAS.FRIEND
        datas.friend = friend;

        // Récupération de l'état online-inline de l'ami
        let sessions = db.get('toile').collection('sessions');
        sessions.findOne({pseudo:req.query.p})
        .then(function(session){
            if(session){
                datas.friend.inline=true;
            } else {
                datas.friend.inline=false;
            }

            //Récupération des publis sur son mur
            let publications = db.get('toile').collection('publications');
            publications.find({wallPseudo:req.query.p})
            .sort({date:-1})
            .toArray()
            .then(function(publisTemp){
                //les publis récupérés sont stockées dans une variable temporaire avant récup des comments
                let publis = [];

                //Récupération des commentaires
                let comments = db.get('toile').collection('comments');
                comments.find({})
                .toArray()
                .then(function(resComments){
                    //Pour chaque publi, on récupère les commentaires associés
                    publisTemp.forEach(function(publi){
                        let commentsPubli=[];
                        resComments.forEach(function(comment){
                            if((publi._id).toString()==(comment.idPub).toString()){
                                commentsPubli.push(comment);
                            }
                        })
                        publi.comments=commentsPubli;
                        publis.push(publi);
                    })
                    //DATAS.PUBLIS AVEC COMMENTS
                    datas.publis = publis;
                    datas.nbPublis = publis.length;
                    
                    //Cas où une publication vient d'etre postée, envoi d'un email
                    if(req.query.t && req.query.r === 'success'){
                        datas.msg = {text:`Votre ${req.query.t} a été publié`, class:'alert alert-success'};
                        res.render('friend', datas);
                        let members = db.get('toile').collection('members');
                        members.findOne({pseudo:req.query.p})
                        .then(function(member){
                            const transporter = nodemailer.createTransport(mail.configMail);
                            let mailOptions = mail.setOptions(2,{
                                receiver : member,
                                writerPseudo :req.session.user.pseudo}
                            );
                            transporter.sendMail(mailOptions, function(error){
                                if(error){
                                    console.log('error sending email',error);
                                }
                            })
                        })
                        .catch(function(err){
                            console.log('err find member',err);
                        })
                    }

                    //Cas où une publication a été postée, mais erreur survenue
                    if(req.query.t && req.query.r === 'error'){
                        datas.msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
                        res.render('friend', datas);
                    }

                    res.render('friend', datas);
                })
                .catch(function (error) {
                    console.log('ERROR resComments : ',error);
                    datas.msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
                    next();
                }); 
            })
            .catch(function (error) {
                console.log('ERROR Search publications : ',error);
                datas.msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
                res.render('friend', datas);
            });
        })
        .catch(function (error) {
            console.log('ERROR find member in sessions : ',error);
            datas.msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
            res.render('friend', datas);
        });
    })
    .catch(function (error) {
        console.log('ERROR find friend in members : ',error);
        datas.msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
        res.render('friend', datas);
    });
});

// Post a publication on the friend's web
router.post('/', function(req, res){
    let publication = {
        wallPseudo: req.body.friend,
        writerPseudo: req.session.user.pseudo,
        writerAdmin: req.session.user.admin,
        writerAvatar: req.session.user.avatar,
        content: req.body.newPubli,
        date: new Date(),
        likes: 0,
        unlikes: 0,
        comments:[],
    };
    publication.formattedDate = dateUtil.formatDate(publication.date);
    let publications = db.get('toile').collection('publications');
    publications.insertOne(publication)
    .then(function(){
        res.redirect(`/ami?p=${req.query.p}&t=message&r=success`);
    })
    .catch(function(error){
        console.log('err find member',error);
        res.redirect(`/ami?p=${req.query.p}&t=message&r=error`);
    })
});

// Display the friend's profile
router.get('/profil', function(req,res){
    datas.tab = 'profile';

    //Récupération des infos sur le membre
    let members = db.get('toile').collection('members');
    members.findOne({pseudo:req.query.p})
    .then(function(friend){
        datas.friend = friend;

        // Récupération de l'état online-inline de l'ami
        let sessions = db.get('toile').collection('sessions');
        sessions.findOne({pseudo:req.query.p})
        .then(function(session){
            if(session){
                datas.friend.inline=true;
            } else {
                datas.friend.inline=false;
            }
            res.render('friend', datas);
        })
        .catch(function (error) {
            console.log('ERROR find member in sessions : ',error);
            datas.msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
            res.render('friend', datas);
        });
    })
    .catch(function (error) {
        console.log('ERROR find friend in members : ',error);
        datas.msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
        res.render('friend', datas);
    });
});

// Display the friend's friends
router.get('/amis', function(req,res){
    datas.tab = 'amis';

    //Récupération des infos sur le membre
    let members = db.get('toile').collection('members');
    members.findOne({pseudo:req.query.p})
    .then(function(friend){
        datas.friend = friend;

        //on récupère la liste de mes amis pour faire le lien avec les amis de l'ami
        let members = db.get('toile').collection('members');
        members.findOne({pseudo:datas.userInfo.pseudo})
        .then(function(result){
            //on met dans un tableau tous les pseudos de mes amis
            let myFriends = [];
            result.friends.forEach(function(myFriend){
                myFriends.push(myFriend.pseudo);
            });

            //ensuite on stocke tous les pseudos des gens connectes
            let sessions = db.get('toile').collection('sessions');
            sessions.find({})
            .toArray()
            .then(function(currentSessions){
                let pseudosSessions=[];
                currentSessions.forEach(function(session){
                    pseudosSessions.push(session.pseudo);
                });

                //on en profite pour récupérer l'état inline/offline de l'ami
                if(currentSessions.indexOf(datas.friend.pseudo)){
                    datas.friend.inline=true;
                } else {
                    datas.friend.inline=false;
                }

                //On cherche toutes les invitations en lien avec moi même
                let invitations = db.get('toile').collection('invitations');
                invitations.find({$or: [
                    {"guest.pseudo":datas.userInfo.pseudo}, 
                    {"host.pseudo":datas.userInfo.pseudo}
                ]})
                .toArray()
                .then(function(invits){
                    // on met dans un tableau tous les pseudos de mes invités
                    // et dans un autre tableau tous les pseudos de mes inviteurs
                    let myInvits=[];
                    let myDemands = [];
                    invits.forEach(function(invit){
                        if(invit.host.pseudo === datas.userInfo.pseudo){
                            myInvits.push(invit.guest.pseudo);
                        } else {
                            myDemands.push(invit.host.pseudo);
                        }
                    });

                    //On cherche toutes les recommandations en lien avec moi même
                    let recommandations = db.get('toile').collection('recommandations');
                    recommandations.find({"advisedMember.pseudo":datas.userInfo.pseudo})
                    .toArray()
                    .then(function(recoms){
                        // on met dans un tableau tous les pseudos des gens qui me sont recommandés
                        let myRecoms=[];
                        recoms.forEach(function(recom){
                            myRecoms.push(recom.recommandedMember.pseudo)
                        });

                        // maintenant on va construire le tableau final à partir des amis de l'ami
                        let displayingFriends = [];
                        datas.friend.friends.forEach(function(friend){

                            if(myFriends.indexOf(friend.pseudo)!=-1)
                            {
                              
                                friend.friend=true;
                                friend.linked=true;
                            }
                            if(myInvits.indexOf(friend.pseudo)!=-1)
                            {
                                
                                friend.guest=true;
                                friend.linked=true;
                            }
                            if(myDemands.indexOf(friend.pseudo)!=-1)
                            {
                           
                                friend.host=true;
                                friend.linked=true;
                            }
                            if(myRecoms.indexOf(friend.pseudo)!=-1)
                            {
                                
                                friend.recom=true;
                                friend.linked=true;
                            }
                            if(pseudosSessions.indexOf(friend.pseudo)!=-1){
                                friend.inline=true;
                            }
                            displayingFriends.push(friend);
                        });
                        datas.friends = displayingFriends;
                        datas.nbFriends = displayingFriends.length;
                        res.render('friend', datas);
                    })
                    .catch(function(err){
                        console.log('err find recoms',err);
                        datas.msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
                        res.render('friend', datas);
                    });
                
                })
                .catch(function(err){
                    console.log('err find invits',err);
                    datas.msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
                    res.render('friend', datas);
                });
            })
            .catch(function(err){
                console.log('err find sessions',err);
                datas.msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
                res.render('friend', datas);
            });
        })
        .catch(function(err){
            console.log('err find me in members',err);
            datas.msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
            res.render('friend', datas);
        }); 
    })
    .catch(function(err){
        console.log('err find friend in member',err);
        datas.msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
        res.render('friend', datas);
    });     
});

module.exports = router;
