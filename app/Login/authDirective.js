app.directive('authDerective',function(authService){
    return{
        link: function (scope,element,attrs,controller){
            //on state change
            firebase.auth().onAuthStateChanged(function(user) {
              if(user){
                  scope.authenticated = true;
              }else{
                  scope.authenticated = false;
              }
              authService.authenticated = scope.authenticated;
              scope.$apply();
              chrome.runtime.sendMessage({action: "popup"});
            });
            //first load
            var user = firebase.auth().currentUser;
            if(user){
                scope.authenticated = true;
                authService.authenticated = scope.authenticated;
                chrome.runtime.sendMessage({action: "popup"});
            }else{
                scope.authenticated = false;
                authService.authenticated = scope.authenticated;
                chrome.runtime.sendMessage({action: "popup"});
            }
        }
    }
});
