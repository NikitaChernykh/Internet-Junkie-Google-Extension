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
            startAuth(true);
            $scope.authenticated = true;
            authService.authenticated = $scope.authenticated;
        }
        function startAuth(interactive) {
          // Request an OAuth token from the Chrome Identity API.
          chrome.identity.getAuthToken({interactive: !!interactive}, function(token) {
            if (chrome.runtime.lastError && !interactive) {
              console.log('It was not possible to get a token programmatically.');
            } else if(chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
            } else if (token) {
              // Authrorize Firebase with the OAuth Access Token.
              var credential = firebase.auth.GoogleAuthProvider.credential(null, token);
              firebase.auth().signInWithCredential(credential).catch(function(error) {
                // The OAuth token might have been invalidated. Lets' remove it from cache.
                if (error.code === 'auth/invalid-credential') {
                  chrome.identity.removeCachedAuthToken({token: token}, function() {
                    startAuth(interactive);
                  });
                }
              });
            } else {
              console.error('The OAuth Token was null');
            }
          });
        }
    };
    //regsiter a controller in the module
    app.controller("CredentialsController", ["$scope", "authService", CredentialsController]);
}());
