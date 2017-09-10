'use strict';

//Get acsses to the background.js
var background = chrome.extension.getBackgroundPage();

(function () {
  app.controller('OptionsController',
    function OptionsController($scope){

      $scope.websites = background.websiteList;
      $scope.blackList = background.blackList;
      //clear all website list
      $scope.clearAll = function(){
        var c = confirm("Are you sure you want to delete all the websites?");
        if(c){
          $scope.websites.length = 0;
        }
        return;
      };

    }
  );
}());
