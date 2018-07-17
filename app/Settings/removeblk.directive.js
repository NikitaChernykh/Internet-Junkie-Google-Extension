module.exports = function() {
  return{
      link: function (scope,element,attrs,controller){
          element.on('click', function(event){
              scope.blacklist.splice(scope.blacklist.indexOf(scope.item), 1);
              scope.$apply();
              _gaq.push(['_trackEvent', scope.item ,'removedBlackListItem']);
              chrome.runtime.sendMessage({
                  action: "updateBlackList",
                  blackList: scope.blacklist
              });
          });
      }
  };
};
