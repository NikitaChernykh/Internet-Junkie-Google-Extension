var APP_VIEWS = require('../../app/Login/app-views.constant');

module.exports = function($scope , authService, APP_VIEWS) {
  'use strict';
   $scope.view = authService.view;
   $scope.$on('view', function (event, data) {
     $scope.view = data;
   });
   chrome.runtime.sendMessage({
       action: "popup"
   });
};
