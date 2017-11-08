var moment = require('moment');

(function () {
    'use strict';
    var app = require('angular').module("internetJunkie", []);

    //TODO clean this up
    var websiteList = [];
    var blackList = [];
    chrome.storage.local.get("websiteList", function(data){
      websiteList = data.websiteList;
    });
    chrome.storage.local.get("blackList", function(data){
      blackList = data.blackList;
    });

    //app config for overwriting whitelist ex: for img path
    app.config(['$compileProvider',function ($compileProvider) {
          //  Default imgSrcSanitizationWhitelist: /^\s*((https?|ftp|file|blob):|data:image\/)/
          //  chrome-extension: will be added to the end of the expression
          $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob|chrome-extension):|data:image\/)/);
        }
    ]);

    //controllers
    app.controller('CredentialsController', require('../../app/Login/credentialsController'));
    app.controller('OptionsController', require('../../app/Options/optionsController'));

    //TODO convet this to module
    app.controller('MainController', function MainController($scope, authService){
        $scope.websites = websiteList;

        //declaration of descending sort order
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
            if (order === "websiteVisits") {
                $scope.ascStyle = {fill: "#ffffff"};
                $scope.desStyle = {fill: "#22d8ff"};
                $scope.sortOrder = "-websiteVisits";
            }else{
                $scope.ascStyle = {fill: "#22d8ff"};
                $scope.desStyle = {fill: "#ffffff"};
                $scope.sortOrder = "websiteVisits";
            }
        };

        //open setting page
        $scope.settings = function(){
          _gaq.push(['_trackEvent', 'settingsOpen']);
          var newURL = location.origin+"/Options/options.html";
          chrome.tabs.create({ url: newURL });
        };

        //sign out button
        $scope.signOut = function(){
            _gaq.push(['_trackEvent', 'userSignedOut']);
            authService.signOut();
            $scope.authenticated = false;
            authService.authenticated = $scope.authenticated;
        };
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
            _gaq.push(['_trackEvent', 'userSawMonster']);
            if (websiteList[0] == undefined || websiteList[0].websiteVisits < 0) {
                 return true;
            }else{
                return false;
            }
        };
    });

    //directives
    app.directive('authDirective', require('../../app/Login/authDirective'));
    app.directive('loginView', require('../../app/Login/loginViewDirective'));
    app.directive('websitesView', require('../../app/WebsiteList/websitesViewDirective'));
    app.directive('remove', require('../../app/WebsiteList/removeDirective'));
    app.directive('monster', require('../../app/WebsiteList/monsterDirective'));

    //constants
    app.constant('AUTH_EVENTS', require('../../app/Login/authEventsConstant'));
    app.constant('AUTH_EVENTS', require('../../app/Login/userRolesConstant'));

    //TODO convert this to module
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
}());
