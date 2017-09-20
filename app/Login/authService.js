'use strict';

app.factory('authService', function(AUTH_EVENTS){
   return{
        authenticated: false,
        signOut: function() {
            firebase.auth().signOut().then(function() {
                console.log(AUTH_EVENTS.logoutSuccess);
            }).catch(function(error) {
                console.error("Sign-out error",error);
            });
        }
   }; 
});  