
/********* INITIALISATION AFFICHAGE DU CHAT *********/
//Dimensionnement du chat pour que la zone de saisie soit toujours visible en bas de l'écran
sizeChat();
//Positionnement du scroll en bas de la zone de message
positionScroll();

//Appel du contructeur sockUtil pour initialiser l'url
var sockUtil = new sockUtil();
var socket = io(sockUtil.url);

// //Fonction a exécuter à chaque fois et une seule fois à l'arrivée sur la page
// //vérifier si newMessages, sinon enlever l'icon chat
(function(){
    if($('.indicator').length===0){
        $('#iconChat').attr('src','/img/nav/chat-30.png');
    }
}());


/********* MANIPULATION DU CHAT *********/
// Clic sur un ami de la liste
$('.itemFriend').click(function(){
    //effacer les messages courants.
    $('.messages').empty();

    // Récupération du pseudo de l'ami cliqué
    var pseudo = $(this).find('p>span').first().text();
    document.location.href="/discussions?p="+pseudo;
});

// Clic sur bouton Envoyer le message
$('.saisie button').click(function(){
    var message = $('#inputM').val().trim();
    if($(this).hasClass('disabled')||message===""){
        return;
    } else {
        $('#inputM').val("");
        var date = new Date();
        var formattedDateTime = formatDateTime(date);
        var discussion = {
            sender : $('.breadcrumb').attr('id'),
            receiver:$('.saisie>input').first().attr('id').trim(),
            message:message,
            new: 1,
            date: date,
            formatDateTime: formattedDateTime
        }
        socket.emit('sendMessage',discussion);
    }
});

// Affichage du message que je viens d'envoyer si je suis toujours sur le chat du receiver
socket.on('displayMessageSender',function(data){
    if($('.saisie>input').first().attr('id').trim()===data.receiver){
        addMessage(data.message,data.formatDateTime,true); 
        positionScroll();
    }
});

//affichage d'un message qu'on vient de m'envoyer
socket.on('displayMessageReceiver',function(data){
    //Si je suis le receveur 
    if($('.breadcrumb').attr('id')===data.receiver){
        //si le chat affiché est celui du sender
        if($('.saisie>input').first().attr('id').trim()===data.sender){
            addMessage(data.message,data.formatDateTime,false); 
            positionScroll();
            socket.emit('deleteNewMessage',data);
            return;
        }

        var sender = '#'+data.sender;
        //si le sender est dans la liste
        if($(sender).length){
            if($(sender).find('.indicator').length){
                $(sender).find('.indicator');
                var newMessages = parseFloat($(sender).find('.indicator').text())+1;
                $(sender).find('.indicator').text(newMessages);
            } else {
                $(sender).append('<div class="indicator">1</div>');
            }

        }
    }
});

// Bouton retour vers la liste pour les petits écrans
$('.backList').click(function(){
    $('.list').removeClass('listSelected');
    $('.itemFriend').removeClass('currentChat');

    $('.displaying').removeClass('displayingSelected');
    $('.displayingHeader').find('p').text('Choisissez un ami connecté pour discuter');
    $('.messages').children().remove();

    $('.saisie input').first().attr('id','');
    $('.saisie button').addClass('disabled');
});


/******  NOTIFICATIONS  *******/ 
// Réception et affichage d'une notif
socket.on('feedbackNotif', function(msg){
    $('.alert').remove();
    $('h2').after('<div class="'+msg.class+'">'+msg.text+'</div>');
});

// Disparition de la notif au clic de la souris
$('*').click(function(){
    $('.alert').remove();
});

