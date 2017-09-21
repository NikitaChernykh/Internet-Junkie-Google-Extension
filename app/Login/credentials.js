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
        
        firebase.auth().onAuthStateChanged(function(user) {
            if(user){
                console.log("User EXIST on changed: "+user);
                $scope.authenticated = true;
                authService.authenticated = $scope.authenticated;
                console.log(authService.authenticated);
                $scope.$apply();
                chrome.runtime.sendMessage({action: "popup"});
            }else{
                console.log("user is NULLL on changed");
                $scope.authenticated = false;
                authService.authenticated = $scope.authenticated;
                console.log(authService.authenticated);
                $scope.$apply();
                chrome.runtime.sendMessage({action: "popup"});
            }
        });
        
        var user = firebase.auth().currentUser;
        if(user){
            console.log("User EXIST: "+user);
            $scope.authenticated = true;
            authService.authenticated = $scope.authenticated;
            console.log(authService.authenticated);
            chrome.runtime.sendMessage({action: "popup"});
        }else{
            console.log("user is NULLL");
            $scope.authenticated = false;
            authService.authenticated = $scope.authenticated;
            console.log(authService.authenticated);
            chrome.runtime.sendMessage({action: "popup"});
        }
        
        $scope.gauth = function(){
            authService.loginWithGoogle();
            $scope.authenticated = true;
            authService.authenticated = $scope.authenticated;
        }
    };
    //regsiter a controller in the module
    app.controller("CredentialsController", ["$scope", "authService", CredentialsController]);
}());
