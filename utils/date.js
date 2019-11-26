const months = {
    0: "Janvier",
    1: "Février",
    2: "Mars",
    3: "Avril",
    4: "Mai",
    5: "Juin",
    6: "Juillet",
    7: "Aout",
    8: "Septembre",
    9: "Octobre",
    10: "Novembre",
    11: "Décembre"
};


exports.formatDate = function(date){
    let day = date.getDate();
    let month = months[date.getMonth()];
    let year = date.getFullYear();

    let formattedDate = day+' '+month+' '+year;
    return formattedDate;
};


exports.formatDateShort = function(date){
    let day = date.getDate();
    let month = date.getMonth()<9?'0'+(date.getMonth()+1):''+(date.getMonth()+1);
    let year = date.getFullYear();

    let formattedDate = day+'/'+month+'/'+year;
    return formattedDate;
};

exports.formatDateTime = function(date){
    let day = date.getDate();
    let month = date.getMonth()<9?'0'+(date.getMonth()+1):''+(date.getMonth()+1);
    let year = date.getFullYear();
    let hour = date.getHours()<10?'0'+date.getHours():date.getHours();
    let minute = date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes();

    let formattedDateTime = 'Le '+day+'/'+month+'/'+year+' à '+hour+":"+minute;
    return formattedDateTime;
};