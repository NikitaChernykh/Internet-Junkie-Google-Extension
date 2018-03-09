module.exports = function($q) {
  var getData = function () {
    var deferred = $q.defer();
    chrome.storage.local.get(function( data ) {
			if (!data) {
				deferred.reject('No data availble from chrome storage.');
			} else {
				deferred.resolve(data);
			}
		});
		return deferred.promise;
  };
  var getPastDays = function () {
    var deferred = $q.defer();
    chrome.storage.local.get(function( data ) {
			if (data.pastDays.length == 0) {
				deferred.reject('Past days have no data yet.');
			} else {
				deferred.resolve(data.pastDays);
			}
		});
		return deferred.promise;
  };

  var getTotalVisits = function(){
      getData().then(function(result){
        websiteList = result.websiteList;
        var totalVisits = 0;
        var totalDays = 0;
        var totalHours = 0;
        var totalMin = 0;
        var totalSec = 0;
        var totalTime = 0;
        var total = {};
        var getTotal = function(length,list){
          totalVisits += list[length].websiteVisits;
          totalDays += list[length].formatedTime.days;
          totalHours += list[length].formatedTime.hours;
          totalMin += list[length].formatedTime.min;
          totalSec += list[length].formatedTime.sec;
        };
        console.log(websiteList);
        if(websiteList.length>10){
          for(var i = 0; i < 10; i++){
                getTotal(i,websiteList);
            }
        }else{
          for(var f = 0; f < websiteList.length; f++){
                getTotal(f,websiteList);
            }
        }
        total = {
          totalVisits :totalVisits,
          totalDays : totalDays,
          totalHours : totalHours,
          totalMin : totalMin,
          totalSec: totalSec
        };
        console.log(total);
        return total;
      });
  };
  getTotalVisits();
  
  return {
    getPastDays : getPastDays,
    getData : getData
  };
};
