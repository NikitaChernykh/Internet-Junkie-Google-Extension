module.exports = function(dataService) {
  return{
      link: function (scope){
          scope.dayClick = function(number){
            scope.dayBtn = number;
            switch(number){
              case 6:
                scope.today_text = chrome.i18n.getMessage("today_text");
              break;
              case 5:
                scope.today_text = scope.firstDayWebsitesDate;
              break;
              case 4:
                scope.today_text = scope.secondDayWebsitesDate;
              break;
              case 3:
                scope.today_text = scope.thirdDayWebsitesDate;
              break;
              case 2:
                scope.today_text = scope.forthDayWebsitesDate;
              break;
              case 1:
                scope.today_text = scope.fifthDayWebsitesDate;
                break;
              case 0:
                scope.today_text = scope.sixthDayWebsitesDate;
              break;
              default:
                scope.today_text = chrome.i18n.getMessage("today_text");
              break;
            }
            if(typeof scope.today_text === 'object' || typeof scope.today_text === 'undefined'){
               scope.today_text = "No data available yet";
            }
          };
          dataService.getPastDays().then(function(result){
              if(result[0].websiteList.length > 0){
                scope.firstDayWebsites = result[0].websiteList;
                scope.firstDayWebsitesDate = result[0].date;
              }else{
                console.log('no data here for now.');
              }
              if(result[1].websiteList.length > 0){
                scope.secondDayWebsites = result[1].websiteList;
                scope.secondDayWebsitesDate = result[1].date;
              }else{
                console.log('no data here for now.');
              }

              scope.thirdDayWebsites = result[2].websiteList;
              scope.thirdDayWebsitesDate = result[2].date;

              scope.forthDayWebsites = result[3].websiteList;
              scope.forthDayWebsitesDate = result[3].date;

              scope.fifthDayWebsites = result[4].websiteList;
              scope.fifthDayWebsitesDate = result[4].date;

              scope.sixthDayWebsites = result[5].websiteList;
              scope.sixthDayWebsitesDate = result[5].date;
        }).catch(function(error) {
          console.log(error);
          return;
        });
      }
    };
};
