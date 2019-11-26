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

$('#modify').click(function(){
    $(this).hide();
    $('#modifyPwd').hide();
    $('.infoProfile').hide();
    $('#cancel').removeClass('d-none');
    $('#validate').removeClass('d-none');
    $('.modifProfile').removeClass('d-none');
});

$('#cancel').click(function(){
    document.location.reload(true);
})


var formProfile = new formUtils();
formProfile.hideErrorRequired();


$('#formProfile').submit(function(e){
    formProfile.hideErrors();
    formProfile.valid = true;
    formProfile.checkPseudo($('#pseudo'));
    //formProfile.checkPwd($('#pwd'));
    formProfile.checkEmail($('#email'));
    formProfile.checkName($('#lname'));
    formProfile.checkName($('#fname'));
    formProfile.checkDate($('#birthday'));
    //formProfile.checkFileAvatar($('#fileavatar'),formProfile.avatar);
    if(!formProfile.valid){
        formProfile.showGeneralError("Le formulaire comporte des erreurs");
        e.preventDefault();
        return;
    }
});

$('.validChangePwd').click(function(e){
    $('p.red').remove();
    if($('#pwdToChange').val()===$('#pwdToChangeAgain').val()){
        if($('#pwdToChange').val()===""){
            $('.modal-body').append('<p class="red">Vous n\'avez pas saisi de mot de passe</p>');
            return;
        }
        if($('#pwdToChange').val().length<8 || $('#pwdToChange').val().length>12){
            $('.modal-body').append('<p class="red">Taille : entre 8 et 12 caractères</p>');
        }

        if(!((/\d+/).test($('#pwdToChange').val()))){
            $('.modal-body').append('<p class="red">Format : doit contenir au moins 1 chiffre</p>');
            return;
        }

        let changePwd = {
            idMember : $('.breadcrumb>li').first().attr('id'),
            newPwd : $('#pwdToChange').val()
        }
        socket.emit('changePwd',changePwd);
        $('#chPwdModal').modal('hide');
    } else {
        $('.modal-body').append('<p class="red">Les deux mots de passe saisis sont différents</p>');
    }
});

// GESTION AVATAR //

//A l'ouverture, options unchecked, aucun fichier, supressions messages erreurs
$('#chooseAvatar').click(function(){
    $('p.red').remove();
    var file = document.querySelector("input[type=file]");
    file.value="";
});

//Vérifier qu'une image a bien été choisie avant de soumettre le formulaire4
$('#validChangeAvatar').click(function(e){
    $('p.red').remove();

    //Récupération du fichier choisi
    var fileInput = document.querySelector("input[type=file]");
    var file = fileInput.files[0];

    //si file is undefined, alors pas de fichier sélectionné
    if(!file){
        e.preventDefault();
        $('.modal-body').append('<p class="red">Vous n\'avez pas choisi d\'image</p>');
        return;
    }

    //Vérification du type 
    var allowedTypes = ['jpg','jpeg','png'];
    var extension = (file.name).split('.')[1];
    if(allowedTypes.indexOf(extension)===-1){
        e.preventDefault();
        $('.modal-body').append('<p class="red">Seuls les format jpeg et png sont acceptés</p>');
        return;
    }

    //vérification de la taille qui doit etre <1Mo soit 1048576 octets
    if(file.size>1048576){
        e.preventDefault();
        $('.modal-body').append('<p class="red">La taille du fichier ne doit pas dépasser 1Mo</p>');
        return;
    }
    //si on arrive là, c'est que le fichier est valide, on peut l'uploader
})


// formRegistration.checkFileAvatar($('#fileavatar'),formRegistration.avatar);

//NOTIFICATIONS
// Réception et affichage d'une notif
socket.on('feedbackNotif', function(msg){
    document.getElementById("modifyPwd").focus({preventScroll:false});
    $(window).scrollTop(0);
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