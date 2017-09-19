'use strict';

app.factory('authService', function(){
   return{
        authenticated: false,
        signOut: function() {
            firebase.auth().signOut().then(function() {
                console.log("Sign-out successful");
            }).catch(function(error) {
                console.error("Sign-out error",error);
            });
        }
   }; 
});