/******* UN AMI VIENT DE ME SUPPRIMER DE SES AMIS *******/ 
socket.on('removedFriendShip',function(data){
    // traitement si c'est une suppression de l'admin
    if(data.admin){
        var pseudoRemoved = $('.breadcrumb').attr('id') === data.removedMember?data.removingMember:data.removedMember;

        // test sur removed
        if($('.breadcrumb').attr('id') === data.removedMember || $('.breadcrumb').attr('id') === data.removingMember){

            // Si le chat de l'ami supprimé est en consultation
            if($('.currentChat').length!=0 && $('.currentChat').attr('id')===pseudoRemoved){
                // on enlève le membre de la liste
                $('.itemFriend.currentChat').remove();

                // on supprime les message, et on désactive les contrôles
                $('.messages').children().remove();
                $('.displayingHeader').find('a').removeAttr('href').removeClass('pinkColor');
                $('.saisie>button').addClass('disabled')

                // on affiche une alerte persistante
                $('.messages').append(`<div class="alert alert-danger mt-2" role="alert">L'admin vient de supprimer votre relation avec ${pseudoRemoved}, vous ne pouvez plus discuter avec lui.</div>`);
            
            } else {
                // on enlève le membre de la liste
                $('#'+data.pseudoRemoved).remove();

                // on affiche une alerte non persistante
                var alert = `<div id="alertRelation" class="alert alert-primary" role="alert">L'admin vient de supprimer votre relation avec ${pseudoRemoved}, vous ne pouvez plus discuter avec lui.</div>`;
    
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
        }
    } 
     // traitement si c'est une suppression par un ami
    else {
        if($('.breadcrumb').attr('id')===data.removedMember){
            // Si le chat de l'ami supprimé est en consultation
            if($('.currentChat').length!=0 && $('.currentChat').attr('id')===data.removingMember){

                 // on enlève le membre de la liste
                 $('.itemFriend.currentChat').remove();

                 // on supprime les message, et on désactive les contrôles
                 $('.messages').children().remove();
                 $('.displayingHeader').find('a').removeAttr('href').removeClass('pinkColor');
                 $('.saisie>button').addClass('disabled')
 
                 // on affiche une alerte persistante
                 $('.messages').append(`<div class="alert alert-danger mt-2" role="alert">${data.removingMember} vient de supprimer votre relation, vous ne pouvez plus discuter avec lui.</div>`);
    
            } else {
                  // on enlève le membre de la liste
                $('#'+data.removingMember).remove();

                // on affiche une alerte non persistante
                var alert = `<div id="alertRelation" class="alert alert-primary" role="alert">${data.removingMember} vient de supprimer votre relation, vous ne pouvez plus discuter avec lui.</div>`;
    
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
        }
    }
});

/******* CONNEXIONS DECONNEXIONS AMIS *******/ 
//Un ami vient de se connecter
socket.on('memberLogged',function(session){
  var amiLogged = $('.itemFriend[id='+session.pseudo+']');
  if(amiLogged.length){
      var infoLog = amiLogged.find('.offline');
      infoLog.removeClass('offline');
      infoLog.addClass('inline');
  }  
})

//Un ami vient de se déconnecter
socket.on('memberLogout',function(pseudo){
    var amiLogout = $('.itemFriend[id="'+pseudo+'"]');
    if(amiLogout.length){
        var infoLog = amiLogout.find('.inline');
        infoLog.removeClass('inline');
        infoLog.addClass('offline');
    }  
  })

/******* APPEL DE FONCTIONS *******/ 
//Dimensionnement du chat pour que la zone de saisie soit toujours visible en bas de l'écran
function sizeChat(){
    var heightWindow = $(window).innerHeight();
    var positionChat = $('.contenairChat').offset().top;
    var heigthChat = (heightWindow - positionChat-5)+'px';
    $('.contenairChat').css('height',heigthChat);
    
    var heightSaisie = parseFloat($('.saisie').css('height'));
    var heightMessages = (heightWindow - positionChat-heightSaisie-10)+'px';

    $('.messages').css('height',heightMessages);
};

function positionScroll(){
    $(".messages").scrollTop($(".messages")[0].scrollHeight);
    //$('.messages').scrollTop($(window).innerHeight()*2);
}

function addMessage(message,date,you){
    var divSender=you?'<div class="message messageYou">':'<div class="message messageOther">'
    var newMessage=divSender+'<div class="messageContent"><p>'+message+'</p><p>'+date+'</p></div></div>';

    $('.messages').append(newMessage);
};

//Fonction qui Formate la date et l'heure du message reçu
function formatDateTime(date){
    var day = date.getDate();
    var month = date.getMonth()<9?'0'+(date.getMonth()+1):''+(date.getMonth()+1);
    var year = date.getFullYear();
    var hour = date.getHours()<10?'0'+date.getHours():date.getHours();
    var minute = date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes();

    var formattedDateTime = 'Le '+day+'/'+month+'/'+year+' à '+hour+":"+minute;
    return formattedDateTime;
};

//survey Alerts Friends
socket.on('alertRelation',function(data){
    if($('ol.breadcrumb').attr('id')===data.pseudo){
        
        if(data.type===1){
            var message = `${data.member} vient d'accepter votre invitation`;
            // ajouter le nouvel ami dans la liste du chat
            var newFriend = `<div id=${data.member} class="itemFriend"><div class="infoFriend"><div class="inline"></div><p class="font-weight-bold"><span>${data.member}</span></p>
            </div></div>`;
            $('.list').append(newFriend);
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




