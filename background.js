//Main Website List
var websiteList = [];

//Blacklist of websites 
var blackList = [ "newtab","google.","chrome:","localhost"];

//Variables 
var http = "http://";
var https = "https://";
var globalURL; //URL to avoid count on tab reload

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
			return websiteList[i];
		}	
	}
	return websiteList[i];
}

//Checks if url is passing a blackList
function blackListCheck(websiteName){
	for(var b = 0; b < blackList.length;b++){
		if(websiteName.includes(blackList[b]) || websiteName == ""){
			return true;
		}
	}
	return false;	
}

//Updates the status of the tab
function updateStatus(status,tabURL){
	var websiteName = extractDomain(tabURL);
	var existingWebsite = search(websiteName);
	if(existingWebsite){
		existingWebsite.active = status;
	}
}
//momentjs time test
//var savedTime;
//Check if the tab is Activated
chrome.tabs.onActivated.addListener(function(activeInfo) {
	//status update
	chrome.tabs.query({},function(tabs){     
		tabs.forEach(function(tab){
			if(tab.active){
				//var timeobj = {time: moment([])}; 
				//savedTime = timeobj;
				updateStatus(true,tab.url);
				//console.log("activeTime "+tab.url +" time: ");
				//console.log(timeobj.time._d);
			}else{
				//var timeobj = {time: moment([])};
				updateStatus(false,tab.url);
				//console.log("stopTime "+tab.url +" time: ");
				//console.log(timeobj.time._d);
				//var diff = moment.duration(moment(savedTime).diff(moment(timeobj)));
				//console.log(diff);
			}
		});
	});
	//get active tab
    chrome.tabs.get(activeInfo.tabId, function (tab) {
		globalURL = tab.url;
        tabUpdatedAndActiveCallback(tab.url,tab.favIconUrl);
    });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
	//comapre if the domain is the same
	if(!tab.url.includes(extractDomain(globalURL))){
		//wait until the url is fully loaded
		if(changeInfo.status == "complete" && tab.status == "complete" && tab.url != undefined){
			if (tab.active && tab.url != "chrome://newtab/"){ 
				tabUpdatedAndActiveCallback(tab.url,tab.favIconUrl);
			}
		}
	}  
});

//Adds/Updateds the array with tab urls
function tabUpdatedAndActiveCallback(newUrl,favIcon) {
	//blacklist check
	if(blackListCheck(newUrl) == false){
		var websiteName = extractDomain(newUrl);
		var existingWebsite = search(websiteName);
		if(!existingWebsite){
			//favicon check
			if(favIcon === undefined){
				favIcon = "images/default_icon.png";
			}
			//add new website to the list
			var website = {websiteName: websiteName, favIcon: favIcon, websiteVisits:1,active: true};
			websiteList.push(website);			
		}else{
			//add visits
			existingWebsite.websiteVisits++;
		}
		console.log(websiteList);
	}else{
		console.log("blocked website" + newUrl);
	}
}

//Extension watching for tabs that are created
chrome.tabs.onCreated.addListener(function(tab) {         
});

//Extension watching for tabs that are removed
chrome.tabs.onRemoved.addListener(function (tab){
});
