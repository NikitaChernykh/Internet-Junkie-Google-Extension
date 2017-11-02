module.exports = function($scope) {
  'use strict';
  $scope.websites = websiteList;
  $scope.blackList = blackList;
  //clear all website list
  $scope.clearAll = function(){
    var c = confirm("Are you sure you want to delete all the websites?");
    if(c){
      $scope.websites.length = 0;
    }
    return;
  };
};
