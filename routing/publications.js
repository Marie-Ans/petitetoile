const express = require("express");
const router = express.Router();

const dateUtil = require('../utils/date.js');

const db = require("../db/db.js");
const ObjectId = require('mongodb').ObjectID


router.use(function(req,res,next) {
    datas = req.app.locals;
    req.app.locals = {};
    datas.title = 'Mes publications';
    if(req.session.user){
        datas.user = true;
        datas.userInfo = req.session.user;
        let publications = db.get('toile').collection('publications');
        publications.find({wallPseudo: req.session.user.pseudo})
        .sort({date:-1})
        .toArray()
        .then(function(publisTemp){
            let publis = [];
            let comments = db.get('toile').collection('comments');
            comments.find({})
            .toArray()
            .then(function(resComments){
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
                datas.publis=publis;
                next();
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
            next();
        });   
    } else {
        datas.title = '401';
        res.render('401',datas);
    }
});

// GET
router.get('/', function(req, res){
    
    let discussions = db.get('toile').collection('discussions');
    discussions.find({receiver:req.session.user.pseudo,new:1})
    .toArray()
    .then(function(messages){
        datas.chat = messages.length;
        if(req.query.t && req.query.r === 'success'){
            datas.msg = {text:`Votre ${req.query.t} a été publié`, class:'alert alert-success'};
            res.render('publications', datas);
            return;
        }
        if(req.query.t && req.query.r === 'error'){
            datas.msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
            res.render('publications', datas);
            return;
        }
        res.render('publications', datas);
    })
    .catch(function(error){
        console.log('ERROR chat : ',error);
        datas.msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
        res.render('publications', datas);
    }) 
});

router.post('/', function(req, res){
    let publication = {
        wallPseudo: req.session.user.pseudo,
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
        res.redirect('/publications?t=message&r=success');
    })
    .catch(function(error){
        res.redirect('/publications?t=message&r=error');
    })
});

router.post('/comment', function(req, res){
    let comment = {
        pseudo: req.session.user.pseudo,
        content: req.body.comment,
        date: new Date(),
        likes: 0,
        unlikes: 0,
        idP: req.body.idP
    };
    comment.formattedDate = dateUtil.formatDate(comment.date);
    let idPub=new ObjectId(comment.idP)
    let publications = db.get("toile").collection("publications");
    publications.findOne({_id:idPub})
    .then(function(publication){
        let comments = publication.comments;
        comments.push(comment);

        publications.updateOne({_id:idPub},{$set: {comments:comments}})
        .then(function(){
            res.redirect('/publications?t=commentaire&r=success');
        })
        .catch(function(err){
            console.log('err update comments',err);
            res.redirect('/publications?t=commentaire&r=error');
        })

    })
    .catch(function(error){
        console.log('err find publications',error);
        res.redirect('/publications?t=commentaire&r=error');
    });  
});
    

module.exports = router;
