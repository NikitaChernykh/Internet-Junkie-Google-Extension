var moment = require('moment');

var APP_VIEWS = require('../../app/Login/app-views.constant');
module.exports = function($scope, $timeout, authService, dataService, APP_VIEWS) {
  'use strict';
  var websiteList = [];
  $scope.showTableHead = true;

  dataService.getData().then(function(result){
    $timeout(function() {
      websiteList = result.websiteList;

      $scope.websites = websiteList;
      if($scope.websites.length>10){
        for(var i = 0; i < 10; i++){
            $scope.model.totalVisits += $scope.websites[i].websiteVisits;
            $scope.model.totalTime += $scope.websites[i].formatedTime.min+($scope.websites[i].formatedTime.hours*60)+(($scope.websites[i].formatedTime.days*24)*60);
        }
      }else{
        for(var f = 0; f < $scope.websites.length; f++){
            $scope.model.totalVisits += $scope.websites[f].websiteVisits;
            $scope.model.totalTime += $scope.websites[f].formatedTime.min+($scope.websites[f].formatedTime.hours*60)+(($scope.websites[f].formatedTime.days*24)*60);
        }
      }
    });
  }).catch(function () {
    console.log("getData error");
  });

  $scope.model = {
    totalVisits: 0,
    totalTime:0
  };

  //_locales text that translates
  $scope.today_text = chrome.i18n.getMessage("today_text");
  $scope.websites_label = chrome.i18n.getMessage("websites_label");
  $scope.visits_label = chrome.i18n.getMessage("visits_label");
  $scope.time_label = chrome.i18n.getMessage("time_label");
  $scope.placeholder_msg = chrome.i18n.getMessage("placeholder_msg");

  $scope.total_text = chrome.i18n.getMessage("total_text");
  $scope.visits_text = chrome.i18n.getMessage("visits_text");

  $scope.abbr_min = chrome.i18n.getMessage("abbr_min");
  $scope.abbr_sec = chrome.i18n.getMessage("abbr_sec");
  $scope.abbr_days = chrome.i18n.getMessage("abbr_days");
  $scope.abbr_hours = chrome.i18n.getMessage("abbr_hours");
  $scope.no_activity_text = "You have no activity recorded for this day.";

  $scope.sortOrder = "-websiteVisits";
  //sort & color change on order toggle
  $scope.sortToggle = function (order) {
      //track website sorting event
      _gaq.push(['_trackEvent','listSorted']);
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
    authService.view = APP_VIEWS.settingsView;
    $scope.$emit('view', authService.view);
  };

  //sign out button
  //belongs to hidden login functionality
  // $scope.signOut = function(){
  //     _gaq.push(['_trackEvent', 'userSignedOut']);
  //     authService.signOut();
  //     authService.view = APP_VIEWS.loginView;
  //     $scope.$emit('view', authService.view);
  // };

  //TODO move to week-days-component
  var today = {number: moment().format("D"), name: moment().format("ddd"), fulldate : moment(), today: true};
  $scope.today = today;
  //show day table
  $scope.dayBtn = 6;
  $scope.isActive = false;
  //week days in progress TODO
  $scope.days = [];

  for (var i = 6; i >= 1; i--) {
      var date = moment().subtract(i,'days');
      var formattedDate = {number: moment(date).format("D"), name: moment(date).format("ddd"), fulldate : moment(),today : false};
      $scope.days.push(formattedDate);
  }
  $scope.days.push(today);


  //for debugging
  window.MY_SCOPE = $scope;


  //TODO move to directive
  //monster toggle
  $scope.monsterToggle = function () {
      if (websiteList[0] == undefined || websiteList[0].websiteVisits < 0) {
           _gaq.push(['_trackEvent', 'showedMonster']);
           return true;
      }else{
           return false;
      }
  };
  $scope.noActivityMonsterToggle = function(){
    if($scope.activityMonster){
      return true;
    }
    return false;
  };
};
