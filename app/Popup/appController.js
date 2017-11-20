var APP_VIEWS = require('../../app/Login/appViewsConstant');

module.exports = function($scope , authService, APP_VIEWS) {
  'use strict';
   $scope.view = authService.view;
   $scope.$on('view', function (event, data) {
     $scope.view = data;
   });
};
