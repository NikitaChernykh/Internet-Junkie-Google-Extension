var moment = require('moment');
module.exports = function($q) {
  var getWebsites = function () {
    var deferred = $q.defer();
    chrome.storage.local.get(function( data ) {
			if (!data) {
				deferred.reject('Error: No data for website list.');
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
				deferred.reject('Error: No data for past days.');
			} else {
				deferred.resolve(data.pastDays);
			}
		});
		return deferred.promise;
  };

  var getTotalTimeAndVisits = function () {
    var deferred = $q.defer();
    chrome.storage.local.get(function( data ) {
      if(data === undefined){
        deferred.reject('Error: No data availble from chrome storage.');
			} else {
        var totalObj = calucalteTotal(data.websiteList);
				deferred.resolve(totalObj);
			}
		});
		return deferred.promise;
  };

  //Helpers
  var calucalteTotal = function(websiteList){
      var totalVisits = 0;
      var totalSeconds = 0;
      var total = {};
      websiteList = websiteList.sort(function(a, b){return b.websiteVisits - a.websiteVisits;});
      for(var f = 0; f < websiteList.length; f++){
        if(f < 10){
          totalVisits += websiteList[f].websiteVisits;
          totalSeconds += websiteList[f].formatedTime.min*60;
          totalSeconds += websiteList[f].formatedTime.sec;
          totalSeconds += (websiteList[f].formatedTime.hours*60)*60;
          totalSeconds += ((websiteList[f].formatedTime.days*24)*60)*60;
          total = {
            totalVisits: totalVisits,
            totalTime: convertSecondsToTimeFormat(totalSeconds)
          };
        }
      }
      return total;
  };

  var convertSecondsToTimeFormat = function(seconds){
    var totalTime = {
      hours : moment(0).utc().seconds(seconds).format('H'),
      minutes : moment(0).utc().seconds(seconds).format('mm'),
      seconds : moment(0).utc().seconds(seconds).format('ss')
    };
    return totalTime;
  };

  return {
    getTotalTimeAndVisits: getTotalTimeAndVisits,
    getPastDays : getPastDays,
    getWebsites : getWebsites
  };
};
