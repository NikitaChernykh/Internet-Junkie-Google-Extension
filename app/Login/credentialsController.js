module.exports = function($scope, authService) {
  'use strict';
  $scope.authenticated = authService.authenticated;
  $scope.gauth = function(){
      authService.loginWithGoogle(true);
      $scope.authenticated = true;
      authService.authenticated = $scope.authenticated;
  };
};
