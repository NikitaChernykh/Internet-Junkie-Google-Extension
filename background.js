//Main Website List
var websiteList = [];

//Variables 
var http = "http://";
var https = "https://";

//Get the clean domain name
function extractDomain(url) {
    var domain;
    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    }
    else {
        domain = url.split('/')[0];
    }

    //find & remove port number
    domain = domain.split(':')[0];

    return domain;
}

//Search if the website already exist in the array
function search(websiteName){
	for(var i=0;i<websiteList.length;i++){
		if(websiteList[i].websiteName === websiteName){
			websiteList[i].websiteVisits++;
			return websiteList[i];
		}
	}
	return websiteList[i];
}

//Check if the tab is Activated
chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function (tab) {
        tabUpdatedAndActiveCallback(tab.url);
    });
});

//Check is the tab is Updated 
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, updatedTab) {
    chrome.tabs.query({'active': true}, function (activeTabs) {
        var activeTab = activeTabs[0];
		//if the active tab is updated then is sends a callback
        if (activeTab == updatedTab) {
            tabUpdatedAndActiveCallback(activeTab.url);
        }
    });
});

//Adds/Updateds the array with tab urls
function tabUpdatedAndActiveCallback(newUrl) {
    var websiteName = extractDomain(newUrl);
	var existingWebsite = search(websiteName);
	if(!existingWebsite){
		var website = {websiteName: websiteName, websiteVisits:1};
		websiteList.push(website);
	}
	console.log(websiteList);
}

//Extension watching for tabs that are created
chrome.tabs.onCreated.addListener(function(tab) {         
   //alert("Tab Created");
});

//Extension watching for tabs that are removed
chrome.tabs.onRemoved.addListener(function (tab){
	//alert("Tab Removed");
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