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
    
    var CredentialsController = function ($scope, authService) {
        $scope.authenticated = authService.authenticated;
        $scope.placeholder_msg = chrome.i18n.getMessage("placeholder_msg");
        
        
        
        
        $scope.gauth = function(){
            authService.loginWithGoogle();
            $scope.authenticated = true;
            authService.authenticated = $scope.authenticated;
            $scope.$apply();
        }
    };
    //regsiter a controller in the module
    app.controller("CredentialsController", ["$scope", "authService", CredentialsController]);
}());
