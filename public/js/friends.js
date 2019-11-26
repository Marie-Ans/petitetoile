'use strict';

//Appel du contructeur sockUtil pour initialiser l'url
var sockUtil = new sockUtil();
var socket = io(sockUtil.url);


/***************** CONNEXIONS DECONNEXIONS AMIS *****************/ 
//Un ami vient de se connecter
socket.on('memberLogged',function(session){
    var amiLogged = $('.member[id='+session.pseudo+']');
    if(amiLogged.length){
        var infoLog = amiLogged.find('.offline');
        infoLog.removeClass('offline');
        infoLog.addClass('inline');
    }  
  })
  
  //Un ami vient de se déconnecter
  socket.on('memberLogout',function(pseudo){
    var amiLogout = $('.member[id='+pseudo+']');
    if(amiLogout.length){
        var infoLog = amiLogout.find('.inline');
        infoLog.removeClass('inline');
        infoLog.addClass('offline');
    }  
})



/***************** SURVEILLANCE NEW CHAT *****************/ 
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




/***************** ACTIONS TAB AMIS *****************/ 

// Voir la Toile d'un ami
$('.dropdown-item.seeWeb').click(function(){
    var pseudo = $(this).parent().parent().parent().parent().parent().attr('id');
    document.location.href="/ami?p="+pseudo;
});

// Charger la liste des amis recommandables
$('.dropdown-item.recommand').click(function(){
    var idModale = $(this).attr('data-target');
    var recherche = idModale+'.modal';
    var modale = $(recherche);
    var selection = modale.find('select');
    var options =  selection.find('option:gt(0)');
    options.remove();
    
    var pseudoUser = $('.breadcrumb').first().text().trim();
    var pseudoFriend = selection.attr('name').trim();
    $.ajax({
        url: "/amis/recommandations",
        method: "POST",
        data: {pseudoUser:pseudoUser, pseudoFriend:pseudoFriend},
        success: function(data) {
          options.remove();
          data.forEach(function(friend){
            if(friend.display === true){
                selection.append('<option name='+pseudoFriend+' value='+friend.pseudo+'>'+friend.pseudo);
            }
            if(friend.display === false){
                selection.append('<option name='+pseudoFriend+' value='+friend.pseudo+' disabled>'+friend.pseudo);
            }
          })

        },
        error: function(error) {
          console.log(error);
        }
      });
});

// Recommander à un ami
$('.recomBtn').click(function(){
    var targetFriend = $(this).parent().parent().find('select option:selected');
    if (targetFriend.attr('value')!=""){
        var recommandation = {
            adviserMember: $('ol.breadcrumb').attr('id').trim(),
            recommandedMember: targetFriend.attr('name').trim(),
            advisedMember: targetFriend.attr('value').trim()
        };
        socket.emit('recommandFriend',recommandation);
    }
});

// Supprimer un ami
$('.dropdown-item.remove').click(function(){
    var removeFrienship = {
        removingMember : $('.breadcrumb').attr('id').trim(),
        removedMember : $(this).parent().parent().parent().parent().prev().find('p:nth-child(2)').text().trim(),
        nbFriends: $('.member').length
    }
    socket.emit('removeFrienship', removeFrienship);
});




/***************** ACTIONS TAB DEMANDES *****************/ 

// Accepter une demande d'ajout Amis
$('.acceptDemand').click(function(){
    var acceptedDemand = {
        idGuest: $('.page-friends').attr('id'),
        idHost : $(this).parent().parent().parent().attr('id'),
        nbDemands: $('.member').length
    }
    socket.emit('acceptDemand', acceptedDemand);
});

// Refuser une demande d'ajout Amis
$('.refuseDemand').click(function(){
    var deniedDemand = {
        idGuest: $('.page-friends').attr('id'),
        idHost : $(this).parent().parent().parent().attr('id'),
        nbDemands: $('.member').length
    }
    socket.emit('refuseDemand', deniedDemand);
});



/***************** ACTIONS TAB RECOMMANDATIONS *****************/ 

