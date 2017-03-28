(function(){
    var app = angular.module("internetJunkie",[]);
    var MainController = function($scope){
        $scope.remove = function(name){
            console.log( name + "removed");
        }
    }
    app.controller("MainController", ["$scope",MainController]);
}());