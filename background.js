//Main Website List
var websiteList = [];

//Blacklist of websites 
var blackList = [ "newtab","google.","chrome:","localhost"];

//Variables 
var http = "http://";
var https = "https://";

//Unfinished timer
var sec = 0;
setInterval(myTimer, 1000);
function myTimer() {
    sec++;
}


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
	for(var i = 0;i<websiteList.length;i++){
		if(websiteList[i].websiteName === websiteName){
			websiteList[i].websiteVisits++;
			return websiteList[i];
		}	
	}
	return websiteList[i];
}

//Checks if url is passing a blackList
function blackListCheck(websiteName){
	for(var b = 0; b < blackList.length;b++){
		if(websiteName.includes(blackList[b])){
			return true;
		}
	}
	return false;	
}

//Check if the tab is Activated
chrome.tabs.onActivated.addListener(function(activeInfo) {
	chrome.tabs.query({},function(tabs){     
		tabs.forEach(function(tab){
		if(tab.active){
			tabUpdatedAndActiveCallback(tab.url,tab.favIconUrl,true);
			//console.log(tab.url+"  active");
		}else{
			tabUpdatedAndActiveCallback(tab.url,tab.favIconUrl,false);
			//console.log(tab.url+"  not active tab");
		}
		});
 	});
    //chrome.tabs.get(activeInfo.tabId, function (tab) {
		//Added states but not yet done
        //tabUpdatedAndActiveCallback(tab.url,tab.favIconUrl,"activated");
    //});
});

//Check if the tab is Updated 
// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, updatedTab) {
//     chrome.tabs.query({'active': true}, function (activeTabs) {
//         var activeTab = activeTabs[0];
// 		//if the active tab is updated then is sends a callback
//         if (activeTab == updatedTab) {
//             tabUpdatedAndActiveCallback(activeTab.url,"reloaded");
//         }
//     });
// });

//Adds/Updateds the array with tab urls
function tabUpdatedAndActiveCallback(newUrl,favIcon,state) {
	console.log(newUrl + " "+ state);
	if(blackListCheck(newUrl) == false){
		var websiteName = extractDomain(newUrl);
		var existingWebsite = search(websiteName);
		if(!existingWebsite){
			if(favIcon === undefined){
				favIcon = "images/default_icon.png";
			}
			var website = {websiteName: websiteName, favIcon: favIcon, websiteVisits:1, active: state};
			websiteList.push(website);			
		}else{
			existingWebsite.active = state;
		}
		console.log(websiteList);
	}else{
		console.log("blocked website");
	}
}

//Extension watching for tabs that are created
chrome.tabs.onCreated.addListener(function(tab) {         
   //alert("Tab Created");
});

//Extension watching for tabs that are removed
chrome.tabs.onRemoved.addListener(function (tab){
	//alert("Tab Removed");
});
