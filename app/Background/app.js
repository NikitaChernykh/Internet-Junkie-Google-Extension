const bgModule = require('../../app/Background/background.js');
const UtilitiesModule = require('../../app/Background/utilities.js');

bgModule.setDaylyTimer();

chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.query({active: true, currentWindow: true},function(tabs){
    if(typeof bgModule.prevTab == "undefined"){
      bgModule.prevTab = UtilitiesModule.extractDomain(tabs[0].url);
    }else{
      bgModule.updateDeactivationTime(bgModule.prevTab);
      bgModule.prevTab = UtilitiesModule.extractDomain(tabs[0].url);
    }
  });
  chrome.tabs.get(activeInfo.tabId, function(tab){
    if(chrome.runtime.lastError){
      var errorMsg = chrome.runtime.lastError.message;
      console.log(errorMsg);
    }else{
      if(tab.active && tab.url != "chrome://newtab/"){
        bgModule.tabUpdatedAndActive(tab.url, tab.favIconUrl);
        bgModule.globalURL = tab.url;
      }
    }
  });
});
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch(request.action) {
    case "popup": {
      bgModule.updateTotalVisits(bgModule.websiteList);
      bgModule.checkInactiveDays(bgModule.lastActiveSince);
      bgModule.resetTimer();
      console.log("Popup was open...");
      break;
    }
    case "remove": {
      bgModule.websiteList = request.list;
      chrome.storage.local.set({'websiteList': bgModule.websiteList}, function () {});
      console.log("Website was removed and saved...");
      break;
    }
    case "updateBlackList": {
      bgModule.blacklist = request.blacklist;
      chrome.storage.local.set({'blacklist': bgModule.blacklist}, function () {});
      console.log("Blacklist was updated and saved...");
      break;
    }
    default: {
      console.log("onMessage default choice...");
      break;
    }
  }
});
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  //check for inactive tab reloading
  if (tab.active && tab.url !== "chrome://newtab/" && changeInfo.status === "complete") {
    bgModule.tabUpdatedAndActive(tab.url, tab.favIconUrl);
    bgModule.updateDeactivationTime(bgModule.prevTab);
    bgModule.prevTab = UtilitiesModule.extractDomain(tab.url);
    bgModule.globalURL = tab.url;
  }
});

// Check if chrome is out of focus or pc in sleep mode
chrome.windows.onFocusChanged.addListener(function(window) {
  chrome.windows.getCurrent(function(win){
    if(win.type !== "normal" || window === chrome.windows.WINDOW_ID_NONE){
      if(bgModule.prevTab !== ""){
        bgModule.updateDeactivationTime(bgModule.prevTab);
      }
      bgModule.globalURL = bgModule.prevTab;
      //console.log("chrome is not active " );
      bgModule.updateTotalVisits(bgModule.websiteList);
      bgModule.checkInactiveDays(bgModule.lastActiveSince);
      bgModule.resetTimer();
      bgModule.lastActiveSince = UtilitiesModule.timeStamp();
    }else {
      //set current active to start the timer
      chrome.tabs.query({active: true, currentWindow: true},function(tabs){
        var websiteName = UtilitiesModule.extractDomain(tabs[0].url);
        var favIcon = tabs[0].favIconUrl;
        if(bgModule.prevTab !== ""){
          bgModule.updateDeactivationTime(bgModule.prevTab);
          bgModule.prevTab = websiteName;//to reset prevTab to be up to date.
          bgModule.globalURL = websiteName;//? why?
          bgModule.tabUpdatedAndActive(websiteName, favIcon);
        }else{
          bgModule.prevTab = websiteName;
        }
      });
      //console.log("chrome is active ");
      //get totalVisits
      bgModule.updateTotalVisits(bgModule.websiteList);
      bgModule.checkInactiveDays(bgModule.lastActiveSince);
      bgModule.resetTimer();
    }
  });
});
