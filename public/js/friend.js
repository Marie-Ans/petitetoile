'use strict';


var socket = io('https://petitetoile.herokuapp.com/');
//var socket = io('http://localhost:8080');

// //Fonction a exécuter à chaque fois et une seule fois à l'arrivée sur la page
// //vérifier si newMessages
// (function(){
//     var pseudoReceiver = $('.breadcrumb').attr('id');
//     socket.emit('searchNewMessages',pseudoReceiver);
// }());



/*************** CONNEXIONS DECONNEXIONS AMIS ***************/ 
// l'ami vient de se connecter
socket.on('memberLogged',function(session){
    if(session.pseudo ===  $('.breadcrumb>li:last-child').attr('id')){
        var infoLog =  $('h2').find('.offline');
        infoLog.removeClass('offline');
        infoLog.addClass('inline');
    }
  })
  
  // L' ami vient de se déconnecter
  socket.on('memberLogout',function(pseudo){
    if(pseudo ===  $('.breadcrumb>li:last-child').attr('id')){
        var infoLog =  $('h2').find('.inline');
        infoLog.removeClass('inline');
        infoLog.addClass('offline');
    }
});

/*************** PUBLICATIONS DE l'AMI ***************/ 
//Verifier si une publication a été postée avec succès pour envoi info socket maj temps reelle page accueil, et envoi sur le mur des amis
(function(){
    var url = new URL(window.location);
    if(url.searchParams.get('r')!=null){
        var wallPseudo = $('.breadcrumb>li:last-child').attr('id');
        socket.emit('publiPostedOnAWall', wallPseudo);
    };
}());

///// Affichage / Masquage textarea
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
})

