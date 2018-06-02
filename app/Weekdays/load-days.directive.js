var moment = require('moment');
module.exports = function(dataService) {
  return{
      link: function (scope){
          scope.dayClick = function(number){
            scope.dayBtn = number;
            scope.showTableHead = true;
            scope.activityMonster = false;
            scope.statisticsMonster = true;
            switch(number){
              case 6:
                scope.today_text = chrome.i18n.getMessage("today_text");
                scope.activityMonster = false;
                scope.statisticsMonster = false;
                var result6 = dataService.calculateTotal(scope.websites);
                scope.model.totalVisits = result6.totalVisits;
                scope.model.totalTime = result6.totalTime;
              break;
              case 5:
                scope.today_text = moment().subtract(1, 'days').format('LL');
                if(!scope.firstDayWebsites || scope.firstDayWebsites.length == 0){
                  scope.activityMonster = true;
                  scope.statisticsMonster = true;
                  scope.model.totalVisits= 0;
                  scope.model.totalTime = {
                    hours : 0,
                    minutes :0,
                    seconds :0
                  };
                }else{
                  var result5 = dataService.calculateTotal(scope.firstDayWebsites);
                  scope.model.totalVisits = result5.totalVisits;
                  scope.model.totalTime = result5.totalTime;
                }
              break;
              case 4:
                scope.today_text = moment().subtract(2, 'days').format('LL');
                if(!scope.secondDayWebsites || scope.secondDayWebsites.length == 0){
                  scope.activityMonster = true;
                  scope.statisticsMonster = true;
                  scope.model.totalVisits= 0;
                  scope.model.totalTime = {
                    hours : 0,
                    minutes :0,
                    seconds :0
                  };
                }else{
                  var result4 = dataService.calculateTotal(scope.secondDayWebsites);
                  scope.model.totalVisits = result4.totalVisits;
                  scope.model.totalTime = result4.totalTime;
                }
              break;
              case 3:
                scope.today_text = moment().subtract(3, 'days').format('LL');
                if(!scope.thirdDayWebsites || scope.thirdDayWebsites.length == 0){
                  scope.activityMonster = true;
                  scope.statisticsMonster = true;
                  scope.model.totalVisits= 0;
                  scope.model.totalTime = {
                    hours : 0,
                    minutes :0,
                    seconds :0
                  };
                }else{
                  var result3 = dataService.calculateTotal(scope.thirdDayWebsites);
                  scope.model.totalVisits = result3.totalVisits;
                  scope.model.totalTime = result3.totalTime;
                }
              break;
              case 2:
                scope.today_text = moment().subtract(4, 'days').format('LL');
                if(!scope.forthDayWebsites || scope.forthDayWebsites.length == 0){
                  scope.activityMonster = true;
                  scope.statisticsMonster = true;
                  scope.model.totalVisits= 0;
                  scope.model.totalTime = {
                    hours : 0,
                    minutes :0,
                    seconds :0
                  };
                }else{
                  var result2 = dataService.calculateTotal(scope.forthDayWebsites);
                  scope.model.totalVisits = result2.totalVisits;
                  scope.model.totalTime = result2.totalTime;
                }
              break;
              case 1:
                scope.today_text = moment().subtract(5, 'days').format('LL');
                if(!scope.fifthDayWebsites || scope.fifthDayWebsites.length == 0){
                  scope.activityMonster = true;
                  scope.statisticsMonster = true;
                  scope.model.totalVisits= 0;
                  scope.model.totalTime = {
                    hours : 0,
                    minutes :0,
                    seconds :0
                  };
                }else{
                  var result1 = dataService.calculateTotal(scope.fifthDayWebsites);
                  scope.model.totalVisits = result1.totalVisits;
                  scope.model.totalTime = result1.totalTime;
                }
                break;
              case 0:
                scope.today_text = moment().subtract(6, 'days').format('LL');
                if(!scope.sixthDayWebsites || scope.sixthDayWebsites.length == 0){
                  scope.activityMonster = true;
                  scope.statisticsMonster = true;
                  scope.model.totalVisits= 0;
                  scope.model.totalTime = {
                    hours : 0,
                    minutes :0,
                    seconds :0
                  };
                }else{
                  var result = dataService.calculateTotal(scope.sixthDayWebsites);
                  scope.model.totalVisits = result.totalVisits;
                  scope.model.totalTime = result.totalTime;
                }
              break;
              default:
                scope.today_text = chrome.i18n.getMessage("today_text");
                scope.activityMonster = false;
              break;
            }
          };
          dataService.getPastDays().then(function(data){
              scope.firstDayWebsites = data[0].websiteList;
              scope.secondDayWebsites = data[1].websiteList;
              scope.thirdDayWebsites = data[2].websiteList;
              scope.forthDayWebsites = data[3].websiteList;
              scope.fifthDayWebsites = data[4].websiteList;
              scope.sixthDayWebsites = data[5].websiteList;
      }).catch(function(error) {
          console.error(error);
          // return;
        });
      }
    };
};
