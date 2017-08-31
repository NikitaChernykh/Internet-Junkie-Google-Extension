'use strict';
//Get acsses to the background.js
var background = chrome.extension.getBackgroundPage();

//Sort websites in descending order by visits
//Sorts before load
background.websiteList.sort(function (a, b) {
    return b.websiteVisits - a.websiteVisits;
});

(function () {


    var MainController = function ($scope) {

        $scope.websites = background.websiteList;
        //descending sort order
        $scope.sortOrder = "-websiteVisits";
        
        //_locales translate TODO => move the translation in saparate file
        $scope.placeholder_msg = chrome.i18n.getMessage("placeholder_msg");
        $scope.table_header_text = chrome.i18n.getMessage("table_header_text");
        $scope.websites_label = chrome.i18n.getMessage("websites_label");
        $scope.visits_label = chrome.i18n.getMessage("visits_label");
        $scope.time_label = chrome.i18n.getMessage("time_label");

        //send popup action to background
        chrome.runtime.sendMessage({
            action: "popup"
        });

        //sort color and order toggle
        $scope.sortToggle = function (order) {
            //track website sorting event
            _gaq.push(['_trackEvent', order, 'listSorted']);

            if (order == "websiteVisits") {
                $scope.ascStyle = {fill: "#ffffff"};
                $scope.desStyle = {fill: "#22d8ff"}
                return $scope.sortOrder = "-websiteVisits";
            }else{
                $scope.ascStyle = {fill: "#22d8ff"};
                $scope.desStyle = {fill: "#ffffff"}
                return $scope.sortOrder = "websiteVisits";
            }
            return;

        };
        //clear all website list
        $scope.settings = function(){
          var newURL = location.origin+"/views/options.html";
          chrome.tabs.create({ url: newURL });
        };
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

        //show day table
        $scope.dayBtn = 1;
        $scope.isActive = false;

        //week days in progress TODO
        $scope.today = moment().date();
        $scope.weekdays = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
        $scope.lastweek =  moment().day(-5).format("ddd").toUpperCase();              
        $scope.weekday = moment().isoWeekday();
        // switch($scope.weekday){
        //     case 1:
        //     $scope.weekday = $scope.weekdays[1];
        //     break;
        //     case 2:
        //     $scope.weekday = $scope.weekdays[2];
        //     break;
        //     case 3:
        //     $scope.weekday = $scope.weekdays[3];
        //     break;
        //     case 4:
        //     $scope.weekday = $scope.weekdays[4];
        //     break;
        //     case 5:
        //     $scope.weekday = $scope.weekdays[5];
        //     break;
        //     case 6:
        //     $scope.weekday = $scope.weekdays[6];
        //     break;
        //     case 7:
        //     $scope.weekday = $scope.weekdays[0];
        //     break;
        // }

        $scope.dayClick = function(day){
            $scope.dayBtn = day;
            $scope.isActive = !$scope.isActive;
            if (day == 1){
                $scope.isActive = false;
            }
        }
<<<<<<< Updated upstream
=======
        var today = {number: moment().format("D"), name: moment().format("ddd")};
        $scope.days.push(today);

//        $scope.dayClick = function(day){
//            $scope.dayBtn = day;
//            $scope.isActive = !$scope.isActive;
//            if (day == 1){
//                $scope.isActive = false;
//            }
//        }
        
        $scope.gauth = function(){
            chrome.identity.getAuthToken({
                "interactive": true
            },function(token){
                console.log(token);
            });
        }
>>>>>>> Stashed changes
        //monster toggle
        $scope.monsterToggle = function () {
            if (background.websiteList[0] == undefined || background.websiteList[0].websiteVisits < 0) {
                return true;
            }else{
                return false;
            }
        };
    };

    //regsiter a controller in the module
    app.controller("MainController", ["$scope", MainController]);
}());
