module.exports = function() {
  return{
      link: function (scope,element,attrs,controller){
          element.on('click', function(event){
              scope.blackList.splice(scope.blackList.indexOf(scope.item), 1);
              scope.$apply();
              _gaq.push(['_trackEvent', scope.item ,'removedBlackListItem']);
              chrome.runtime.sendMessage({
                  action: "removeBlacklist",
                  blackList: scope.blackList
              });
          });
      }
  }
};
