var angular = require('angular');
(function () {
    'use strict';
    var app = angular.module("internetJunkie", [require('angular-messages')]);

    //app config for overwriting whitelist ex: for img path
    app.config(['$compileProvider',function ($compileProvider) {
          //  Default imgSrcSanitizationWhitelist: /^\s*((https?|ftp|file|blob):|data:image\/)
          $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob|chrome-extension):|data:image\/)/);
        }
    ]);

    //services
    app.factory('authService', require('../../app/Login/auth.service'));
    app.factory('dataService', require('../../app/Shared/data.service'));
    app.service('modalService', require('../../app/Shared/modal.service'));

    //controllers
    app.controller('AppController', require('../../app/Popup/app.controller'));
    app.controller('HomeController', require('../../app/Home/home.controller'));
    app.controller('CredentialsController', require('../../app/Login/credentials.controller'));
    app.controller('OptionsController', require('../../app/Options/options.controller'));
    app.controller('SettingsController', require('../../app/Settings/settings.controller'));
    app.controller('ModalController', require('../../app/Shared/modal.controller'));


    //directives
    app.directive('loginView', require('../../app/Login/login-view.directive'));
    app.directive('homeView', require('../../app/Home/home-view.directive'));
    app.directive('noDataMonster', require('../../app/Home/no-data-monster.directive'));
    app.directive('noActivityMonster', require('../../app/Home/no-activity-monster.directive'));
    app.directive('settingsView', require('../../app/Settings/settings-view.directive'));
    app.directive('auth', require('../../app/Login/auth.directive'));
    app.directive('remove', require('../../app/Home/remove.directive'));

    app.directive('existcheck', require('../../app/Settings/existcheck.directive'));
    app.directive('removeblk', require('../../app/Settings/removeblk.directive'));
    app.directive('footerComponent', require('../../app/Shared/footer-component.directive'));

    app.directive('loadDays', require('../../app/Weekdays/load-days.directive'));
    app.directive('weekDaysComponent', require('../../app/Weekdays/week-days-component.directive'));

    //constants
    app.constant('AUTH_EVENTS', require('../../app/Shared/constants/auth-events.constant'));
    app.constant('APP_VIEWS', require('../../app/Shared/constants/app-views.constant'));
    app.constant('APP_TRANSLATIONS', require('../../app/Shared/constants/translations.constant'));

    module.exports = app;
}());
