var AUTH_EVENTS = require('../../app/Login/authEventsConstant');
var APP_VIEWS = require('../../app/Login/appViewsConstant');

module.exports = function(AUTH_EVENTS,APP_VIEWS) {

  var signOut = function() {
      firebase.auth().signOut().then(function() {
          console.log(AUTH_EVENTS.logoutSuccess);
      }).catch(function(error) {
          console.error("Sign-out error",error);
      });
  };

  var loginWithGoogle = function(interactive){
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
                  loginWithGoogle(interactive);
                });
              }
            });
          } else {
            console.error('The OAuth Token was null');
          }
        });
  };
  var view = APP_VIEWS.homeView;
  return{
      view: view,
      signOut: signOut,
      loginWithGoogle : loginWithGoogle
 };
};
