'use strict';

//Appel du contructeur sockUtil pour initialiser l'url
var sockUtil = new sockUtil();
var socket = io(sockUtil.url);

//Verifier si le compte a été créé avec succès pour envoi info socket maj temps reelle nb membres
(function(){
    if($('.alert-success').length){
        socket.emit('memberAdded');
    }
}());

var formRegistration = new formUtils();
formRegistration.hideErrorRequired();

// $('#fileavatar').change(function(){
//     formRegistration.avatar=this.files[0];
//     formRegistration.checkFileAvatar($('#fileavatar'),formRegistration.avatar);
// });


$('form').submit(function(e){
    formRegistration.hideErrors();
    formRegistration.valid = true;
    formRegistration.checkPseudo($('#pseudo'));
    formRegistration.checkPwd($('#pwd'));
    formRegistration.checkEmail($('#email'));
    formRegistration.checkName($('#lname'));
    formRegistration.checkName($('#fname'));
    formRegistration.checkDate($('#birthday'));
    //formRegistration.checkFileAvatar($('#fileavatar'),formRegistration.avatar);
    if(!formRegistration.valid){
        formRegistration.showGeneralError("Le formulaire comporte des erreurs");
        e.preventDefault();
        return;
    }
});