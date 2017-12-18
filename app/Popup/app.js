var angular = require('angular');
(function () {
    'use strict';
    var app = angular.module("internetJunkie", [require('angular-messages'),require('angular-animate')]);

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
    app.controller('AppController', require('../../app/Popup/appController'));
    app.controller('HomeController', require('../../app/Home/homeController'));
    app.controller('CredentialsController', require('../../app/Login/credentialsController'));
    app.controller('OptionsController', require('../../app/Options/optionsController'));
    app.controller('SettingsController', require('../../app/Settings/settingsController'));

    //directives
    app.directive('authDirective', require('../../app/Login/authDirective'));
    app.directive('loginView', require('../../app/Login/loginViewDirective'));
    app.directive('homeView', require('../../app/Home/homeViewDirective'));
    app.directive('settingsView', require('../../app/Settings/settingsViewDirective'));
    app.directive('remove', require('../../app/Home/removeDirective'));
    app.directive('monster', require('../../app/Home/monsterDirective'));
    app.directive('existcheck', require('../../app/Settings/existcheckDirective'));
    app.directive('removeblk', require('../../app/Settings/removeblkDirective'));

    //constants
    app.constant('AUTH_EVENTS', require('../../app/Login/authEventsConstant'));
    app.constant('APP_VIEWS', require('../../app/Login/appViewsConstant'));

    module.exports = app;
}());
