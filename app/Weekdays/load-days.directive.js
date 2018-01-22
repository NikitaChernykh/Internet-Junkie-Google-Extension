module.exports = function(dataService) {
  return{
      link: function (scope,element,attrs,controller){
          dataService.getTopTen().then(function(result){
              scope.firstDayWebsites = result[0].websiteList;
              scope.secondDayWebsites = result[1].websiteList;
              scope.thirdDayWebsites = result[2].websiteList;
              scope.forthDayWebsites = result[3].websiteList;
              scope.fifthDayWebsites = result[4].websiteList;
              scope.sixthDayWebsites = result[5].websiteList;
        });
      }
    };
};
