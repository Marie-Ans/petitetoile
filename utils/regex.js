exports.buildRegex = function(dataString){
    if (dataString === ''){
        return '.*';
    } else {
        return '^'+dataString;
    }
}