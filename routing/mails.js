var express = require("express");
var router = express.Router();

const db = require("../db/db");

router.use(function(req,res,next) {
    datas = req.app.locals;
    req.app.locals = {};
    datas.title = 'Ma messagerie';

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


// Messagerie en construction
router.get('/', function(req, res){
    let discussions = db.get('toile').collection('discussions');
    discussions.find({receiver:req.session.user.pseudo,new:1})
    .toArray()
    .then(function(messages){
        datas.chat = messages.length;
        res.render('messagerie', datas);
    })
    .catch(function(error){
        console.log('ERROR chat : ',error);
        datas.msg = {text:'Une erreur est survenue, veuillez réessayer ultérieurement', class:'alert alert-danger'};
        res.render('messagerie', datas);
    }) 
});

module.exports = router;
