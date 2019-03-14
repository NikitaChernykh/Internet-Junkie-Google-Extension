const angular = require('angular');
const angularMessages = require('angular-messages');
const authService = require('../../app/Login/auth.service');
const dataService = require('../../app/Shared/data.service');

const AppController = require('../../app/Popup/app.controller');
const HomeController = require('../../app/Home/home.controller');
const OptionsController = require('../../app/Options/options.controller');
const SettingsController = require('../../app/Settings/settings.controller');
const CredentialsController = require('../../app/Login/credentials.controller');

const weekDaysComponent = require('../../app/Weekdays/week-days-component.directive');
const footerComponent = require('../../app/Shared/footer-component.directive');
const langDirective = require('../../app/Shared/lang.directive');
const loadDaysDirective = require('../../app/Weekdays/load-days.directive');
const loginViewDirective = require('../../app/Login/login-view.directive');
const homeViewDirective = require('../../app/Home/home-view.directive');
const removeblkDirective = require('../../app/Settings/removeblk.directive');
const settingsViewDirective = require('../../app/Settings/settings-view.directive');
const noDataMonsterDirective = require('../../app/Home/no-data-monster.directive');
const noActivityMonsterDirective = require('../../app/Home/no-activity-monster.directive');
const authDirective = require('../../app/Login/auth.directive');
const existcheckDirective = require('../../app/Settings/existcheck.directive');
const removeDirective = require('../../app/Home/remove.directive');

const APP_TRANSLATIONS = require('../../app/Shared/constants/translations.constant');
const APP_VIEWS = require('../../app/Shared/constants/app-views.constant');
const AUTH_EVENTS = require('../../app/Shared/constants/auth-events.constant');

(function() {
  const app = angular.module('internetJunkie', [angularMessages]);

  // app config for overwriting whitelist ex: for img path
  app.config([
    '$compileProvider',
    function($compileProvider) {
      //  Default imgSrcSanitizationWhitelist: /^\s*((https?|ftp|file|blob):|data:image\/)
      $compileProvider.imgSrcSanitizationWhitelist(
        /^\s*((https?|ftp|file|blob|chrome-extension):|data:image\/)/
      );
    },
  ]);

  // services
  app.factory('authService', authService);
  app.factory('dataService', dataService);

  // controllers
  app.controller('AppController', AppController);
  app.controller('HomeController', HomeController);
  app.controller('CredentialsController', CredentialsController);
  app.controller('OptionsController', OptionsController);
  app.controller('SettingsController', SettingsController);

  // directives
  app.directive('lang', langDirective);
  app.directive('loginView', loginViewDirective);
  app.directive('homeView', homeViewDirective);
  app.directive('noDataMonster', noDataMonsterDirective);
  app.directive('noActivityMonster', noActivityMonsterDirective);
  app.directive('settingsView', settingsViewDirective);
  app.directive('auth', authDirective);
  app.directive('remove', removeDirective);

  app.directive('existcheck', existcheckDirective);
  app.directive('removeblk', removeblkDirective);
  app.directive('footerComponent', footerComponent);

  app.directive('loadDays', loadDaysDirective);
  app.directive('weekDaysComponent', weekDaysComponent);

  // constants
  app.constant('AUTH_EVENTS', AUTH_EVENTS);
  app.constant('APP_VIEWS', APP_VIEWS);
  app.constant('APP_TRANSLATIONS', APP_TRANSLATIONS);

  module.exports = app;
})();
