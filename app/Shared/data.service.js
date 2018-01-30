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
  return {
    getPastDays : getPastDays,
    getData : getData
  };
};
