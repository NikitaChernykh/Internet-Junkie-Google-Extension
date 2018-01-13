var moment = require('moment');

var APP_VIEWS = require('../../app/Login/app-views.constant');
module.exports = function($scope, $timeout, authService, dataService, APP_VIEWS) {
  'use strict';
  var websiteList = [];


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

  $scope.sortOrder = "-websiteVisits";
  $scope.model = {
    totalVisits: 0,
    totalTime:0
  };
  //_locales text that translates
  $scope.table_header_text = chrome.i18n.getMessage("table_header_text");
  $scope.websites_label = chrome.i18n.getMessage("websites_label");
  $scope.visits_label = chrome.i18n.getMessage("visits_label");
  $scope.time_label = chrome.i18n.getMessage("time_label");
  $scope.placeholder_msg = chrome.i18n.getMessage("placeholder_msg");

  $scope.total_text = chrome.i18n.getMessage("total_text");
  $scope.visits_text = chrome.i18n.getMessage("visits_text");

  $scope.abbreviation_min = chrome.i18n.getMessage("abbreviation_min");
  $scope.abbreviation_sec = chrome.i18n.getMessage("abbreviation_sec");
  $scope.abbreviation_days = chrome.i18n.getMessage("abbreviation_days");

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
  $scope.signOut = function(){
      _gaq.push(['_trackEvent', 'userSignedOut']);
      authService.signOut();
      authService.view = APP_VIEWS.loginView;
      $scope.$emit('view', authService.view);
  };
  var today = {number: moment().format("D"), name: moment().format("ddd"), fulldate : moment(), today: true};
  $scope.today = today;
  //show day table
  $scope.dayBtn = $scope.today.number;
  $scope.isActive = false;

  //week days in progress TODO
  $scope.days = [];

  for (var i = 6; i >= 1; i--) {
      var date = moment().subtract(i,'days');
      var formattedDate = {number: moment(date).format("D"), name: moment(date).format("ddd"), fulldate : moment(),today : false};
      $scope.days.push(formattedDate);
  }

  $scope.dayClick = function(number){
    //for yesteday
    if(number == $scope.days[5].number){
      $scope.dayBtn = 2;
      console.log($scope);
    }
    //for today
    if(number == $scope.days[6].number){
      $scope.dayBtn = $scope.today.number;
    }
    if(number == $scope.days[4].number){
      $scope.dayBtn = 3;
    }
    if(number == $scope.days[3].number){
      $scope.dayBtn = 4;
    }
    if(number == $scope.days[2].number){
      $scope.dayBtn = 5;
    }
    if(number == $scope.days[1].number){
      $scope.dayBtn = 6;
    }
    if(number == $scope.days[0].number){
      $scope.dayBtn = 7;
    }
    console.log("day clicked "+ number);
  };
  $scope.setActive = function (number) {
    if(number != $scope.today.number){
    //TODO figure out how to apply styles in this
    }
  };
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
