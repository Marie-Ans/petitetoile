'use strict';

//Appel du contructeur sockUtil pour initialiser l'url
var sockUtil = new sockUtil();
var socket = io(sockUtil.url);

//Fonction a exécuter à chaque fois et une seule fois à l'arrivée sur la page
//vérifier si newMessages
// (function(){
//     var pseudoReceiver = $('.breadcrumb').attr('id');
//     socket.emit('searchNewMessages',pseudoReceiver);
// }());

/******* CONNEXIONS DECONNEXIONS AMIS *******/ 
//L'ami vient de se connecter
socket.on('memberLogged',function(session){
    var pseudo = '#'+session.pseudo;
    var memberLogInfo = $(pseudo).find('.offline');
    memberLogInfo.removeClass('offline');
    memberLogInfo.addClass('inline');
  })
  
  //L' ami vient de se déconnecter
  socket.on('memberLogout',function(pseudo){
    var pseudo = '#'+pseudo;
    var memberLogInfo = $(pseudo).find('.inline');
    memberLogInfo.removeClass('inline');
    memberLogInfo.addClass('offline');
});


// FILTRES
// Saisie de texte : bouton clear
$('.filter-group input').keyup(function(){
    $('#clear').removeClass('disabled');
});

// Désactiver bouton clear si disabled
$('#clear.disabled').click(function(e){
    e.preventDefault();
});

// Recherche : clear
$('#clear').click(function(){
    window.location.replace("membres");
})


// FILTRER LES MEMBRES
$('form').submit(function(e){
    if($('#lname').val() === 0 
        && $('#fname').val() ===''
        && $('#pseudo').val() === ''){
        e.preventDefault();
    }
});

// VOIR MA TOILE
$('.seePubli').click(function(){
    document.location.href='/publications';
});

// VOIR LA TOILE
// Je suis admin ou c'est mon ami
$('.seeWeb').click(function(){
    document.location.href='/ami?p='+$(this).parent().parent().parent().parent().prev().attr('id').trim();
});

// INVITER UN MEMBRE
$('.inviteWeb').click(function(){
    if($(this).hasClass('inviteWeb')){
        var invitation = {
            idHost: $('.breadcrumb>li').first().attr('id'),
            idGuest: $(this).parent().parent().parent().parent().parent().attr('id'),
            type: 'm'
        };
        socket.emit('invite',invitation);
    }
});

// Mise a jour du membre après succès invitation
socket.on('updateAfterInvite', function(idGuest){
    var idMember = '#'+idGuest;
    var member = $(idMember);
    var metaInfo = member.find('.metaInfo');
    metaInfo.append('<a class="font-italic" href="/amis/invitations" title="Voir les invitations">Invité</a>');
    var inviteLink = member.find('.metaActions .inviteWeb');
    inviteLink.removeClass('inviteWeb');
    inviteLink.addClass('gray');

})

// SUPPRIMER UN MEMBRE
$('.deleteBtn').click(function(){
    var pseudoMember = $(this).parent().parent().find('.modal-body span').attr('id').trim();
    var idMember = $(this).parent().parent().find('.modal-body p').attr('id').trim();
    socket.emit('deleteMember',{pseudo:pseudoMember,id:idMember});
});


// Mise a jour du membre après succès suppression
socket.on('updateListAfterDelete', function(memberDelete){
    var idPseudoMember = '#'+memberDelete;
    var member = $(idPseudoMember).parent();
    member.remove();
});


//NOTIFICATIONS
// Réception et affichage d'une notif
socket.on('feedbackNotif', function(msg){
    $('.alert').remove();
    $('h2').after('<div class="'+msg.class+'">'+msg.text+'</div>');
});

// Disparition de la notif au clic de la souris.
$('*').click(function(){
    $('.alert').remove();
});

//surveyChat
socket.on('iconChat',function(pseudo){
    if($('.breadcrumb').attr('id')===pseudo){
        $('#iconChat').attr('src','/img/nav/chat-new-30.png');
    }
});

/***************** SURVEILLANCE ALERTS RELATIONS *****************/ 
socket.on('alertRelation',function(data){
    if($('ol.breadcrumb').attr('id')===data.pseudo){
        
        if(data.type===1){
            var message = `${data.member} vient d'accepter votre invitation`;
        }
        if(data.type===2){
            var message = `${data.member} vient de vous inviter`;
        }
        if(data.type===3){
            var message = `${data.member} vient de vous recommander une nouvelle relation`;
        }
    
        var alert = `<div id="alertRelation" class="alert alert-primary" role="alert">${message}</div>`;
    
        $('ol.breadcrumb').parent().after(alert);
        $('#alertRelation').queue(function(){
        setTimeout(function(){
        $('#alertRelation').dequeue();
        }, 3000 );
        });
        $('#alertRelation').fadeOut("slow",function(){
            $('#alertRelation').animate({
                height: "0px"
            },1000,function(){
                $('#alertRelation').remove();
            })
        });
    }
});