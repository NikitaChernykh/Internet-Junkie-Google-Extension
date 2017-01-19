//Extension watching for tabs that are reloaded or updated
chrome.tabs.onUpdated.addListener(function(tabid, changeinfo, tab) {
	if (tab.url !== undefined && changeinfo.status == "complete") {
		alert("Tab Updated");
	}
});

//Extension watching for tabs that are created
chrome.tabs.onCreated.addListener(function(tab) {         
   alert("Tab Created");
});

//Extension watching for tabs that are removed
chrome.tabs.onRemoved.addListener(function (tab){
	alert("Tab Removed");
});

//Checks the conection to popup.js
//Puts tabs URLs in the obj array
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
    if (request.connection == "connected")
	{
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
		sendResponse({
        	msg: "connect to background!"
      	});
	}   
});