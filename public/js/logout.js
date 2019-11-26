'use strict';
window.onload = function () {
    var socket = io('https://petitetoile.herokuapp.com/');
    //var socket = io('http://localhost:8080');
    var disconnectBtn = document.querySelector('header>nav>a.nav-link[href="/deconnexion"]');
    if(disconnectBtn){
        disconnectBtn.addEventListener("click",function(event){
            socket.emit('logout',$('.breadcrumb').attr('id'));
        });
    }
};