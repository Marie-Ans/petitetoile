const alphanum = 'abcdefghijknopqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ12345679';

function getRandomInt (min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
};

function hasNumber (tempPwd){
    for(let i=0;i<tempPwd.length;i++){
        if (!isNaN(tempPwd[i])){
            return true;
        }
    }
    return false;
}

function insertNumber (tempPwd){
    let tempPwdArray = tempPwd.split('');
    const randomRange = getRandomInt(1,tempPwd.length);
    const randomNumber = getRandomInt(1,10);
    tempPwdArray[randomRange]=randomNumber;
    return tempPwdArray.join('');
}

exports.generatePwd = function(){
    const lengthPwd = getRandomInt(8,13);
    var tempPwd='';
    for(let i=0;i<lengthPwd;i++){
        tempPwd+=alphanum.charAt(getRandomInt(1,alphanum.length));
    }
    if(hasNumber(tempPwd)){
        return tempPwd;
    } else {
        return insertNumber(tempPwd);
    }
}
