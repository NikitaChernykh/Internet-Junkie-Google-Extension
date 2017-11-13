var moment = require('moment');
module.exports = function($scope, $timeout, authService, dataService) {
  'use strict';
  var websiteList = [];
  dataService.getData().then(function(result){

    $timeout(function() {
      websiteList = result.websiteList;
      $scope.websites = websiteList;

      for(var i = 0; i < websiteList.length; i++){
          $scope.model.totalVisits += $scope.websites[i].websiteVisits;
          $scope.model.totalTime += $scope.websites[i].formatedTime.min+($scope.websites[i].formatedTime.hours*60)+(($scope.websites[i].formatedTime.days*24)*60);
      }
    });
  }).catch(function () {
    console.log("getData error");
  });

  $scope.sortOrder = "-websiteVisits";
  $scope.authenticated = authService.authenticated;
  $scope.model = {
    totalVisits: 0,
    totalTime:0
  }
  //_locales text that translates
  $scope.table_header_text = chrome.i18n.getMessage("table_header_text");
  $scope.websites_label = chrome.i18n.getMessage("websites_label");
  $scope.visits_label = chrome.i18n.getMessage("visits_label");
  $scope.time_label = chrome.i18n.getMessage("time_label");
  $scope.placeholder_msg = chrome.i18n.getMessage("placeholder_msg");

  //sort & color change on order toggle
  $scope.sortToggle = function (order) {
      //track website sorting event
      _gaq.push(['_trackEvent', order, 'listSorted']);
      if (order === "websiteVisits") {
          $scope.ascStyle = {fill: "#ffffff"};
          $scope.desStyle = {fill: "#22d8ff"};
          $scope.sortOrder = "-websiteVisits";
      }else{
          $scope.ascStyle = {fill: "#22d8ff"};
          $scope.desStyle = {fill: "#ffffff"};
          $scope.sortOrder = "websiteVisits";
      }
  };

  //open setting page
  $scope.settings = function(){
    _gaq.push(['_trackEvent', 'settingsOpen']);
    var newURL = location.origin+"/Options/options.html";
    chrome.tabs.create({ url: newURL });
  };

  //sign out button
  $scope.signOut = function(){
      _gaq.push(['_trackEvent', 'userSignedOut']);
      authService.signOut();
      $scope.authenticated = false;
      authService.authenticated = $scope.authenticated;
  };

  //show day table
  $scope.dayBtn = 1;
  $scope.isActive = false;

  //week days in progress TODO
  $scope.days = [];
  for (var i = 6; i >= 1; i--) {
      var date = moment().subtract(i,'days');
      var formattedDate = {number: moment(date).format("D"), name: moment(date).format("ddd")};
      $scope.days.push(formattedDate);
  }
  var today = {number: moment().format("D"), name: moment().format("ddd")};
  $scope.days.push(today);





  //for debugging
  window.MY_SCOPE = $scope;

  //monster toggle
  $scope.monsterToggle = function () {
      if (websiteList[0] == undefined || websiteList[0].websiteVisits < 0) {
            _gaq.push(['_trackEvent', 'showedMonster']);
           return true;
      }else{
          return false;
      }
  };
};
