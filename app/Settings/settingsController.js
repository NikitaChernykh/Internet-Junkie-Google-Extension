var APP_VIEWS = require('../../app/Login/appViewsConstant');

module.exports = function($scope, $timeout, authService, dataService, APP_VIEWS) {
  'use strict';


  //get website data
  dataService.getData().then(function(result){
    $scope.websites = result.websiteList;
    $scope.blackList = result.blackList;
  }).catch(function () {
    console.log("getData error");
  });

  //clear all website list
  $scope.clearAll = function(){
      //TODO make a confirmation modal
      $scope.websites.length = 0;
      _gaq.push(['_trackEvent', 'clearAllWebsites']);
      chrome.runtime.sendMessage({
          action: "remove",
          list: $scope.websites
      });
      return;
  };
  $scope.addToBlackList = function(){
    if($scope.blacklistForm.$valid){
      $scope.blackList.push($scope.website);
      chrome.runtime.sendMessage({
          action: "addBlacklist",
          blackList: $scope.blackList
      });
      $scope.website = "";
      $scope.blacklistForm.$setPristine();
      $scope.blacklistForm.$setUntouched();
    }
  };
  $scope.goback = function(){
    authService.view = APP_VIEWS.homeView;
    $scope.$emit('view', authService.view);
  };
};
