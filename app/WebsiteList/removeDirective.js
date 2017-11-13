module.exports = function() {
  return{
      link: function (scope,element,attrs,controller){
          element.on('click', function(event){
              scope.websites.splice(scope.websites.indexOf(scope.website), 1);
              //remove visits and min from totals
              scope.model.totalVisits -= scope.website.websiteVisits;
              //todo move to background as totalmin
              scope.model.totalTime -= scope.website.formatedTime.min+(scope.website.formatedTime.hours*60)+((scope.website.formatedTime.days*24)*60);
              _gaq.push(['_trackEvent', scope.website.websiteName, 'websiteRemoved']);
              chrome.runtime.sendMessage({
                  action: "remove",
                  list: scope.websites
              });
          });
      }
  }
};
