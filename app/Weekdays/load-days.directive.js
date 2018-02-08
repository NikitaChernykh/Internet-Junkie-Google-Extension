var moment = require('moment');
module.exports = function(dataService) {
  return{
      link: function (scope){
          scope.dayClick = function(number){
            scope.dayBtn = number;
            scope.showTableHead = true;
            scope.activityMonster = false;
            switch(number){
              case 6:
                scope.today_text = chrome.i18n.getMessage("today_text");
                scope.activityMonster = false;
              break;
              case 5:
                scope.today_text = moment().subtract(1, 'days').format('LL');
                if(!scope.firstDayWebsites || scope.firstDayWebsites.length == 0){
                  scope.activityMonster = true;
                }
                console.log();
              break;
              case 4:
                scope.today_text = moment().subtract(2, 'days').format('LL');
                if(!scope.secondDayWebsites || scope.secondDayWebsites.length == 0){
                  scope.activityMonster = true;
                }
              break;
              case 3:
                scope.today_text = moment().subtract(3, 'days').format('LL');
                if(!scope.thirdDayWebsites || scope.thirdDayWebsites.length == 0){
                  scope.activityMonster = true;
                }
              break;
              case 2:
                scope.today_text = moment().subtract(4, 'days').format('LL');
                if(!scope.forthDayWebsites || scope.forthDayWebsites.length == 0){
                  scope.activityMonster = true;
                }
              break;
              case 1:
                scope.today_text = moment().subtract(5, 'days').format('LL');
                if(!scope.fifthDayWebsites || scope.fifthDayWebsites.length == 0){
                  scope.activityMonster = true;
                }
                break;
              case 0:
                scope.today_text = moment().subtract(6, 'days').format('LL');
                if(!scope.sixthDayWebsites || scope.sixthDayWebsites.length == 0){
                  scope.activityMonster = true;
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
          console.log(error);
          return;
        });
      }
    };
};
