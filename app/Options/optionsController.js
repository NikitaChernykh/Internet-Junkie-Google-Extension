module.exports = function($scope, $timeout, dataService) {
  'use strict';

  var websiteList = [];
  var blackList = [];

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
    var c = confirm("Are you sure you want to delete all the websites?");
    if(c){
      $scope.websites.length = 0;
      chrome.runtime.sendMessage({
          action: "remove",
          list: $scope.websites
      });
    }
    return;
  };
};
