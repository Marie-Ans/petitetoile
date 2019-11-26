const express = require("express");
const router = express.Router();
const db = require("../db/db.js");
const passwordHash = require('password-hash');

router.use(function(req,res,next) {
    datas = req.app.locals;
    req.app.locals = {};
    datas.title='Accueil';
    if(req.session.user){
        datas.user = true;
        datas.userInfo = req.session.user;
    }
    next();
});


router.get('/', function(req, res){
    let members = db.get('toile').collection('members');
    members.find({}).count()
    .then(function(countMembers){
        datas.nbMembers = countMembers;

        let sessions = db.get('toile').collection('sessions');
        sessions.find({}).count()
        .then(function(countSessions){
            datas.nbSessions = countSessions;

            let publications = db.get('toile').collection('publications');
            publications.find({}).count()
            .then(function(countPublications){
                datas.nbPublis = countPublications;

                //verif chat non lus si connecté sur accueil
                if(req.session.user){
                    let discussions = db.get('toile').collection('discussions');
                    discussions.find({receiver:req.session.user.pseudo,new:1})
                    .toArray()
                    .then(function(messages){
                        datas.chat = messages.length;
                        res.render('index', datas);
                    })
                    .catch(function(error){
                        console.log('err find chats',error);
                        res.render('index', datas);
                    }); 
                } else {
                    res.render('index', datas);
                }
            })
            .catch(function(err){
                console.log('err find publis',err);
                datas.nbPublis = 'unknown';
                res.render('index', datas);
            })
        })
        .catch(function(err){
            console.log('err find sessions',err);
            datas.nbSessions = 'unknown';
            res.render('index', datas);
        })
    })
    .catch(function(err){
        console.log('err find members',err);
        datas.nbMembers = 'unknown';
        res.render('index', datas);
    })
});

router.post('/', function(req, res){
    req.session.user=req.body;
    req.session.user.admin=req.body.admin==='true'?true:false;
    req.session.user.avatar=req.body.avatar;
    res.redirect('publications');
});


// Autres routes
router.use("/inscription", require("./registration"));
router.use("/motdepasseperdu", require("./password"));
router.use("/deconnexion", require("./logout"));
router.use("/about", require("./about"));
router.use("/publications", require("./publications"));
router.use("/profil", require("./profile"));
router.use("/amis", require("./friends"));
router.use("/ami", require("./friend"));
router.use("/discussions", require("./chat"));
router.use("/messagerie", require("./mails"));
router.use("/membres", require("./members"));

module.exports = router;