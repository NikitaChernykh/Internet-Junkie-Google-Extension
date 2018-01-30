module.exports = function() {
  return{
      link: function (scope,element,attrs,controller){
          element.on('click', function(event){
              scope.websites.splice(scope.websites.indexOf(scope.website), 1);
              //remove visits and min from totals
              //scope.model.totalVisits -= scope.website.websiteVisits;
              //todo move to background as totalmin
              scope.model.totalVisits = 0;
              scope.model.totalTime = 0;
              if(scope.websites.length >10){
                for(var i = 0; i < 10; i++){
                    scope.model.totalVisits += scope.websites[i].websiteVisits;
                    scope.model.totalTime += scope.websites[i].formatedTime.min+(scope.websites[i].formatedTime.hours*60)+((scope.websites[i].formatedTime.days*24)*60);
                }
              }else{
                for(var r = 0; r < scope.websites.length; r++){
                    scope.model.totalVisits += scope.websites[r].websiteVisits;
                    scope.model.totalTime += scope.websites[r].formatedTime.min+(scope.websites[r].formatedTime.hours*60)+((scope.websites[r].formatedTime.days*24)*60);
                }
              }
              scope.$apply();
              _gaq.push(['_trackEvent', scope.website.websiteName, 'websiteRemoved']);
              chrome.runtime.sendMessage({
                  action: "remove",
                  list: scope.websites
              });
          });
      }
  };
};
