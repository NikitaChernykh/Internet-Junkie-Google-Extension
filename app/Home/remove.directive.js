module.exports = function(dataService) {
  return{
      link: function (scope,element,attrs,controller){
          element.on('click', function(event){
              //remove website for the list
              scope.websites.splice(scope.websites.indexOf(scope.website), 1);
              //reset values
              scope.model.totalVisits = 0;
              scope.model.totalTime = {};

              //update total values
              var result = dataService.updateTotalTimeAndVisits(scope.websites);
              scope.model.totalVisits = result.totalVisits;
              scope.model.totalTime = result.totalTime;
              scope.$apply();

              //update background websitelist
              _gaq.push(['_trackEvent', scope.website.websiteName, 'websiteRemoved']);
              chrome.runtime.sendMessage({
                  action: "remove",
                  list: scope.websites
              });
          });
      }
  };
};
