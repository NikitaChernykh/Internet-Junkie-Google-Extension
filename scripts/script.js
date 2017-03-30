//Get acsses to the background.js
var background = chrome.extension.getBackgroundPage();
var content = document.getElementById("websiteList");

(function () {
    var app = angular.module("internetJunkie", []);
    var MainController = function ($scope) {
        $scope.websites = background.websiteList;
        //descending sort order
        $scope.sortOrder = "-websiteVisits";
        
        //Send message on popup active
        chrome.runtime.sendMessage({
            action: "popup"
        });
        
        

        $scope.remove = function (website) {
            $scope.websites.splice($scope.websites.indexOf(website), 1);
            console.log($scope.websites.indexOf(website));
            console.log(website.websiteName + " is removed");
            console.log("angular website list");
            console.log($scope.websites);
            
            chrome.runtime.sendMessage({
                action: "remove",
                list: $scope.websites
            });
        };
    };
    app.controller("MainController", ["$scope", MainController]);
}());
