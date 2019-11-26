var express = require("express");
var router = express.Router();

router.use(function(req,res,next) {
    datas = req.app.locals;
    req.app.locals = {};
    datas.title = 'A propos'
    if(req.session.user){
        datas.user = true;
        datas.userInfo = req.session.user;
    }
    next();
});

//////////////////// PAGE A PROPOS ////////////////////
// GET
router.get('/', function(req, res){    
    res.render('about',datas);
});



module.exports = router;