// Inviter un membre recommandé par un ami
$('.acceptRecommandation').click(function(){
    var invitation = {
        idHost: $('.page-friends').attr('id').trim(),
        idGuest: $(this).parent().parent().parent().attr('id'),
        type: 'f'
    };
    socket.emit('invite',invitation);
});

// Refuser une demande d'ajout Amis
$('.refuseRecommandation').click(function(){
    var recommandation = {
        idAdvised: $('.page-friends').attr('id'),
        idRecommanded: $(this).parent().parent().parent().attr('id')
    };
    socket.emit('refuseRecommandation', recommandation);
});


/***************** UPDATE TABS AND LISTES APRES RETOUR SERVEUR *****************/ 

// SUPPRESSION AMI : MAJ LISTE FRIENDS ET MAJ TAB FRIENDS(-1)
socket.on('updateRemoving', function(data){
    var idPseudo = '#'+data.pseudo;

    //suppression du membre dans la liste des amis
    $(idPseudo).remove();

    if($('.member').length < 1){
        //tabToNormal(1);
        $('#nbFriends').text('');
        $('h3').text('Vous n\'avez pas encore d\'amis');
    } else {
        $('#nbFriends').text(data.nbFriends);
    }
});


// J'AI ETE SUPPRIME EN TANT QU'AMI : MAJ LISTE FRIENDS ET MAJ TAB FRIENDS(-1)
socket.on('updateRemoved', function(data){

    // Exécuter le code uniquement si'il s'agit de moi
    if(data.pseudoRemoved === $('.breadcrumb').attr('id')){

        // MAJ TAB NB AMIS
        decreaseFromString($('#nbFriends'));

        // SI TAB AMIS EN CONSULTATION
        if(data.admin){
            var message = `L'admin vient de supprimer votre relation avec ${data.pseudoRemoving}`;
        } else {
            var message = `${data.pseudoRemoving} vient de supprimer votre relation`;
        }
        $('#'+data.pseudoRemoving).remove();
        $('h3').before('<p class="alert alert-warning" role="alert">'+message+'</p>');
        if($('.member').length < 1){
            $('h3').text('Vous n\'avez pas encore d\'amis');
        }
    }
});

// L'ADMIN A SUPPRIME UN MEMBRE DU RESEAU, SUPPRESSION DE MES AMIS ET ALERTS SI TAB AMIS
socket.on('memberDeleted', function(data){

    deleteMemberDuringConsultation('#nbFriends',data.pseudo,data.pseudo);
    deleteMemberDuringConsultation('#nbInvits',data.pseudo,data.pseudo);
    deleteMemberDuringConsultation('#nbDemands',data.id,data.pseudo);
    deleteMemberDuringConsultation('#nbRecoms',data.id,data.pseudo);
});


// DEMANDE ACCEPTEE OU IGNOREE : MAJ LISTE DEMANDES, MAJ TAB DEMANDS(-1), MAJ TAB FRIENDS(+1 si demande ok)
socket.on('updateDemands', function(data){
    var idHost = '#'+data.idHost;

    // MAJ DES DEMANDES
    $(idHost).remove();

    if(data.nbDemands === 0){
        $('#nbDemands').text('');
        $('h3').text('Aucune demande pour le moment');
    } else {
        $('#nbDemands').text(data.nbDemands);
    }

    // MAJ TAB AMIS SI DEMANDE ACCEPTEE
    if(data.accepted){
        increaseFromString($('#nbFriends'));
    }
});



// RECOMMANDATION ACCEPTEE : MAJ LISTE RECOS(-1), MAJ TAB RECOS(-1), MAJ TAB INVITS(+1)
socket.on('updateAfterInvite', function(data){
    var idGuest = '#'+data;

    // MAJ DES RECOS
    $(idGuest).remove();

    if($('.member').length < 1){
        $('#nbRecoms').text('');
        $('h3').text('Aucune recommandation pour le moment');
    } else {
        $('#nbRecoms').text(('.member').length);
    }

    increaseFromString($('#nbInvits'));
});