// Arrivée de nouvelles publis sur le mur de l'ami
socket.on('newPubliToDisplay',function(wallPseudo){
    if(wallPseudo ===  $('.breadcrumb>li:last-child').attr('id')){
        var newPubNotif = `<center><a class="font-weight-bold nav-link pinkColor p-0 m-0 deletePubli" href="/ami?p=${wallPseudo}" title="Afficher les dernieres publis arrivées">Nouvelles publis!...</a></center>`;
        $('h3').append(newPubNotif);
    }

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


//Supprimer une publication
$('.deletePubli').click(function(){
    var idPubli =  $(this).parent().parent().parent().attr('id');
    socket.emit('deletePubli',idPubli);
});

// Suppression de publis sur le mur de l'ami
socket.on('publiDeleted',function(idPubli){
    var idPub = '#'+idPubli;
    $(idPub).remove();
    $('h3').text("Publications : "+$('.publis>.publi').length);
});

//Montrer les commentaires de la publi
$('.showComments').click(function(){
    if( $(this).parent().parent().next().css('display')==='none'){
        $(this).parent().parent().next().show();
    } else {
        $(this).parent().parent().next().hide(); 
    }
});

//Publier un commentaire
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

//Mise à jour affichage commentaires après publi commentaire
socket.on('updateComments',function(comment){
    var idPub = '#'+comment.idPub;
    var admin = comment.writerAdmin==true?'<span class="adminColor font-weight-normal">(admin)':'';
    var avatar = '/img/avatars/'+comment.writerAvatar;
    var newComment = `<div class="publi"><div class="d-flex"><img src=${avatar}  alt="avatar"><div><div class="d-flex flex-wrap"><p class="font-weight-bold mr-1 mb-0">${comment.writerPseudo} ${admin}</p><p class="font-italic mb-0">le ${comment.formattedDate}</p></div><p class="black mt-2">${comment.content}</p></div></div></div></div>`;
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



/*************** PROFIL DE l'AMI ***************/ 
// Modif Statut
$('.validChangeStatut').click(function(){
    var adminStatut=$('.modal-body input').first().prop('checked')?false:true;
    var changeStatut = {
        memberPseudo : $('.breadcrumb>li').last().attr('id').trim(),
        statut : adminStatut
    }
    socket.emit('changeStatut',changeStatut);
    $('#modStatutModal').modal('hide')
});

//Mise a jour profil après retour serveur
socket.on('updateStatut', function(data){
    
    var statut = data.statut===true?'(admin)':'';

    //dans le breadcrumb
    $('.breadcrumb>li').last().text(`${data.memberPseudo} ${statut}`);

    //dans le h2
    $('h2>span').text(statut);

    //dans le profil
    var statut=data.statut==true?'Administrateur':'Membre';
    $('#labelStatut+span').text(statut);
});

/*************** LES AMIS DE L'AMI ***************/ 
// VOIR LA TOILE
// Je suis l'ami de l'ami et je veux voir ma toile
$('.seePubli').click(function(){
    document.location.href='/publications';
});

// Je veux voir la Toile d'un ami
$('.seeWeb').click(function(){
    document.location.href='/ami?p='+$(this).parent().parent().parent().parent().prev().attr('id').trim();
});

// LES AMIS DE L'AMI : INVITATION
// Inviter un ami de l'ami 
$('.inviteWeb').click(function(){
    if($(this).hasClass('inviteWeb')){
        var invitation = {
            idHost: $('.page-friends').attr('id'),
            idGuest: $(this).parent().parent().parent().parent().parent().attr('id'),
            type: 'm'
        };
        socket.emit('invite',invitation);
    }
});


// Mise a jour du membre après succès invitation
socket.on('updateAfterInvite', function(data){
    var idMember = '#'+data;
    var member = $(idMember);
    //bouton inviter inactif
    var inviteAction = member.find('p.dropdown-item.inviteWeb');
    inviteAction.removeClass('inviteWeb');
    inviteAction.addClass('gray');
    //info invité dans metaInfos
    var metaInfo = member.find('.metaInfo');
    metaInfo.append('<a class="font-italic" href="/amis/invitations" title="Voir les invitations">Invité</a>');
});


// LES AMIS DE L'AMI : ADMIN SUPPRIMER RELATION
// d'abord récupérer id
$('.deleteRelation').click(function(){
    var removeFrienship = {
        removingMember: $('.breadcrumb>li').last().attr('id').trim(),
        removedMember: $(this).parent().parent().parent().parent().prev().attr('id').trim(),
        removedMemberId: $(this).parent().parent().parent().parent().parent().attr('id'),
        nbFriends: $('.member').length,
        admin: true
    };
    socket.emit('removeFrienship', removeFrienship);
});

// Suppression du membre de la liste des amis après retour serveur requete
socket.on('updateRemovingAdmin', function(data){
    var removeMember = $(`.infoMember[id=${data.pseudoRemoved}]`);
    removeMember.parent().remove();
    $('h3').text('Amis : '+data.nbFriends);
});


//NOTIFICATIONS
// Réception et affichage d'une notif
socket.on('feedbackNotif', function(msg){
    $('.alert').remove();
    $('h2').after('<div class="'+msg.class+'">'+msg.text+'</div>');
});

// Disparition de la notif au clic de la souris
$('*').click(function(){
    $('.alert').remove();
});

//surveyChat
socket.on('iconChat',function(pseudo){
    if($('.breadcrumb').attr('id')===pseudo){
        $('#iconChat').attr('src','/img/nav/chat-new-30.png');
    }
});



// Un ami A vient d'être supprimé de la liste de B, MAJ ami si je suis sur le tab AMI et si AMI = A ou AMI = B
socket.on('updateRemoved', function(data){
    // Exécuter le code uniquement si on est sur le tab friend
    if($('#tabAmis').hasClass('active')){
        // Uniquement s'il s'agit des amis de A ou de B
        var pseudoFriend = $('.breadcrumb>li').last().attr('id');
        if(pseudoFriend === data.pseudoRemoving || pseudoFriend === data.pseudoRemoved){
            var removeMemberOne = $(`.infoMember[id=${data.pseudoRemoving}]`);
            removeMemberOne.parent().remove();
            var removeMemberTwo = $(`.infoMember[id=${data.pseudoRemoved}]`);
            removeMemberTwo.parent().remove();
        }
    }
});

// Un ami A de B vient d'être supprimé du réseau par l'admin
socket.on('memberDeleted', function(data){
    if($('#tabAmis').hasClass('active')){
        var memberToRemove = $(`.infoMember[id=${data.pseudo}]`);
        if($(memberToRemove).length){
            $(memberToRemove).parent().remove();
            var nbFriends = $('.member').length;
            $('h3').text('Amis : '+nbFriends);
            $('h3').before('<p id ="alertDeleting" class="alert alert-warning" role="alert">L\'admin vient de supprimer le membre '+data.pseudo+' du réseau Petite Toile');
            $('#alertDeleting').queue(function(){
            setTimeout(function(){
            $('#alertDeleting').dequeue();
            }, 3000 );
            });
            $('#alertDeleting').fadeOut("slow",function(){
                $('#alertDeleting').animate({
                    height: "0px"
                },1000,function(){
                    $('#alertDeleting').remove();
                })
            });  
        }
    }   
});


//survey Alerts Friends
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