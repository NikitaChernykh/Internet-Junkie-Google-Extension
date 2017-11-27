module.exports = function($q) {

  var searchBlacklist = function(name,list){
    for (var i = 0; i < list.length; i++) {
        if (list[i].websiteName === name) {
            return true;
        }
    }
    return null;
  };
  return{
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, element, attr, ngModel) {
      //  ngModel.$asyncValidators.invalidEntry = function(modelValue, viewValue) {
      //      var deferred = $q.defer();
      //      console.log(searchBlacklist(viewValue,scope.blackList));
      //      return deferred.promise;// validation logic here
      //  }

    }
  }
}
