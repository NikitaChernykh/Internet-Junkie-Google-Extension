app.directive('remove',function(){
    return{
        link: function (scope,element,attrs,controller){
            element.on('click', function(event){
                scope.websites.splice(scope.websites.indexOf(scope.website), 1);
                scope.$apply();
                _gaq.push(['_trackEvent', scope.website.websiteName, 'websiteRemoved']);
                chrome.runtime.sendMessage({
                    action: "remove",
                    list: scope.websites
                });
            });
        }
    }
});
