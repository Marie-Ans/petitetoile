var express = require("express");
var router = express.Router();

const db = require("../db/db");

router.use(function(req,res,next) {
    datas = req.app.locals;
    req.app.locals = {};
    datas.title = 'Mes discussions';
    datas.tab = 'discussions';

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

// Display the friends and the messages of the selectedFriend
router.get('/', function(req, res){
    
    
    //on récupère tous les pseudos connectés
    let sessions = db.get('toile').collection('sessions');
    sessions.find({},{projection:{_id:0,pseudo:1}})
    .toArray()
    .then(function(connexions){
        let pseudosSessions = connexions.map(connexion => connexion.pseudo);

        //on récupère tous les messages non lus
        let discussions = db.get('toile').collection('discussions');
        discussions.aggregate(
            [
                {$match : {receiver:req.session.user.pseudo, new:1}},
                {$group : { _id : "$sender" , nbNewMessages: { $sum: "$new"}}}
            ]
        )
        .toArray()
        .then(function(newChats){
            datas.chat = newChats.length;

            //on va chercher mes amis
            let members = db.get('toile').collection('members');
            members.findOne({pseudo:datas.userInfo.pseudo})
            .then(function(member){
                datas.friends=[];
                member.friends.forEach(function(friend){
                    // si ami dans sessions, alors inline
                    if(pseudosSessions.indexOf(friend.pseudo)!=-1){
                        friend.inline=true;
                    } else {
                        friend.inline=false;
                    }
                    //recuperation du nb de nouveau message pposté par l'ami
                    friend.newMessages=0;
                    newChats.forEach(function(newChat){
                        if(friend.pseudo===newChat._id){
                            friend.newMessages=newChat.nbNewMessages;
                        }
                    });
                    datas.friends.push(friend);
                });
 
                datas.selectedFriend = req.query.p?req.query.p:"";
                /// Traitement si on a cliqué sur un ami req.query.p
                if(req.query.p){
                    discussions.find({$or:
                        [ 
                            {sender:req.query.p,receiver:datas.userInfo.pseudo},
                            {sender:datas.userInfo.pseudo,receiver:req.query.p}
                        ]
                    })
                    .sort({date:1})
                    .toArray()
                    .then(function(messages){
                        datas.listSelected="listSelected";
                        datas.displayingSelected="displayingSelected";
                        datas.messages=messages;

                        discussions.updateMany({sender:req.query.p,receiver:datas.userInfo.pseudo},{$set:{new:0}})
                        .then(function(){
                            datas.friends.forEach(function(friend){
                                if(friend.pseudo === datas.selectedFriend){
                                    friend.newMessages=0;
                                }
                            })
                            res.render('chat', datas);
                        })
                        .catch(function(err){
                            console.log('err updateNew',err)
                            datas.msg = {text:'Une erreur est survenue,veuillez réessayer ultérieurement', class:'alert alert-danger'};
                            res.render('chat', datas);
                        });       
                    })
                    .catch(function(err){
                        console.log('err findDiscussions',err)
                        datas.msg = {text:'Une erreur est survenue,veuillez réessayer ultérieurement', class:'alert alert-danger'};
                        res.render('chat', datas);
                    })
                } else {
                    res.render('chat',datas);
                }
            })
            .catch(function(err){
                console.log('err find member',err)
                datas.msg = {text:'Une erreur est survenue,veuillez réessayer ultérieurement', class:'alert alert-danger'};
                throw(err);
            })
        })
        .catch(function(err){
            console.log('err discussions aggreagate',err)
            datas.msg = {text:'Une erreur est survenue,veuillez réessayer ultérieurement', class:'alert alert-danger'};
            throw(err);
        })
    })
    .catch(function(err){
        console.log('err find sessions',err)
        datas.msg = {text:'Une erreur est survenue,veuillez réessayer ultérieurement', class:'alert alert-danger'};
        res.render('chat', datas);
    })
});

    

module.exports = router;
