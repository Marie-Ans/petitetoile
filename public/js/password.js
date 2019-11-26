'use strict';


var formLost = new formUtils();
formLost.hideErrorRequired();

$('form').submit(function(e){
    formLost.valid = true;
    formLost.hideErrors();
    formLost.checkPseudo($('#pseudo'));
    formLost.checkEmail($('#email'));
    if(!formLost.valid){
        e.preventDefault();
    }
})
