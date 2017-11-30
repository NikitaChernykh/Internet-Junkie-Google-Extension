module.exports = function() {
  return{
      link: function (scope,element,attrs,controller){
          element.on('click', function(event){
              scope.blackList.splice(scope.blackList.indexOf(scope.item), 1);
              scope.$apply();
              chrome.runtime.sendMessage({
                  action: "removeBlacklist",
                  blackList: scope.blackList
              });
          });
      }
  }
};
