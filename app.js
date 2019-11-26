'use strict';
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 8080;
const db = require("./db/db.js");
const DB_URL = "mongodb+srv://Marie:jeuback2019@divjs10ma-csygg.gcp.mongodb.net/test?retryWrites=true&w=majority";

const nodemailer = require('nodemailer');
const mail = require('./utils/mail.js');

const ObjectId = require('mongodb').ObjectID;
const dateUtil = require('./utils/date.js');

const passwordHash = require('password-hash');

const bodyParser = require("body-parser");

const session = require('express-session');


/// TEMPLATES
app.set('view engine', 'pug');
app.set('views', 'views');


/// LOCATION FILES
app.use('/lib', express.static(__dirname + '/public/lib'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/img', express.static(__dirname + '/public/img'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/avatars', express.static(__dirname + '/public/img/avatars'));

/// PARSING APPLICATION
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Session
app.use(
    session({
      secret: "my secret text",
      resave: false,
      saveUninitialized: true
    })
  );

/// WEBSOCKET
const io = require('socket.io')(server);
io.sockets.on('connection', function (client) {


//////////// LOGIN / LOGOUT ////////////
// Login
client.on('login', function(ids){
  let members = db.get('toile').collection('members');
  members.findOne({pseudo:ids.login})
  .then(function(member) {
      // Pseudo absent de la bd
      if(!member){
        let msg = {text:'Ce pseudo est inconnu', class:'alert alert-danger'};
        client.emit('feedbackNotif',msg);
        return;
      }

      // Pseudo présent mais mauvais pwd
      if(!(passwordHash.verify(ids.pwd, member.pwd))){
        let msg = {text:'Mot de passe non reconnu', class:'alert alert-danger'};
        client.emit('feedbackNotif',msg);
        return;
      }

      // Membre reconnu : création d'une session
      let session = {
          id: member._id,
          pseudo: member.pseudo,
          lname: member.lname,
          fname: member.fname,
          admin: member.admin,
          avatar: member.avatar
      };
      let sessions=db.get("toile").collection("sessions");
      sessions.insertOne({pseudo: member.pseudo})
      .then(function(){
          client.broadcast.emit('memberLogged',session);
          client.emit('successingConnexion',session);
      })
      .catch(function(err){
        console.log('err insert session',err);
        let msg = {text:'Un problème est survenu, veuillez réessayer ultérieurement', class:'alert alert-danger'};
        client.emit('feedbackNotif',msg);
      })    
  })
  .catch(function(err){
    console.log('err find member',err);
    let msg = {text:'Un problème est survenu, veuillez réessayer ultérieurement', class:'alert alert-danger'};
    client.emit('feedbackNotif',msg);
  })
});

// Logout
client.on('logout', function(pseudo){
  client.broadcast.emit('memberLogout',pseudo);
});

//////////// PUBLICATIONS ////////////

//Publication postée sur mon mur : maj accueil et mur sur friend
client.on('publiPostedOnMyWall',function(wallPseudo){
  let publications = db.get("toile").collection("publications");

  // Affichage info new publi dans friend.publi
  io.emit('newPubliToDisplay',wallPseudo);

  // MAJ nb publis page d'accueil
  publications.find({}).count()
  .then(function(nbPublis){
    io.emit('updateNbPublis',nbPublis);
  })
});

//Publication postée sur le mur d'un ami : maj accueil et mur sur profil
client.on('publiPostedOnAWall',function(wallPseudo){
  let publications = db.get("toile").collection("publications");

  // Affichage info new publi dans friend.publi
  io.emit('newPubliToDisplayInProfile',wallPseudo);

  // MAJ nb publis page d'accueil
  publications.find({}).count()
  .then(function(nbPublis){
    io.emit('updateNbPublis',nbPublis);
  })
});

// I like
  client.on('likePubli', function(id){
    let idPub=new ObjectId(id);
    let publications = db.get("toile").collection("publications");
    publications.findOne({_id:idPub})
    .then(function(publication){
        let likes = publication.likes;
        likes++;

        publications.updateOne({_id:idPub},{$set: {likes:likes}})
        .then(function(){
            client.emit('likeAdded',{id: id, likes:likes});
        })
        .catch(function(err){
            console.log('err adding likes',err);
        });
    })
    .catch(function(err){
        console.log('err founded adding likes',err);
    });

  });

  // Delete publication 
  client.on('deletePubli', function(id){
    let idPub=new ObjectId(id);
    let publications = db.get("toile").collection("publications");
    publications.deleteOne({_id:idPub})
    .then(function(publication){
        //suppression sur mon mur et sur mon mur chez les amis (id unique! meme fonction!)
        io.emit('publiDeleted',id);
        let msg = {text:'La publication a bien été supprimée', class:'alert alert-success'};
        client.emit('feedbackNotif',msg);
    })
    .catch(function(err){
        console.log('err delete Publi',err);
        let msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
        client.emit('feedbackNotif',msg);
    });
  });

  // Poster un commentaire
client.on('saveComment', function(comment){
  let idPub=new ObjectId(comment.idP)
  let newComment = {
    idPub : idPub,
    writerPseudo: comment.pseudo,
    writerAdmin: comment.admin,
    writerAvatar: comment.avatar,
    content: comment.content,
    date: new Date()
  }
  newComment.formattedDate = dateUtil.formatDate(newComment.date);
  let comments = db.get('toile').collection('comments');
  comments.insertOne(newComment)
  .then(function(){
    comments.find({idPub:idPub})
    .toArray()
    .then(function(resComments){
      let nbComments = resComments.length;
      newComment.nbComments = nbComments;
      let msg = {text:'Votre commentaire a été publié', class:'alert alert-success'};
      client.emit('updateComments', newComment); 
      client.emit('feedbackNotif',msg);
    })
    .catch(function(err){
      console.log('err find comments',err);
      throw(err);
    })
  })
  .catch(function(err){
    console.log('err find insert Comment',err);
    let msg = {text:'Un problème est survenu, veuillez réessayer ultérieurement', class:'alert alert-danger'};
    client.emit('feedbackNotif',msg);
  })
});


  // PROFILE
  //Change password
  client.on('changePwd',function(data){
    let idMember = new ObjectId(data.idMember);
    let newPwd = passwordHash.generate(data.newPwd);
    let members = db.get("toile").collection("members");
    members.updateOne({_id:idMember},{$set: {pwd:newPwd}})
    .then(function(res){
      let msg = {text:'Votre mot de passe a été modifié avec succès', class:'alert alert-success'};
      client.emit('feedbackNotif',msg);
    })
    .catch(function(err){
      console.log('err change pwd',err);
      let msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
      client.emit('feedbackNotif',msg);

    })
  });

  //////////// MEMBERS ////////////
  // Invite a member
  client.on('invite', function(data){
    let idHost = new ObjectId(data.idHost);
    let idGuest = new ObjectId(data.idGuest);


    let newGuest = {};
    let newHost = {};

    // on constuit guest : id pseudo fname lname
    let members = db.get("toile").collection("members");
    members.findOne({_id:idGuest})
    .then(function(guest){
        newGuest = {
          id: guest._id,
          pseudo: guest.pseudo,
          lname: guest.lname,
          fname: guest.fname,
          admin: guest.admin,
          avatar: guest.avatar,
        };

        // on constuit host : id pseudo fname lname
        members.findOne({_id:idHost})
        .then(function(host){
          newHost = {
            id: host._id,
            pseudo: host.pseudo,
            lname: host.lname,
            fname: host.fname,
            admin: host.admin,
            avatar: host.avatar
          };

          //on constuit l'invitation : host, guest, date, formatDate
          let newInvitation = {
            host : newHost,
            guest : newGuest
          }
          newInvitation.date = new Date();;
          newInvitation.formatDate = dateUtil.formatDate(newInvitation.date);

          // on insère la nouvelle invitation en BDD
          let invitations = db.get("toile").collection("invitations");
          invitations.insertOne(newInvitation)
            .then(function(inviteInserted){
              // on supprime les recommandations devenues inutiles
              let recommandations = db.get("toile").collection("recommandations");
              recommandations.deleteMany({"advisedMember._id":idHost, "recommandedMember._id":idGuest})
              .then(function(res){
                // Mise a jour du front de l'host apres invitation
                  let msg = {text:'Votre invitation a bien été envoyée', class:'alert alert-success'};
                  client.emit('feedbackNotif',msg);
                  client.emit('updateAfterInvite', idGuest); 
                
                  // Avertir le guest qu'il a été invité en temps réel dans AMIS
                  client.broadcast.emit('updateFriendAfterInvite',inviteInserted.ops[0]);

                  // Avertir le guest qu'il a été invité en temps réel PARTOUT
                  client.broadcast.emit('alertRelation',{pseudo:guest.pseudo,type:2,member:host.pseudo});

                //envoi d'un email a l'invité
                const transporter = nodemailer.createTransport(mail.configMail);
                let mailOptions = mail.setOptions(3, {hostPseudo:host.pseudo, email:guest.email, fname:guest.fname,lname:guest.lname});
                transporter.sendMail(mailOptions, function(error){
                    if (error) {
                        console.log('error sending email');
                    }
                });
              })
              .catch(function(err){
                console.log('err invite delete Recoms',err)
                throw (err)
              });
            })
            .catch(function(err){
              console.log('err invite insert invit',err)
              throw (err)
            });
        })
        .catch(function(err){
          console.log('err invite findOne Host',err)
          throw(err);
        });
    })
    .catch(function(err){
      console.log('err invite findOne Guest',err);
      let msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
      client.emit('feedbackNotif',msg);
    });
  });

  //MAJ temps reel nb members
  client.on('memberAdded',function(){
    let members = db.get("toile").collection("members");
    members.find({}).count()
    .then(function(nbMembers){
      io.emit('updateNbMembers',nbMembers);
    })
  });

  //////////// FRIENDS ////////////

  //Profil friend - Change statut Admin
  client.on('changeStatut',function(data){
    let members = db.get("toile").collection("members");
    members.updateOne({pseudo:data.memberPseudo},{$set: {admin:data.statut}})
    .then(function(){
      members.find({"friends.pseudo":data.memberPseudo})
      .toArray()
      .then(function(resMembers){
        resMembers.forEach(function(member){
          let newFriends=[];
          member.friends.forEach(function(friend){
            if(friend.pseudo===data.memberPseudo){
              friend.admin=data.statut;
            }
            newFriends.push(friend);
          })
          members.updateOne({pseudo:member.pseudo},{$set:{friends:newFriends}})
          .then(function(){
            console.log('member.friends updated');
          })
          .catch(function(err){
            console.log('bug update member.friend');
          })
        })
        let msg = {text:'Le statut du membre a été modifié avec succès', class:'alert alert-success'};
        client.emit('feedbackNotif',msg);
        client.emit('updateStatut',data);
      })
      .catch(function(err){
        console.log('err during updateMany statut friend',err);
        throw(err);
      })
    })
    .catch(function(err){
      console.log('err update Member status',err);
      let msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
      client.emit('feedbackNotif',msg);
    })
  });

  // Recommand a friend
  client.on('recommandFriend', function(data){
    let members = db.get('toile').collection('members');
    members.find({pseudo:{$in:[data.adviserMember,data.recommandedMember, data.advisedMember]}},{projection: {_id:1,pseudo:1,lname:1,fname:1,admin:1,email:1,avatar:1}})
    .toArray()
    .then(function(result){
      let temp={};
      result.forEach(function(member){
        if(member.pseudo === data.adviserMember){
          temp.adviserMember = member;
        } else {
          if (member.pseudo === data.recommandedMember){
            temp.recommandedMember = member;
          } else {
            temp.advisedMember = member;
          }
        }
      });

      let recommandations = db.get('toile').collection('recommandations');
      recommandations.findOne({"advisedMember.pseudo":temp.advisedMember.pseudo, "recommandedMember.pseudo":temp.recommandedMember.pseudo})
      .then(function(recommandation){
        if(recommandation){
          let advisers = recommandation.adviserMember;
          let allreadyRecommanded = false;
          advisers.forEach(function(adviser){
            if(temp.adviserMember.pseudo === adviser.pseudo){
              allreadyRecommanded = true;
            }
          });
          if(!allreadyRecommanded){
            advisers.push(temp.adviserMember);
            recommandations.updateOne({"advisedMember.pseudo":temp.advisedMember.pseudo, "recommandedMember.pseudo":temp.recommandedMember.pseudo},{$set: {adviserMember: advisers}})
            .then(function(){
              let msg = {text:'Votre recommandation a bien été envoyée', class:'alert alert-success'};
              client.emit('feedbackNotif',msg);

              // Avertir en tps réel l'advised qu'il a reçu une recommandation
              client.broadcast.emit('alertRelation',{pseudo:temp.advisedMember.pseudo,type:3,member:temp.adviserMember.pseudo});
              
              // Avertir par email l'advised qu'il a reçu une recommandation
              const transporter = nodemailer.createTransport(mail.configMail);
              let mailOptions = mail.setOptions(4, {
                adviserPseudo:temp.adviserMember.pseudo,
                recommandedPseudo: temp.recommandedMember.pseudo,
                email:temp.advisedMember.email,
                fname:temp.advisedMember.fname,
                lname:temp.advisedMember.lname
              });
              transporter.sendMail(mailOptions, function(error){
                  if (error) {
                      console.log('error sending email',error);
                  }
              });
            })
            .catch(function(err){
              console.log('err updateRecommandation',err);
              throw (err)
            });
          } else {
            let msg = {text:'Votre recommandation a bien été envoyée', class:'alert alert-success'};
            client.emit('feedbackNotif',msg);
          }
        } else {
          let newRecommandation={};
          newRecommandation.adviserMember = [temp.adviserMember];
          newRecommandation.advisedMember = temp.advisedMember;
          newRecommandation.recommandedMember = temp.recommandedMember;
          newRecommandation.date = new Date();
          newRecommandation.formatDate = dateUtil.formatDateShort(new Date());
          recommandations.insertOne(newRecommandation)
          .then(function(){
            let msg = {text:'Votre recommandation a bien été envoyée', class:'alert alert-success'};
            client.emit('feedbackNotif',msg);

            // Avertir en tps réel l'advised qu'il a reçu une recommandation
            client.broadcast.emit('alertRelation',{pseudo:temp.advisedMember.pseudo,type:3,member:temp.adviserMember.pseudo});

            //envoi d'un email à la personne à qui on a recommandé un ami
            const transporter = nodemailer.createTransport(mail.configMail);
            let mailOptions = mail.setOptions(4, {
              adviserPseudo:temp.adviserMember.pseudo,
              recommandedPseudo: temp.recommandedMember.pseudo,
              email:temp.advisedMember.email,
              fname:temp.advisedMember.fname,
              lname:temp.advisedMember.lname
            });
            transporter.sendMail(mailOptions, function(error){
                if (error) {
                    console.log('error sending email',error);
                }
            });
          })
          .catch(function(err){
            console.log('err insertRecommandations',err);
            throw (err);
          });
        }
      })
      .catch(function(err){
        console.log('err findRecommendations',err);
        throw (err);
      });
    })
    .catch(function(err){
      console.log('err searchMember a friend',err);
      let msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
      client.emit('feedbackNotif',msg);
    });
  })


  // Remove a friendship
  client.on('removeFrienship',function(data){
    let members = db.get('toile').collection('members');
    members.updateMany(
      {pseudo:{$in:[data.removingMember,data.removedMember]}},
      {$pull: {friends:{pseudo:{$in:[data.removingMember,data.removedMember] }}}},
      {multi: true}
    )
    .then(function(){
      //on supprime tous les chats de la bd
      let discussions = db.get('toile').collection('discussions');
      discussions.deleteMany({$or:[
        {sender:data.removingMember,receiver:data.removedMember},
        {sender:data.removedMember,receiver:data.removingMember},
      ]})
      .then(function(){
        let msg = {};
        if (data.admin){
          // c'est l'admin qui a supprimé une amitié entre B et C depuis une page ami?pseudo
          msg = {text:`Cette amitié a été supprimée`, class:'alert alert-success'};
          // supprimer le membre chez l'admin, dans les pages amis des personnes concernées et dans les pages ami?pseudo
          client.emit('updateRemovingAdmin',{pseudoRemoved:data.removedMember,nbFriends: data.nbFriends-1});
          // Supprimer B dans les amis de C et supprimer C dans les amis de B
          client.broadcast.emit('updateRemoved',{pseudoRemoving:data.removingMember,pseudoRemoved:data.removedMember,admin:true});
          client.broadcast.emit('updateRemoved',{pseudoRemoving:data.removedMember,pseudoRemoved:data.removingMember,admin:true});
          // Supprimer B dans le chat de C et supprimer C dans le chat de B
          client.broadcast.emit('removedFriendShip',{removedMember:data.removedMember,removingMember:data.removingMember,admin:true});
        } else {
          // c'est un membre qui a supprimé un ami depuis une page amis
          msg = {text:`${data.removedMember} a été supprimé de vos amis`, class:'alert alert-success'};
          // Supprimer l'ami dans la liste du suppresseur
          client.emit('updateRemoving',{pseudo:data.removedMember,nbFriends: data.nbFriends-1});
          // Supprimer l'ami dans la liste du supprimé dans une page amis et supprimer dans les listes ami?pseudo
          client.broadcast.emit('updateRemoved',{pseudoRemoving:data.removingMember,pseudoRemoved:data.removedMember});
          // Me supprimer du chat de l'ami
          client.broadcast.emit('removedFriendShip',{removedMember:data.removedMember,removingMember:data.removingMember})
        }
        client.emit('feedbackNotif',msg);
      })
      .catch(function(err){
        console.log('err delete discussions',err);
        throw (err);
      });
    })
    .catch(function(err){
      console.log('err delete friendShip',err);
      let msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
      client.emit('feedbackNotif',msg);
    });
  })

  // Accept a demand
  client.on('acceptDemand', function(data){
    let idHost = new ObjectId(data.idHost);
    let idGuest = new ObjectId(data.idGuest);

    let host = {};
    let guest = {};
    let date = new Date();
    let formatDate = dateUtil.formatDateShort(date);

    let members = db.get('toile').collection('members');
    members.find({_id:{$in:[idHost,idGuest]}},{projection: {_id:1,pseudo:1,lname:1,fname:1,admin:1,avatar:1}})
    .toArray()
    .then(function(result){
      result.forEach(function(member){
        member.date = date;
        member.formatDate = formatDate;
        if(member._id.toString()==data.idHost){
          host = member;
        } else {
          guest = member;
        }
      });
      members.updateOne({_id: idHost},{$push: {friends: guest}})
      .then(function(){
        members.updateOne({_id: idGuest},{$push: {friends: host}})
        .then(function(){
          let invitations = db.get('toile').collection('invitations');
          invitations.deleteOne({"host.id":idHost, "guest.id":idGuest})
          .then(function(){
            let msg = {text:`${host.pseudo} a été ajouté à vos amis`, class:'alert alert-success'};
            client.emit('feedbackNotif',msg);
            client.emit('updateDemands',{
              accepted: true,
              idHost: data.idHost,
              nbDemands: (data.nbDemands)-1
              });
            
            // Avertir en tps réel l'hote qu'il a un nouvel ami TAB AMIS
            client.broadcast.emit('updateFriendAfterAccept',{
              pseudoHost: host.pseudo,
              pseudoGuest: guest.pseudo
            });

            // Avertir en tps réel l'hote qu'il a un nouvel ami PARTOUT
            client.broadcast.emit('alertRelation',{pseudo:host.pseudo,type:1,member:guest.pseudo});

            //et on envoie un email a l'hôte
            const transporter = nodemailer.createTransport(mail.configMail);
            let mailOptions = mail.setOptions(5, {pseudoGuest:guest.pseudo, email:host.email, fname:host.fname,lname:host.lname});
            transporter.sendMail(mailOptions, function(error){
                if (error) {
                    console.log('error sending email');
                }
            });
          })
          .catch(function(err){
            console.log('err acceptDemand delete invitation',err);
            throw(err);
          })
        })
        .catch(function(err){
          console.log('err acceptDemand update guest friends',err);
          throw(err);
        })
      })
      .catch(function(err){
        console.log('err acceptDemand update host friends',err);
        throw(err);
      })
    })
    .catch(function(err){
      console.log('err acceptDemand find members',err);
      let msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
      client.emit('feedbackNotif',msg);
    })
  });

    // Refuse a demand
    client.on('refuseDemand', function(data){
      let idHost = new ObjectId(data.idHost);
      let idGuest = new ObjectId(data.idGuest);

      let invitations = db.get('toile').collection('invitations');
      invitations.deleteOne({"host.id":idHost, "guest.id":idGuest})
      .then(function(){
        client.emit('updateDemands',{
          accepted: false,
          idHost: data.idHost,
          nbDemands: (data.nbDemands)-1
          });
      })
      .catch(function(err){
        console.log('err delete invitation',err);
        let msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
        client.emit('feedbackNotif',msg);
      });
    });

  // Ignore a recommandation
  client.on('refuseRecommandation', function(data){
    let idHost = new ObjectId(data.idAdvised);
    let idGuest = new ObjectId(data.idRecommanded);

    let recommandations = db.get('toile').collection('recommandations');
    recommandations.deleteOne({"advisedMember._id":idHost, "recommandedMember._id":idGuest})
    .then(function(){
      let msg = {text:'La recommandation a bien été ignorée', class:'alert alert-success'};
      client.emit('feedbackNotif',msg);
      client.emit('deleteRecom',idGuest);
    })
    .catch(function(err){
      console.log('err ignore recommandations',err);
      let msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
      client.emit('feedbackNotif',msg);
    });
  });

  //DISCUSSIONS
  // search new messages (pour barre de navigation)
  client.on('searchNewMessages',function(pseudo){
    let discussions = db.get('toile').collection('discussions');
    discussions.find({receiver:pseudo,new:1})
    .toArray()
    .then(function(messages){
      if(messages.length!=0){
        client.emit('iconChat',pseudo);
      }
    })
  });

   // search new messages (pour barre de navigation)
   client.on('chatSearchNewMessages',function(pseudo){
    let discussions = db.get('toile').collection('discussions');
    discussions.find({receiver:pseudo,new:1})
    .toArray()
    .then(function(messages){
      if(messages.length!=0){
        client.emit('iconChatChat',pseudo);
      }
    })
  });

  // Send a message
  client.on('sendMessage', function(data){

    let discussions = db.get('toile').collection('discussions');
    
    discussions.insertOne(data)
    .then(function(){
      client.emit('displayMessageSender',data);
      client.broadcast.emit('displayMessageReceiver',data);
      client.broadcast.emit('iconChat',data.receiver);
    })
    .catch(function(err){
      console.log('err insert discussion',err);
      let msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
      client.emit('feedbackNotif',msg);
    });
  });

  //supprimer l'etat nouveau d'un message quand il est vu
  client.on('deleteNewMessage', function(data){
    let discussions = db.get('toile').collection('discussions');
    discussions.updateMany({sender:data.sender,receiver:data.receiver},{$set:{new:0}})
    .then(function(res){
      console.log(res);
    })
  });

  client.on('deleteMember',function(data){
    //d'abord on le supprime dans les amisde chaque membre
    let members = db.get('toile').collection('members');
    members.updateMany(
      {},
      {$pull: {friends:{pseudo:data.pseudo}}},
      {multi: true}
    )
    .then(function(){
      //ensuite on supprime toutes les invitations le concernant
      let invitations = db.get('toile').collection('invitations');
      invitations.deleteMany({$or:[{"host.pseudo":data.pseudo},{"guest.pseudo":data.pseudo}]})
      .then(function(){
        let recommandations=db.get('toile').collection('recommandations');;
        recommandations.deleteMany({$or:[
          {"adviserMember.pseudo":data.pseudo},
          {"advisedMember.pseudo":data.pseudo},
          {"recommandedMember.pseudo":data.pseudo}
        ]})
        .then(function(){
          //On supprime ensuite toutes les publications qu'il a faite
          let publications=db.get('toile').collection('publications');
          publications.deleteMany({writerPseudo:data.pseudo})
          .then(function(){
            //puis on enleve les commentaires qu'il a posté
            let comments=db.get('toile').collection('comments');;
            comments.deleteMany({writerPseudo:data.pseudo})
            .then(function(){
              //et enfin, on le supprime des membres
              members.deleteOne({pseudo:data.pseudo})
              .then(function(){
                let sessions = db.get('toile').collection('sessions');
                sessions.deleteOne({pseudo:data.pseudo})
                .then(function(){
                  let msg = {text:'Le membre a été supprimé ainsi que toutes les données le concernant.', class:'alert alert-success'};
                  client.emit('feedbackNotif',msg);
                  client.emit('updateListAfterDelete',data.pseudo);
  
                  //maintenant on va le supprimer en temps réel sur les toiles des gens concernés
                  client.broadcast.emit('memberDeleted',data);
                })
                .catch(function(err){
                  console.log('err delete session',err);
                  throw(err);
                });
              })
              .catch(function(err){
                console.log('err delete member',err);
                throw(err);
              });
            })
            .catch(function(err){
              console.log('err delete comments',err);
              throw(err);
            });
          })
          .catch(function(err){
            console.log('err delete publications',err);
            throw(err);
          });
        })
        .catch(function(err){
          console.log('err delete recommandations',err);
          throw(err);
        });
      })
      .catch(function(err){
        console.log('err delete invitations',err);
        throw(err);
      });
    })
    .catch(function(err){
      console.log('err update Friends',err);
      let msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
      client.emit('feedbackNotif',msg);
    });
  });
});

app.use(function(req, res, next) {
  req.io = io;
  next();
});


/// ROUTING
app.use("/", require("./routing"));

/// 404
app.use(function (req, res, next) {
  if(!req.session.user){
    datas.title = '404';
    res.render('404', datas);
  } else {
    let discussions = db.get('toile').collection('discussions');
    discussions.find({receiver:req.session.user.pseudo,new:1})
    .toArray()
    .then(function(messages){
      datas.chat = messages.length;
      datas.title = '404';
      res.render('404', datas);
    })
    .catch(function(error){
      datas.title = '404';
      res.render('404', datas);
    }) 
  }
});



/// LISTENING
db.connect(DB_URL, function(err) {
  if (!err) {
    server.listen(port, function () {
      console.log('En écoute');
    });
  } else {
    console.log("mongodb is not connected");
  }
});



