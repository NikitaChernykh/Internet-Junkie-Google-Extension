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
      console.log("running");
      ngModel.$parsers.unshift(function(value) {
        console.log(value);
        if(value){
          // test and set the validity

          console.log(scope.blackList);
          var valid = searchBlacklist(value,scope.blackList);
          console.log(valid);
          ngModel.$setValidity('invalidEntry', valid);
        }
        return valid ? value : undefined;
      });
    }
  };
}
