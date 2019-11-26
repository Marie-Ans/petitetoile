exports.configMail = {
    service: 'gmail',
    auth: {
      user: 'petitetoile2019@gmail.com',
      pass: 'Toile_2510'
    },
    tls: {
      rejectUnauthorized: false
      }
  };

/*
0 : creation de compte generateCreateAccountText
1 : Mot de passe perdu
2 : Publication sur le mur
3 : Invitation
4 : Recommandation
5 : Invitation acceptée
*/

//0 
function generateCreateAccountText(data){
    let content = `<html><body>
    <p>Cher(e) ${data.fname} ${data.lname},</p>
    <p></p>
    <p>Je vous confirme la création de votre compte sur le réseau social La Petite Toile.</p>
    <p></p>
    <p><b>Pour vous connecter, utilisez vos identifiants : </b></p>
    <p><b>URL :</b> <a href='https://petitetoile.herokuapp.com/'>https://petitetoile.herokuapp.com/</a></p>
    <p><b>Pseudo :</b> ${data.pseudo}</p>
    <p><b>Mot de passe :</b> ${data.pwd}</p>
    <p></p>   
    <p>A très bientôt sur la Petite Toile.</p>
    <p>Marie Ans, administratice de La Petite Toile</p>
    </body></html>`;
    
    return {to:data.email, subject: 'Bienvenue sur La Petite Toile', html: content};
};

//1
function generateLostPwdText(data){
    let content = `<html><body>
    <p>Cher(e) ${data.fname} ${data.lname},</p>
    <p></p>
    <p>Veuillez trouver ci-dessous votre nouveau mot de passe.</p>
    <p>Pseudo : ${data.pseudo}</p>
    <p>Mot de passe : ${data.pwd}</p>
    <p></p>   
    <p>A très bientôt sur la Petite Toile : <a href='https://petitetoile.herokuapp.com/'>https://petitetoile.herokuapp.com/</a></p>
    <p>Marie Ans, administratice de La Petite Toile</p>
    </body></html>`;
    
    return {to:data.email, subject: 'Bienvenue sur La Petite Toile', html: content};
};

//2 
function generatePostPubliText(data){
    let content = `<html><body>
    <p>Cher(e) ${data.receiver.fname} ${data.receiver.lname},</p>
    <p></p>
    <p>${data.writerPseudo} a posté une publication sur votre mur.</p>
    <p><a href='https://petitetoile.herokuapp.com/'>Connectez-vous</a> à votre espace pour la consulter.</p>
    <p></p>   
    <p>A très bientôt sur la Petite Toile.</p>
    <p>Marie Ans, administratice de La Petite Toile</p>
    </body></html>`;
    
    return {to:data.receiver.email, subject: 'La Petite Toile : nouvelle publication', html: content};
};

// 3
function generateInvitationText(data){
    let content = `<html><body>
    <p>Cher(e) ${data.fname} ${data.lname},</p>
    <p></p>
    <p>${data.hostPseudo} vous a invité à rejoindre son réseau.</p>
    <p><a href='https://petitetoile.herokuapp.com/'>Connectez-vous</a> à votre espace pour voir l'invitation.</p>
    <p></p>   
    <p>A très bientôt sur la Petite Toile.</p>
    <p>Marie Ans, administratice de La Petite Toile</p>
    </body></html>`;
    
    return {to:data.email, subject: 'La Petite Toile : nouvelle invitation', html: content};
};

// 4
function generateRecommandationText(data){
    let content = `<html><body>
    <p>Cher(e) ${data.fname} ${data.lname},</p>
    <p></p>
    <p>${data.adviserPseudo} vous recommande ${data.recommandedPseudo} comme nouvel ami</p>
    <p><a href='https://petitetoile.herokuapp.com/'>Connectez-vous</a> à votre espace pour voir la recommandation.</p>
    <p></p>   
    <p>A très bientôt sur la Petite Toile.</p>
    <p>Marie Ans, administratice de La Petite Toile</p>
    </body></html>`;
    
    return {to:data.email, subject: 'La Petite Toile : nouvelle recommandation', html: content};
};

// 5
function generateAcceptDemandText(data){
    let content = `<html><body>
    <p>Cher(e) ${data.fname} ${data.lname},</p>
    <p></p>
    <p>${data.pseudoGuest} a accepté votre invitation</p>
    <p><a href='https://petitetoile.herokuapp.com/'>Connectez-vous</a> à votre espace pour échanger avec votre nouvel ami.</p>
    <p></p>   
    <p>A très bientôt sur la Petite Toile.</p>
    <p>Marie Ans, administratice de La Petite Toile</p>
    </body></html>`;
    
    return {to:data.email, subject: 'La Petite Toile : nouvelle recommandation', html: content};
};

exports.setOptions = function(type, data){
    let options;
    switch (type) {
        case 0 : 
            options = generateCreateAccountText(data);
            break;
        case 1 : 
            options = generateLostPwdText(data);
            break;
        case 2 : 
            options = generatePostPubliText(data);
            break;
        case 3 : 
            options = generateInvitationText(data);
            break;
        case 4 :
            options = generateRecommandationText(data);
            break;
        case 5 :
            options = generateAcceptDemandText(data);
            break;
    };
    return {
        from: 'petitetoile2019@gmail.com',
        to: options.to,
        subject: options.subject,
        html: options.html
    };
};

