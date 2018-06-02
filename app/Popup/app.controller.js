var APP_VIEWS = require('../../app/Shared/constants/app-views.constant');

module.exports = function($scope , authService, APP_VIEWS) {
  'use strict';
   $scope.view = authService.view;
   $scope.$on('view', function (event, data) {
     $scope.view = data;
   });
   chrome.runtime.sendMessage({
       action: "popup"
   });
   //open setting page
  $scope.settings = function(){
    _gaq.push(['_trackEvent', 'settingsOpen']);
    authService.view = APP_VIEWS.settingsView;
    $scope.$emit('view', authService.view);
  };
};
