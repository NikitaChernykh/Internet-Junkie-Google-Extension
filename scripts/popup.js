'use strict';
//Get acsses to the background.js
var background = chrome.extension.getBackgroundPage();

//Sort websites in descending order by visits
//Sorts before load
background.websiteList.sort(function (a, b) {
    return b.websiteVisits - a.websiteVisits;
});

(function () {
    var app = angular.module("internetJunkie", []);

    var MainController = function ($scope) {

        $scope.websites = background.websiteList;
        //descending sort order
        $scope.sortOrder = "-websiteVisits";

        //_locales translate
        $scope.placeholder_msg = chrome.i18n.getMessage("placeholder_msg");
        $scope.top5_header_text = chrome.i18n.getMessage("top5_header_text");
        $scope.websites_label = chrome.i18n.getMessage("websites_label");
        $scope.visits_label = chrome.i18n.getMessage("visits_label");
        $scope.time_label = chrome.i18n.getMessage("time_label");
        
        //send popup action to background
        chrome.runtime.sendMessage({
            action: "popup"
        });
    
        //remove website
        $scope.remove = function (website) {
            $scope.websites.splice($scope.websites.indexOf(website), 1);
            //track website removal event
            _gaq.push(['_trackEvent', website.websiteName, 'websiteRemoved']);

            //send remove action to background 
            chrome.runtime.sendMessage({
                action: "remove",
                list: $scope.websites
            });
        };
        //monster toggle
        $scope.monsterToggle = function () {
            if (background.websiteList[0] == undefined || background.websiteList[0].websiteVisits < 5) {
                return true;
            }  
            return false;    
        };
    };

    //regsiter a controller in the module
    app.controller("MainController", ["$scope", MainController]);
}());



