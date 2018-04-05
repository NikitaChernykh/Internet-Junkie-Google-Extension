var moment = require('moment-timezone');
var APP_VIEWS = require('../../app/Shared/constants/app-views.constant');
var APP_TRANSLATIONS = require('../../app/Shared/constants/translations.constant');

module.exports = function($scope, $timeout, authService, dataService, APP_VIEWS,APP_TRANSLATIONS) {
  'use strict';
  var websiteList = [];
  $scope.showTableHead = true;

  dataService.getWebsites().then(function(result){
    $timeout(function() {
      websiteList = result.websiteList;
      $scope.websites = websiteList;
    });
  }).catch(function () {
    console.error("Error: Could not retrive website list.");
  });

  dataService.getTotalTimeAndVisits().then(function(total){
    $scope.model.totalVisits = total.totalVisits;
    $scope.model.totalTime = total.totalTime;
  }).catch(function () {
    console.error("Error: Can't get total time and visits.");
  });

  $scope.model = {
    totalVisits: 0,
    totalTime:{}
  };

  //_locales text that translates
  $scope.today_text = APP_TRANSLATIONS.home.today_text;
  $scope.websites_label = APP_TRANSLATIONS.home.websites_label;
  $scope.visits_label = APP_TRANSLATIONS.home.visits_label;
  $scope.time_label = APP_TRANSLATIONS.home.time_label;
  $scope.placeholder_msg = APP_TRANSLATIONS.home.placeholder_msg;

  $scope.total_text = APP_TRANSLATIONS.home.total_text;
  $scope.visits_text = APP_TRANSLATIONS.home.visits_text;

  $scope.abbr_min = APP_TRANSLATIONS.home.abbr_min;
  $scope.abbr_sec = APP_TRANSLATIONS.home.abbr_sec;
  $scope.abbr_days = APP_TRANSLATIONS.home.abbr_days;
  $scope.abbr_hours = APP_TRANSLATIONS.home.abbr_hours;
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
  $scope.websiteName = function(name){
    if(name.length >= 32){
      name = name.slice(0,32)+'(...)';
    }
    return name;
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
