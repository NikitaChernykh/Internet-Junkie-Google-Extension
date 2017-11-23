var APP_VIEWS = require('../../app/Login/appViewsConstant');

module.exports = function($scope, $timeout, authService, dataService, APP_VIEWS) {
  'use strict';

  var websiteList = [];
  var blackList = [];
  //get website data
  dataService.getData().then(function(result){
    $timeout(function() {
      websiteList = result.websiteList;
      blackList = result.blackList;
      $scope.websites = websiteList;
      $scope.blackList = blackList;
    });
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
    $scope.blackList.push($scope.website);
    console.log($scope.blackList);
    chrome.runtime.sendMessage({
        action: "addBlacklist",
        blackList: $scope.blackList
    });
    $scope.website = "";
  };
  $scope.goback = function(){
    authService.view = APP_VIEWS.homeView;
    $scope.$emit('view', authService.view);
  };
};
