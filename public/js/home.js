'use strict';

//Appel du contructeur sockUtil pour initialiser l'url
var sockUtil = new sockUtil();
var socket = io(sockUtil.url);
socket.on('fromServeur', function(data){
});

// Constructeur du formulaire et masquage des erreurs au cas où
var formHome = new formUtils();
formHome.hideErrorRequired();

// Soumission du formulaire de connexion
$('#submit').click(function(e){
    e.preventDefault();
    formHome.valid = true;
    formHome.hideErrors();
    if($('#userId').val()=== ""){
        $('#userIdMsg').show();
        formHome.valid = false;
    }
    if($('#pwd').val()=== ""){
        $('#pwdMsg').show();
        formHome.valid = false;
    }
    if(formHome.valid){
        var ids={
            login:$('#userId').val(),
            pwd: $('#pwd').val()
        }
        socket.emit('login',ids)
    }
});


// La connexion s'est faite, redirection vers publications.
socket.on('successingConnexion', function(session){
    $.ajax({
        url: "/",
        method: "POST",
        data: session,
        success: function(data) {
          window.location.href='/publications';
        },
        error: function(error) {
            console.log('error');
            $('.alert').remove();
            $('h3').after('<div class="alert alert-danger">Un problème est survenu, veuillez réessayer ultérieurement</div>');
        }
      });
    
});



/******* INFO TEMPS REEL MBS SESS PUBLIS*******/ 
// Un nouveau membre vient de s'inscrire
socket.on('updateNbMembers',function(nbMembers){
    $('#registred').text(nbMembers); 
});

// Un ami vient de se connecter
socket.on('memberLogged',function(session){
    $('#logged').text(parseFloat($('#logged').text())+1); 
})
  
// Un ami vient de se déconnecter
socket.on('memberLogout',function(pseudo){
    $('#logged').text(parseFloat($('#logged').text())-1); 
})

// Une publi vient d'être postée
socket.on('updateNbPublis',function(nbPublis){
    $('#published').text(nbPublis); 
});

// NOTIFICATIONS
// Réception et affichage d'une notiff
socket.on('feedbackNotif', function(msg){
    $('.alert').remove();
    $('h3').after('<div class="'+msg.class+'">'+msg.text+'</div>');
});

// Disparition de la notif au clic de la souris
// $('*').click(function(){
//     $('.alert').remove();
// });