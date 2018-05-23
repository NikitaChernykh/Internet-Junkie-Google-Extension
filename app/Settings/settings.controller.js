var APP_VIEWS = require('../../app/Shared/constants/app-views.constant');
var APP_TRANSLATIONS = require('../../app/Shared/constants/translations.constant');

module.exports = function($scope,authService, dataService, APP_VIEWS,APP_TRANSLATIONS) {
  'use strict';
  $scope.settings_title = APP_TRANSLATIONS.settings.settings_title;
  $scope.settings_del = APP_TRANSLATIONS.settings.settings_del;
  $scope.settings_btn_clear = APP_TRANSLATIONS.settings.settings_btn_clear;
  $scope.settings_add_blacklist = APP_TRANSLATIONS.settings.settings_add_blacklist;
  $scope.settings_btn_blacklist = APP_TRANSLATIONS.settings.settings_btn_blacklist;
  $scope.settings_btn_goback = APP_TRANSLATIONS.settings.settings_btn_goback;
  $scope.settings_error_minlength = APP_TRANSLATIONS.settings.settings_error_minlength;
  $scope.settings_error_required = APP_TRANSLATIONS.settings.settings_error_required;
  $scope.settings_error_blacklist_exist = APP_TRANSLATIONS.settings.settings_error_blacklist_exist;
  $scope.modal_title = APP_TRANSLATIONS.settings.modal_title;
  $scope.modal_body = APP_TRANSLATIONS.settings.modal_body;
  $scope.modal_cancel_btn = APP_TRANSLATIONS.settings.modal_cancel_btn;
  $scope.modal_delete_btn = APP_TRANSLATIONS.settings.modal_delete_btn;
  $scope.modalActive = false;

  dataService.getWebsites().then(function(result){
    $scope.websites = result.websiteList;
    $scope.blackList = result.blackList;
  }).catch(function () {
    console.error("Error: Could not retrive website list.");
  });


  $scope.openModal = function(){
      $scope.modalActive = true;

  };
  $scope.closeModal = function(){
      $scope.modalActive = false;

  };

  $scope.clearTodayStatisics = function(){
    $scope.websites.length = 0;
    _gaq.push(['_trackEvent','clearAllWebsites']);
    chrome.runtime.sendMessage({
        action: "remove",
        list: $scope.websites
    });
    $scope.closeModal();
  };
  $scope.addToBlackList = function(){
    if($scope.blacklistForm.$valid){
      _gaq.push(['_trackEvent', $scope.website, 'addToBlackList']);
      $scope.blackList.push($scope.website);
      chrome.runtime.sendMessage({
          action: "updateBlackList",
          blackList: $scope.blackList
      });
      $scope.website = "";
      $scope.blacklistForm.$setPristine();
      $scope.blacklistForm.$setUntouched();
    }
  };

  $scope.goback = function(){
    _gaq.push(['_trackEvent','backFromSettings']);
    authService.view = APP_VIEWS.homeView;
    $scope.$emit('view', authService.view);
  };
};
