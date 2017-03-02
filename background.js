//Google Analytics Start
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-91876786-1']);
_gaq.push(['_trackPageview']);

var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
ga.src = 'https://ssl.google-analytics.com/ga.js';
var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
//Google Analytics End


//Main Website List
var websiteList = [];

//Blacklist of websites 
var blackList = [ "newtab","www.google.","chrome:","localhost"];

//Variables 
var globalURL; //URL to avoid count on tab reload
var prevTab = ''; //Check for preveous tab url for stopTime stamp

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
//maybe needs refactoring
function updateStatus(tabURL){
	var websiteName = extractDomain(tabURL);
	var existingWebsite = search(websiteName);
	var end = moment().format();
	if(existingWebsite){

		var duration = moment.duration(moment(end).diff(existingWebsite.startTime));

		if(existingWebsite.timeDifference != null){
			var duration = duration.add(existingWebsite.timeDifference);
		}
		//format time
		formatedTime = moment.utc(duration.as('milliseconds')).format('HH:mm:ss');

		//update values
		existingWebsite.endTime = end;
		existingWebsite.timeDifference = duration;
		existingWebsite.formatedTime = formatedTime;
	}
}

//Check if the tab is Activated
//maybe needs refactoring
chrome.tabs.onActivated.addListener(function(activeInfo) {
	//status update
	chrome.tabs.query({},function(tabs){     
		tabs.forEach(function(tab){
			if(prevTab != ''){
				if(tab.active && prevTab != extractDomain(tab.url)){
					updateStatus(prevTab);
					prevTab = extractDomain(tab.url);
				}
			}
			if(prevTab == ''){
				if(tab.active){
					prevTab = extractDomain(tab.url);
				}
			}
		});
	});
	chrome.tabs.get(activeInfo.tabId, function (tab) {
		if (tab.active && tab.url != "chrome://newtab/"){
			tabUpdatedAndActiveCallback(tab.url,tab.favIconUrl);
			globalURL = tab.url;
		}
	});
});

//Check if the tab is Updated
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
	//check for anactive tab reloading
	if(tab.active){
		//comapre if the domain is the same
		if(!tab.url.includes(extractDomain(globalURL))){
			if(changeInfo.status == "complete" && tab.status == "complete" && tab.url != undefined){
				if (tab.active && tab.url != "chrome://newtab/"){
					tabUpdatedAndActiveCallback(tab.url,tab.favIconUrl);
					updateStatus(prevTab);
					prevTab = extractDomain(tab.url); 
					globalURL = tab.url;
				}
			}
		}
	}  
});

//Adds/Updateds the array with tab urls
//maybe needs refactoring
function tabUpdatedAndActiveCallback(newUrl,favIcon,startTime,endTime,timeDifference) {
	//blacklist check
	if(blackListCheck(newUrl) == false){
		var websiteName = extractDomain(newUrl);
		var existingWebsite = search(websiteName);
		var start = moment().format();
		//favicon check
		if(favIcon === undefined){
				favIcon = "images/default_icon.png";
		}
		if(!existingWebsite){
			//add new website to the list
			
			var website = {
				websiteName: websiteName,
				favIcon: favIcon,
				websiteVisits:1,
				startTime : start,
				endTime: "",
			};
			websiteList.push(website);			
		}else{
			if(existingWebsite.favIcon == "images/default_icon.png"){
				existingWebsite.favIcon = favIcon;
			}
			
			existingWebsite.startTime = start;
			//add visits
			existingWebsite.websiteVisits++;
		}
		console.log(websiteList);
	}else{
		console.log("blocked website " + newUrl);
	}
}

//Extension watching for tabs that are created
chrome.tabs.onCreated.addListener(function(tab) {         
});

//Extension watching for tabs that are removed
chrome.tabs.onRemoved.addListener(function (tab){
});
