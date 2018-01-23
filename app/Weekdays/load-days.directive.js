module.exports = function(dataService) {
  return{
      link: function (scope,element,attrs,controller){
          dataService.getTopTen().then(function(result){

              scope.firstDayWebsites = result[0].websiteList;
              scope.firstDayWebsitesDate = result[0].date;

              scope.secondDayWebsites = result[1].websiteList;
              scope.secondDayWebsitesDate = result[1].date;

              scope.thirdDayWebsites = result[2].websiteList;
              scope.thirdDayWebsitesDate = result[2].date;

              scope.forthDayWebsites = result[3].websiteList;
              scope.forthDayWebsitesDate = result[3].date;

              scope.fifthDayWebsites = result[4].websiteList;
              scope.fifthDayWebsitesDate = result[4].date;

              scope.sixthDayWebsites = result[5].websiteList;
              scope.sixthDayWebsitesDate = result[5].websiteList;
        });
      }
    };
};
