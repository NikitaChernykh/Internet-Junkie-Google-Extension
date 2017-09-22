'use strict';
//get acsses to the background.js
var background = chrome.extension.getBackgroundPage();

//sort websites in descending order by visits
//sorts before load
background.websiteList.sort(function (a, b) {
    return b.websiteVisits - a.websiteVisits;
});

(function () {

    var MainController = function ($scope, authService) {

        $scope.websites = background.websiteList;
        //descending sort order
        $scope.sortOrder = "-websiteVisits";
        $scope.authenticated = authService.authenticated;
        
        //_locales text that translates
        $scope.table_header_text = chrome.i18n.getMessage("table_header_text");
        $scope.websites_label = chrome.i18n.getMessage("websites_label");
        $scope.visits_label = chrome.i18n.getMessage("visits_label");
        $scope.time_label = chrome.i18n.getMessage("time_label");
        
        

        //sort & color change on order toggle
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

        //open setting page
        $scope.settings = function(){
          var newURL = location.origin+"/app/Options/options.html";
          chrome.tabs.create({ url: newURL });
        };

        //sign out button
        $scope.signOut = function(){
            authService.signOut();
            $scope.authenticated = false;
            authService.authenticated = $scope.authenticated;
        }
        //show day table
        $scope.dayBtn = 1;
        $scope.isActive = false;

        //week days in progress TODO
        $scope.days = [];
        for (var i = 6; i >= 1; i--) {
            var date = moment().subtract('days', i);
            var formattedDate = {number: moment(date).format("D"), name: moment(date).format("ddd")};
            $scope.days.push(formattedDate);
            if(i == 5){
                $scope.dayStyle = {color: "#000"};
            }else{
                $scope.dayStyle = {color: "#fff"};
            }
        }
        var today = {number: moment().format("D"), name: moment().format("ddd")};
        $scope.days.push(today);
    };

    //regsiter a controller in the module
    app.controller("MainController", ["$scope", "authService", MainController]);
}());
