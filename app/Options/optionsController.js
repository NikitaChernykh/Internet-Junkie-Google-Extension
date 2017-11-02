

module.exports = function($scope) {
  'use strict';
  var websiteList = [];
  var blackList = [];
  $scope.websites = websiteList;
  $scope.blackList = blackList;
  chrome.storage.local.get("websiteList", function(data){
    websiteList = data.websiteList;
  });

  chrome.storage.local.get("blackList", function(data){
    blackList = data.blackList;
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
