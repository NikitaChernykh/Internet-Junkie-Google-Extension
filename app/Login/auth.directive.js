const APP_VIEWS = require('../../app/Shared/constants/app-views.constant');

module.exports = function(authService, APP_VIEWS) {
  return {
    link(scope, element, attrs, controller) {
      // on state change
      firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          scope.view = APP_VIEWS.homeView;
          writeUserData(user.uid, user.displayName, user.email, user.photoURL);
        } else {
          scope.view = APP_VIEWS.loginView;
        }
        authService.view = scope.view;
        scope.$apply();
        // chrome.runtime.sendMessage({action: "popup"});
      });

      function writeUserData(userId, name, email, imageUrl) {
        database.ref(`users/${  userId}`).set({
          username: name,
          email,
          profile_picture: imageUrl,
        });
      }
    },
  };
};
