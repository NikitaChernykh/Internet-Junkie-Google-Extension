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
  function extractDomain(url){
    if (url !== undefined) {
        //vars
        var domain;
        var regex = /(\..*){2,}/;

        //find & remove protocol (http, ftp, etc.) and get domain
        if (url.indexOf("://") > -1) {
            domain = url.split('/')[2];
        } else {
            domain = url.split('/')[0];
        }
        //find & remove port number
        domain = domain.split(':')[0];

        //removes everything before 1 dot - like: "www"
        if (regex.test(domain)) {
            domain = domain.substring(domain.indexOf(".") + 1);
        }
        var arr = domain.match(/[.]/gi);
        if(arr == null){
           return "";
        }
        var counter = arr.length;
        while(counter > 1){
            domain = domain.substr(domain.indexOf('.')+1);
            counter--;
        }
        return domain;
    }
    return "";
  } 
  $scope.addToBlackList = function(){
    var site = extractDomain($scope.website);
    $scope.blackList.push(site);
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
