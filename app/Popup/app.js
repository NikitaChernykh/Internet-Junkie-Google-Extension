var angular = require('angular');
(function () {
    'use strict';
    var app = angular.module("internetJunkie", []);

    //app config for overwriting whitelist ex: for img path
    app.config(['$compileProvider',function ($compileProvider) {
          //  Default imgSrcSanitizationWhitelist: /^\s*((https?|ftp|file|blob):|data:image\/)/
          //  chrome-extension: will be added to the end of the expression
          $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob|chrome-extension):|data:image\/)/);
        }
    ]);
    //services
    app.factory('authService', require('../../app/Login/authService'));
    app.factory('dataService', require('../../app/Shared/dataService'));

    //controllers
    app.controller('PopupController', require('../../app/Popup/popupController'));
    app.controller('CredentialsController', require('../../app/Login/credentialsController'));
    app.controller('OptionsController', require('../../app/Options/optionsController'));


    //directives
    app.directive('authDirective', require('../../app/Login/authDirective'));
    app.directive('loginView', require('../../app/Login/loginViewDirective'));
    app.directive('websitesView', require('../../app/WebsiteList/websitesViewDirective'));
    app.directive('remove', require('../../app/WebsiteList/removeDirective'));
    app.directive('monster', require('../../app/WebsiteList/monsterDirective'));

    //constants
    app.constant('AUTH_EVENTS', require('../../app/Login/authEventsConstant'));
    app.constant('AUTH_EVENTS', require('../../app/Login/userRolesConstant'));
    
    module.exports = app;
}());
