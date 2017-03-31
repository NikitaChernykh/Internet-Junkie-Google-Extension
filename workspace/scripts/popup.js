//Get acsses to the background.js
var background = chrome.extension.getBackgroundPage();

//Sort websites in descending order by visits
background.websiteList.sort(function(a, b){
    return b.websiteVisits - a.websiteVisits;
});

(function () {
    var app = angular.module("internetJunkie", []);
    
    var MainController = function ($scope) {
        
        $scope.websites = background.websiteList;
        //descending sort order
        $scope.sortOrder = "-websiteVisits";

        //send popup action to background
        chrome.runtime.sendMessage({
            action: "popup"
        });
        
        
        //remove website
        $scope.remove = function (website) {
            $scope.websites.splice($scope.websites.indexOf(website), 1);
            //track website removal event
            _gaq.push(['_trackEvent', website.websiteName, 'websiteRemoved']);
            //console.log($scope.websites.indexOf(website));
            //console.log(website.websiteName + " is removed");
            //console.log("angular website list");
            //console.log($scope.websites);
            
            //send remove action to background 
            chrome.runtime.sendMessage({
                action: "remove",
                list: $scope.websites
            });
        };
    };
    
    //regsiter a controller in the module
    app.controller("MainController", ["$scope", MainController]);
}());


//Place holder monster for no results
if( background.websiteList[0] == undefined || background.websiteList[0].websiteVisits < 5){
  document.write('<div class="monsterText">Wow! You are not addicted to any website yet!</div><div class="container"><div class="monster"></div><div class="hair"></div><div class="face"><div class="eyes"><div class="iris"></div></div></div><div class="mouth"></div><div class="drool"></div><div class="teeth"><div></div><div></div></div><div class="text"></div></div>');
  document.getElementById("heading").style.display = "none";
  document.getElementById("websiteList").style.display = "none";
}


