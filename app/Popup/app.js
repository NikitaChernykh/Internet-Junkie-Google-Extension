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
    app.factory('authService', require('../../app/Login/auth.service'));
    app.factory('dataService', require('../../app/Shared/data.service'));


    //controllers
    app.controller('AppController', require('../../app/Popup/app.controller'));
    app.controller('HomeController', require('../../app/Home/home.controller'));
    app.controller('CredentialsController', require('../../app/Login/credentials.controller'));
    app.controller('OptionsController', require('../../app/Options/options.controller'));
    app.controller('SettingsController', require('../../app/Settings/settings.controller'));

    //directives
    app.directive('loginView', require('../../app/Login/login-view.directive'));
    app.directive('homeView', require('../../app/Home/home-view.directive'));
    app.directive('settingsView', require('../../app/Settings/settings-view.directive'));
    app.directive('auth', require('../../app/Login/auth.directive'));
    app.directive('remove', require('../../app/Home/remove.directive'));
    app.directive('monster', require('../../app/Home/monster.directive'));
    app.directive('weekday', require('../../app/Home/weekday.directive'));
    app.directive('existcheck', require('../../app/Settings/existcheck.directive'));
    app.directive('removeblk', require('../../app/Settings/removeblk.directive'));
    app.directive('footer', require('../../app/Shared/footer.directive'));


    app.directive('dataaaa', require('../../app/Shared/test.directive'));
    //constants
    app.constant('AUTH_EVENTS', require('../../app/Login/auth-events.constant'));
    app.constant('APP_VIEWS', require('../../app/Login/app-views.constant'));

    module.exports = app;
}());
