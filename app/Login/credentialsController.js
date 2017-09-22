// Initialize Firebase
var config = {
     apiKey: "AIzaSyATPYL8AmU4Joh0TAxqcEFKsFCANmnSZBI",
     authDomain: "internt-junkie.firebaseapp.com",
     databaseURL: "https://internt-junkie.firebaseio.com",
     projectId: "internt-junkie",
     storageBucket: "internt-junkie.appspot.com",
     messagingSenderId: "673180643315"
   };
firebase.initializeApp(config);

(function () {
    app.controller('CredentialsController', function CredentialsController($scope, authService){
        $scope.authenticated = authService.authenticated;
        $scope.gauth = function(){
            authService.loginWithGoogle();
            $scope.authenticated = true;
            authService.authenticated = $scope.authenticated;
        }
    });
}());
