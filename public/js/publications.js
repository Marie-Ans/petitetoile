'use strict';

//Appel du contructeur sockUtil pour initialiser l'url
var sockUtil = new sockUtil();
var socket = io(sockUtil.url);

//Fonction a exécuter à chaque fois et une seule fois à l'arrivée sur la page
//Verifier si une publication a été postée avec succès pour envoi info socket maj temps reelle page accueil, et envoi sur le mur des amis
//vérifier si newMessages
(function(){

    var url = new URL(window.location);
    if(url.searchParams.get('r')!=null){
        var wallPseudo = $('.breadcrumb').attr('id');
        socket.emit('publiPostedOnMyWall', wallPseudo);
    };

    // var pseudoReceiver = $('.breadcrumb').attr('id');
    // socket.emit('searchNewMessages',pseudoReceiver);
}());




///// Affichage / Masquage textarea /////
$('textarea').click(function(){
    $(this).next().show();
    $('small').remove();
});


$('.cancel').click(function(){
    $(this).parent().parent().hide();
    $(this).parent().parent().find('small').remove();
    $(this).parent().parent().parent().find('textarea').val("");
});

// Publier une publication
$('form').submit(function(e){
    if($(this).find('textarea').val()===""){
        e.preventDefault();
        $(this).find('.cancel').before('<small class="form-text text-center text-muted mr-2">Vous devez saisir un texte avant de publier</small>');
    }
});

// Arrivée de nouvelles publis d'un ami
socket.on('newPubliToDisplayInProfile',function(wallPseudo){
    if(wallPseudo ===  $('.breadcrumb').attr('id')){
        if($('a.newPubliAlert').length===0){
            var newPubNotif = `<center><a class="font-weight-bold nav-link pinkColor p-0 m-0 newPubliAlert" href="/publications" title="Afficher les dernieres publis arrivées">Nouvelles publis!...</a></center>`;
            $('h2').after(newPubNotif);
        }
    }
});

// Supprimer une publication
$('.deletePubli').click(function(){
    var idPubli =  $(this).parent().parent().parent().attr('id');
    socket.emit('deletePubli',idPubli);
});


//Mise à jour affichage publis après suppression publication
socket.on('publiDeleted',function(idPubli){
    var idPub = '#'+idPubli;
    $(idPub).remove();
});


// liker une publi
$('.like').click(function(){
    var idPubli = $(this).parent().parent().parent().attr('id');
    socket.emit('likePubli',idPubli);
});

socket.on('likeAdded', function(publi){
    let id = '#'+publi.id;
    $(id).find('.publiFooter>p:first-child>span').text(publi.likes);
});

// Montrer les commentaires de la publi
$('.showComments').click(function(){
    if( $(this).parent().parent().next().css('display')==='none'){
        $(this).parent().parent().next().show();
    } else {
        $(this).parent().parent().next().hide(); 
    }
});

// Publier un commentaire
$('.validateComment').click(function(){
    var content =  $(this).parent().parent().prev().val();
    if(content===""){
        $(this).prev().before('<small class="form-text text-center text-muted mr-2">Vous devez saisir un texte avant de publier</small>');
    } else { 
        var idPubli =  $(this).parent().parent().parent().parent().parent().parent().attr('id');
        var pseudo = $('ol.breadcrumb').attr('id');
        var admin = $('ol.breadcrumb>li').first().attr('id');
        var avatar = $('.page-publi').attr('id');
        let comment = {
            idP: idPubli,
            pseudo: pseudo,
            admin: admin=='admin'?true:false,
            avatar: avatar,
            content: content
        }
        socket.emit('saveComment',comment);
    }
});

// Mise à jour affichage commentaires après publi commentaire
socket.on('updateComments',function(comment){
    var idPub = '#'+comment.idPub;
    var admin = comment.writerAdmin==true?'<span class="adminColor font-weight-normal">(admin)':'';
    var avatar = '/img/avatars/'+comment.writerAvatar;
    var newComment = `<div class="publi"><div class="d-flex"><img src=${avatar} alt="avatar"><div><div class="d-flex flex-wrap"><p class="font-weight-bold mr-1 mb-0">${comment.writerPseudo} ${admin}</p><p class="font-italic mb-0">le ${comment.formattedDate}</p></div><p class="black mt-2">${comment.content}</p></div></div></div></div>`;
    $(`${idPub}>.comments`).append(newComment);
    $(idPub).find('.publiFooter>p:nth-child(2)>span:first-child').text(comment.nbComments+' commentaire(s)');
    var textArea = $(`${idPub} textarea`);
    textArea.val("");
    textArea.animate({
        height: "35px"
    },100, function(){
        $(this).val("");
    });
    textArea.next().hide();
});


//Notification Echec Success Actions
socket.on('feedbackNotif', function(msg){
    $('.alert').remove();
    $('h2').after('<div class="'+msg.class+'">'+msg.text+'</div>');
});

//disparition de la notif sur n'importe quel clic
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