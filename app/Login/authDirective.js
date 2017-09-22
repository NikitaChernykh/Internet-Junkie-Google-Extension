app.directive('authDerective',function(authService){
    return{
        link: function (scope,element,attrs,controller){ 
            console.log("authDerective loaded");
            firebase.auth().onAuthStateChanged(function(user) {
            if(user){
                console.log("User EXIST on changed: "+user);
                scope.authenticated = true;
                authService.authenticated = scope.authenticated;
                console.log(authService.authenticated);
                scope.$apply();
                chrome.runtime.sendMessage({action: "popup"});
            }else{
                console.log("user is NULLL on changed");
                scope.authenticated = false;
                authService.authenticated = scope.authenticated;
                console.log(authService.authenticated);
                scope.$apply();
                chrome.runtime.sendMessage({action: "popup"});
            }
                var user = firebase.auth().currentUser;
            if(user){
                console.log("User EXIST: "+user);
                scope.authenticated = true;
                authService.authenticated = scope.authenticated;
                console.log(authService.authenticated);
                chrome.runtime.sendMessage({action: "popup"});
            }else{
                console.log("user is NULLL");
                scope.authenticated = false;
                authService.authenticated = scope.authenticated;
                console.log(authService.authenticated);
                chrome.runtime.sendMessage({action: "popup"});
            }
        });
        }
    }
});
