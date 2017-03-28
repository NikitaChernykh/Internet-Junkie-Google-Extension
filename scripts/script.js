//Get acsses to the background.js
    var background = chrome.extension.getBackgroundPage();
    var content = document.getElementById("websiteList");

    //Sort websites in descending order by visits
    background.websiteList.sort(function(a, b){
        return b.websiteVisits - a.websiteVisits;
    });

(function(){
    var app = angular.module("internetJunkie",[]);
    var MainController = function($scope){
        $scope.remove = function(name){
            console.log( name + "removed");
        };
        
        $scope.websites = background.websiteList;
        $scope.sortOrder = "-websiteVisits";
    };
    app.controller("MainController", ["$scope",MainController]);
}());