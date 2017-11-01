'use strict';
var angular = require('angular');
var moment = require('moment');



//browserify ./app/Popup/popupController.js -o ./app/Popup/popupBundle.js



// websiteList.sort(function (a, b) {
//     return b.websiteVisits - a.websiteVisits;
// });

(function () {
    var websiteList = [];
    chrome.storage.local.get("websiteList", function(data){
      websiteList = data.websiteList;
    });
    var app = angular.module("internetJunkie", []);
    //config for overwriting whitelist ex: for img path
    app.config(['$compileProvider',function ($compileProvider) {
          //  Default imgSrcSanitizationWhitelist: /^\s*((https?|ftp|file|blob):|data:image\/)/
          //  chrome-extension: will be added to the end of the expression
          $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob|chrome-extension):|data:image\/)/);
        }
    ]);
    app.controller('CredentialsController', function CredentialsController($scope, authService){
        $scope.authenticated = authService.authenticated;
        $scope.gauth = function(){
            authService.loginWithGoogle(true);
            $scope.authenticated = true;
            authService.authenticated = $scope.authenticated;
        }
    });
    app.controller('OptionsController', function OptionsController($scope){
      $scope.websites = websiteList;
      $scope.blackList = blackList;
      //clear all website list
      $scope.clearAll = function(){
        var c = confirm("Are you sure you want to delete all the websites?");
        if(c){
          $scope.websites.length = 0;
        }
        return;
      };
    });
    app.controller('MainController', function MainController($scope, authService){

        $scope.websites = websiteList;




        //descending sort order
        $scope.sortOrder = "-websiteVisits";
        $scope.authenticated = authService.authenticated;

        //_locales text that translates
        $scope.table_header_text = chrome.i18n.getMessage("table_header_text");
        $scope.websites_label = chrome.i18n.getMessage("websites_label");
        $scope.visits_label = chrome.i18n.getMessage("visits_label");
        $scope.time_label = chrome.i18n.getMessage("time_label");
        $scope.placeholder_msg = chrome.i18n.getMessage("placeholder_msg");

        //sort & color change on order toggle
        $scope.sortToggle = function (order) {
            //track website sorting event
            _gaq.push(['_trackEvent', order, 'listSorted']);

            if (order == "websiteVisits") {
                $scope.ascStyle = {fill: "#ffffff"};
                $scope.desStyle = {fill: "#22d8ff"}
                return $scope.sortOrder = "-websiteVisits";
            }else{
                $scope.ascStyle = {fill: "#22d8ff"};
                $scope.desStyle = {fill: "#ffffff"}
                return $scope.sortOrder = "websiteVisits";
            }
            return;
        };

        //open setting page
        $scope.settings = function(){
          var newURL = location.origin+"/Options/options.html";
          chrome.tabs.create({ url: newURL });
        };

        //sign out button
        $scope.signOut = function(){
            authService.signOut();
            $scope.authenticated = false;
            authService.authenticated = $scope.authenticated;
        }
        //show day table
        $scope.dayBtn = 1;
        $scope.isActive = false;

        //week days in progress TODO
        $scope.days = [];
        for (var i = 6; i >= 1; i--) {
            var date = moment().subtract(i,'days');
            var formattedDate = {number: moment(date).format("D"), name: moment(date).format("ddd")};
            $scope.days.push(formattedDate);
        }
        var today = {number: moment().format("D"), name: moment().format("ddd")};
        $scope.days.push(today);

        //monster toggle
         $scope.monsterToggle = function () {
            if (websiteList[0] == undefined || websiteList[0].websiteVisits < 0) {
                 return true;
            }else{
                return false;
            }
        };
    });

    app.constant('AUTH_EVENTS',{
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });
    app.constant('USER_ROLES', {
      all: '*',
      user: 'user'
    })

    app.factory('authService', function(AUTH_EVENTS){
        console.log("I ran auth service");
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
                  //writeUserData(user.uid,user.displayName,user.email,user.photoURL);
                } else {
                  console.error('The OAuth Token was null');
                }
              });
        };

        return{
            authenticated: false,
            signOut: signOut,
            loginWithGoogle : loginWithGoogle
       };
    });

    app.directive('authDirective',function(authService){
        return{
            link: function (scope,element,attrs,controller){
                //on state change
                firebase.auth().onAuthStateChanged(function(user) {
                  if(user){
                      scope.authenticated = true;
                      writeUserData(user.uid,user.displayName,user.email,user.photoURL);
                  }else{
                      scope.authenticated = false;
                  }
                  authService.authenticated = scope.authenticated;
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
    });
    app.directive('loginView',function(){
        return{
            templateUrl: "/Login/loginView.html",
            restrict: "E"
        }
    });
    app.directive('websitesView',function(){
        return{
            templateUrl: "/WebsiteList/websitesView.html",
            restrict: "E"
        }
    });
    app.directive('remove',function(){
        return{
            link: function (scope,element,attrs,controller){
                element.on('click', function(event){
                    scope.websites.splice(scope.websites.indexOf(scope.website), 1);
                    scope.$apply();
                    _gaq.push(['_trackEvent', scope.website.websiteName, 'websiteRemoved']);
                    chrome.runtime.sendMessage({
                        action: "remove",
                        list: scope.websites
                    });
                });
            }
        }
    });
    app.directive('monster',function(){
        return{
            templateUrl: "/WebsiteList/monster.html",
            restrict: "E"
        }
    });


}());
