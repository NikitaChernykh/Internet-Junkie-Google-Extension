module.exports = function() {
  return{
      link: function (scope,element,attrs,controller){
          element.on('click', function(event){
              console.log("remove");
              console.log(scope.blackList);
              scope.blackList.splice(scope.blackList.indexOf(scope.item), 1);
              console.log(scope.blackList);
              chrome.runtime.sendMessage({
                  action: "removeBlacklist",
                  list: scope.blackList
              });
          });
      }
  }
};
