module.exports = function($q) {
  var getData = function () {
    var deferred = $q.defer();
    chrome.storage.local.get(function( data ) {
			if (!data) {
				deferred.reject();
			} else {
				deferred.resolve(data);
			}
		});
		return deferred.promise;
  };
  var getTopTen = function () {
    var deferred = $q.defer();
    chrome.storage.local.get(function( data ) {
			if (!data) {
				deferred.reject();
			} else {
				deferred.resolve(data.pastDays);
			}
		});
		return deferred.promise;
  };
  return {
    getTopTen : getTopTen,
    getData : getData
  };
};
