
// Consctructeur utilisé dans les pages contenant un formulaire : vérification des informations saisies et feedback
function formUtils(){
    this.labels = {
        required: 'Information requise',
        pseudo: 'De 3 à 12 caractères sans espace ni accents)',
        pwd : 'De 8 à 12 caractères sans espace, ni accent, et dont au moins 1 chiffre',
        names : 'Format invalide',
        email : 'Format d\'email invalide'
    };
    this.avatar= null,
    this.freePseudo=false,
    this.valid = true;
};

// Check pseudo
formUtils.prototype.checkPseudo = function(pseudo){

    if(pseudo.val()===""){
        this.showErrorRequired('#'+pseudo.attr('id')+'Msg');
        this.valid=false;
        return;
    } 

    if(!((/^[a-zA-Z\d\-\_]{3,12}/).test(pseudo.val()))){
        var fieldError = '#'+pseudo.attr('id')+'Msg';
        $(fieldError).text(this.labels.pseudo).show();
        this.valid=false;
        return;
    }
};

// Check pwd
formUtils.prototype.checkPwd = function(pwd){
    if(pwd.val()===""){
        this.showErrorRequired('#'+pwd.attr('id')+'Msg');
        this.valid=false;
        return;
    }
    
    if(pwd.val().length<8 || pwd.val().length>12 ===""){
        var fieldError = '#'+pwd.attr('id')+'Msg';
        $(fieldError).text(this.labels.pwd).show();
        this.valid=false;
        return;
    }

    if(!((/^\w{8,12}/).test(pwd.val())) || !((/\d+/).test(pwd.val())) ){
        var fieldError = '#'+pwd.attr('id')+'Msg';
        $(fieldError).text(this.labels.pwd).show();
        this.valid=false;
        return;
    }
}

// Check email
formUtils.prototype.checkEmail = function(email){
    if(email.val()===""){
        this.showErrorRequired('#'+email.attr('id')+'Msg');
        this.valid=false;
        return;
    }
    
    if(!(/^[a-z0-9\-_\.]+@[a-z0-9]+\.[a-z]{2,5}$/.test(email.val())) ){
        var fieldError = '#'+email.attr('id')+'Msg';
        $(fieldError).text(this.labels.email).show();
        this.valid=false;
        return;
    }
}

// Check name (lastname, firstname)
formUtils.prototype.checkName = function(name){
    if(name.val()===""){
        this.showErrorRequired('#'+name.attr('id')+'Msg');
        this.valid=false;
        return;
    }

    if(!(/^[a-zA-ZÀ-ÖØ-öø-ÿœŒ\s\-\_]+$/.test(name.val()))
        || (/\-{2,}/.test(name.val()))
        || (/\_{2,}/.test(name.val()))
        || (/^(\_|\-)/.test(name.val()))
        || (/(\_|\-)$/.test(name.val()))
        || (/^\s+$/.test(name.val()))
    ){
        var fieldError = '#'+(name.attr('id'))+'Msg';
        $(fieldError).text(this.labels.names).show();
        this.valid=false;
        return;
    }
}

// Check birthday 
formUtils.prototype.checkDate = function(date){
    if(date.val()===""){
        this.showErrorRequired('#'+date.attr('id')+'Msg');
        this.valid=false;
        return;
    }
}

// Check avatar
formUtils.prototype.checkFileAvatar = function(fieldAvatar, fileAvatar){
    if(fileAvatar){
        formRegistration.hideErrors();
        var imgType = fileAvatar.name.split('.');
        var type = (imgType[1]).toLowerCase();
        var allowedTypes = ["jpg","jpeg","png"];
        if (allowedTypes.indexOf(type)===-1){
            this.valid=false;
            $("#fileavatar").val('');
            return fieldAvatar.after('<span class="lab-error error">Les formats acceptés sont : jpg et png</span>');
        }
        if(fileAvatar.size > 5000){
            this.valid=false;
            $("#fileavatar").val('');
            return fieldAvatar.after('<span class="lab-error error">Cette image est trop lourde</span>');
        }
    }
};


// SHOW HIDE ERRORS

// Show local error: style and tags
// formUtils.prototype.showErrorRequired = function(field){
//     field.addClass('input-error');
//     field.after('<span class="lab-error error">'+this.labels.required+'</span>');
// };

formUtils.prototype.showErrorRequired = function(fieldError){
    $(fieldError).text(this.labels.required).show();
};

formUtils.prototype.hideErrorRequired = function(fieldError){
    $('small').hide();
};


formUtils.prototype.showGeneralError = function(error){
    $('form').before('<div class="alert alert-danger" role="alert">Le formulaire comporte des erreurs</div>');
};

formUtils.prototype.hideErrors = function(){
    $('small').hide();
    $('.alert').remove();
};





