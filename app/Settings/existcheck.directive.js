module.exports = function() {
  var searchBlacklist = function(name,list){
    for (var i = 0; i < list.length; i++) {
        if (list[i] === name) {
            return false;
        }
    }
    return true;
  };
  return{
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, element, attr, ngModel) {
      ngModel.$parsers.unshift(function(value) {
        var valid = searchBlacklist(value.toLowerCase(),scope.blackList);
        if(value){
          ngModel.$setValidity('invalidEntry', valid);
        }
        return valid ? value : undefined;
      });
    }
  };
};
