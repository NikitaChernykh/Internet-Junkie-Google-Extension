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
  //TODO test sort here and on background. They should be exactly same.
  var getTotalVisits = function(){
      getData().then(function(result){
        result.websiteList.sort(function(a, b){return b.websiteVisits - a.websiteVisits;});
        var total = getTotalTime(result.websiteList);
        console.log(total);
      });
  };
  getTotalVisits();

  var getTotalTime = function(websiteList){
    var totalVisits = 0;
    var totalSeconds = 0;
    var total = {};

    for(var f = 0; f < websiteList.length; f++){
      if(f < 10){
        totalVisits += websiteList[f].websiteVisits;
        totalSeconds += websiteList[f].formatedTime.min*60;
        totalSeconds += websiteList[f].formatedTime.sec;
        totalSeconds += (websiteList[f].formatedTime.hours*60)*60;
        totalSeconds += ((websiteList[f].formatedTime.days*24)*60)*60;
        total = {
          totalSeconds: totalSeconds,
          totalVisits: totalVisits
        };
      }
    }
    return total;
  };
  return {
    getPastDays : getPastDays,
    getData : getData
  };
};
