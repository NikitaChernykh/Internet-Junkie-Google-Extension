var moment = require('moment');
module.exports = function(dataService) {
  return{
      link: function (scope){
          scope.dayClick = function(number){
            scope.dayBtn = number;
            scope.showTableHead = true;
            switch(number){
              case 6:
                scope.today_text = chrome.i18n.getMessage("today_text");
              break;
              case 5:
                scope.today_text = moment().subtract(1, 'days').format('LL');
              break;
              case 4:
                scope.today_text = moment().subtract(2, 'days').format('LL');
              break;
              case 3:
                scope.today_text = moment().subtract(3, 'days').format('LL');
              break;
              case 2:
                scope.today_text = moment().subtract(4, 'days').format('LL');
              break;
              case 1:
                scope.today_text = moment().subtract(5, 'days').format('LL');
                break;
              case 0:
                scope.today_text = moment().subtract(6, 'days').format('LL');
              break;
              default:
                scope.today_text = chrome.i18n.getMessage("today_text");
              break;
            }
            if(typeof scope.today_text === 'object' || typeof scope.today_text === 'undefined'){
               scope.nodata_text = "There was no activity on this day.";
               scope.showTableHead = true;
            }
          };
          dataService.getPastDays().then(function(result){
              if(result[0].websiteList.length > 0){
                scope.firstDayWebsites = result[0].websiteList;
              }else{
                console.log('no data here for now.');

              }
              if(result[1].websiteList.length > 0){
                scope.secondDayWebsites = result[1].websiteList;
              }else{
                console.log('no data here for now.');
                scope.nodata_text = "no data here for now.";
              }

              scope.thirdDayWebsites = result[2].websiteList;

              scope.forthDayWebsites = result[3].websiteList;

              scope.fifthDayWebsites = result[4].websiteList;

              scope.sixthDayWebsites = result[5].websiteList;
        }).catch(function(error) {
          console.log(error);
          return;
        });
      }
    };
};
