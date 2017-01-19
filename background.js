
(function () {

	chrome.browserAction.onClicked.addListener(function () {
		//console.log(tabs);
		myArray = [];
		chrome.tabs.query({},
		function (tabs) {  
			console.log(tabs.length);
			for (var i = 0; i < tabs.length; i++) {
				myArray.push(tabs[i].url);
			}
			obj = JSON.parse(JSON.stringify(myArray));
			console.log(obj);

    	});
	});

})();