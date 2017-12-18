var APP_VIEWS = require('../../app/Login/appViewsConstant');

module.exports = function(authService,APP_VIEWS) {
  return{
      link: function (scope,element,attrs,controller){
          //on state change
          firebase.auth().onAuthStateChanged(function(user) {
            if(user){
                scope.view = APP_VIEWS.homeView;
                writeUserData(user.uid,user.displayName,user.email,user.photoURL);
            }else{
                scope.view = APP_VIEWS.loginView;
            }
            authService.view = scope.view;
            scope.$apply();
            chrome.runtime.sendMessage({action: "popup"});
          });

          function writeUserData(userId, name, email, imageUrl) {

            database.ref('users/' + userId).set({
              username: name,
              email: email,
              profile_picture : imageUrl
            });
          }
          // //first load
          // var user = firebase.auth().currentUser;
          // console.log("first load of auth directive happen");
          // if(user){
          //     scope.authenticated = true;
          //     authService.authenticated = scope.authenticated;
          //     chrome.runtime.sendMessage({action: "popup"});
          //     //writeUserData(user.uid,user.displayName,user.email,user.photoURL);
          // }else{
          //     scope.authenticated = false;
          //     authService.authenticated = scope.authenticated;
          //     chrome.runtime.sendMessage({action: "popup"});
          // }
      }
  }
};