// RECOMMANDATION IGNOREE : MAJ LISTE RECOS(-1), MAJ TAB RECOS(-1)
socket.on('deleteRecom', function(data){
    var idGuest = '#'+data;

    // MAJ DES RECOS
    $(idGuest).remove();

    if($('.member').length < 1){
        $('#nbRecoms').text('');
        $('h3').text('Aucune recommandation pour le moment');
    } else {
        $('#nbRecoms').text(('.member').length);
    }
});



// QUELQU UN M'A INVITE : MAJ TAB DEMANDES(+1), MAJ LISTE DEMANDS SI CONSULTATION
socket.on('updateFriendAfterInvite',function(invitation){

   // Exécuter le code uniquement si c'est moi qui a été invité

    if(invitation.guest.pseudo===$('.breadcrumb').attr('id')){
        
        increaseFromString($('#nbDemands'));
       
        // SI DEMANDES EN CONSULT, ALERTE
        if($('#nbDemands').parent().parent().hasClass('active')){
            $('h3').before('<p class="alert alert-info" role="alert">Nouvelle demande : <a class="pinkColor" href="/amis/demandes">Cliquez ici pour actualiser</a></p>');
        }    
    }
});

// QUELQU UN A ACCEPTE MON INVITATION  : MAJ TAB INVITS(+1), MAJ LISTE INVITS SI CONSULTATION
socket.on('updateFriendAfterAccept',function(invitation){
   
    // Exécuter le code uniquement si'il s'agit de moi
    if(invitation.pseudoHost === $('.breadcrumb').attr('id')){

        // MAJ TAB INVITATIONS
        decreaseFromString($('#nbInvits'));


         // SI INVITATIONS EN CONSULT, ALERTE
         if($('#nbInvits').parent().parent().hasClass('active')){
            var idInvitation = '#'+invitation.pseudoGuest;
            $(idInvitation).remove();
            if($('#nbInvits').parent().parent().hasClass('active')){
                $('h3').before(`<p class="alert alert-info" role="alert">${invitation.pseudoGuest} a accepté votre invitation !</p>`);
            }
        }

        // MAJ TAB AMIS
        increaseFromString($('#nbFriends'));

        // SI AMIS EN CONSULT, ALERTE
        if($('#nbFriends').parent().parent().hasClass('active')){
            $('h3').before('<p class="alert alert-info" role="alert">Un nouvel ami a accepté votre demande : <a class="pinkColor" href="/amis">Cliquez ici pour actualiser</a></p>');
        } 
    }
});



/***************** NOTIFICATIONS *****************/ 
// Réception et affichage d'une notif
socket.on('feedbackNotif', function(msg){
    $('h2').after('<div class="'+msg.class+'">'+msg.text+'</div>');
});

// Disparition de la notif au clic de la souris
$('*').click(function(){
    $('.alert').remove();
});



/***************** FONCTIONS POUR MAJ LISTE ET TABS *****************/ 
function tabToBold(tab){
    var liSelector=`li.nav-item:nth-child(${tab})`;
    var navItem = $('.page-friends').find(liSelector);
    navItem.removeClass('font-weight-normal');
    navItem.addClass('font-weight-bold');
};

function tabToNormal(tab){
    var liSelector=`li.nav-item:nth-child(${tab})`;
    var navItem = $('.page-friends').find(liSelector);
    navItem.removeClass('font-weight-bold');
    navItem.addClass('font-weight-normal');
};

function increaseFromString(idNb){
    var strQte = idNb.text();
    strQte===""?idNb.text('1'):idNb.text((parseFloat(strQte)+1));
};

function decreaseFromString(idNb){
    var strQte = idNb.text();
    strQte==="1"?idNb.text(''):idNb.text((parseFloat(strQte)-1));
    return $(idNb).text();
};


function deleteMemberDuringConsultation(rubrique,info,pseudo){
    if($(rubrique).parent().parent().hasClass('active')){
        var memberToRemove = '#'+info;
        if($(memberToRemove).length){
            $(memberToRemove).remove();
            decreaseFromString($(rubrique));
            $('h3').before('<p id ="alertDeleting" class="alert alert-warning" role="alert">L\'admin vient de supprimer le membre '+pseudo+' du réseau Petite Toile');
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
}