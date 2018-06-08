var bgModule = require('../../app/Background/background.js');
var moment = require('moment-timezone');

bgModule.setDaylyTimer();

chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.query({active: true, currentWindow: true},function(tabs){
        if(typeof bgModule.prevTab == "undefined"){
            bgModule.prevTab = bgModule.extractDomain(tabs[0].url);
        }else{
            bgModule.updateDeactivationTime(bgModule.prevTab);
            bgModule.prevTab = bgModule.extractDomain(tabs[0].url);
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

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
      //check for inactive tab reloading
      if (tab.active && tab.url !== "chrome://newtab/" && changeInfo.status === "complete") {
          bgModule.tabUpdatedAndActive(tab.url, tab.favIconUrl);
          bgModule.updateDeactivationTime(bgModule.prevTab);
          bgModule.prevTab = bgModule.extractDomain(tab.url);
          bgModule.globalURL = tab.url;
      }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == "popup") {
        bgModule.updateTotalVisits(bgModule.websiteList);
        chrome.storage.local.get('websiteList', function (data) {
        });
        chrome.storage.local.get('blackList', function (data) {
        });
        chrome.storage.local.get('pastDays', function (data) {
        });
        bgModule.checkInactiveDays(bgModule.lastActiveSince);
        bgModule.resetTimer();
    }
    if (request.action == "remove") {
        bgModule.websiteList = request.list;
        chrome.storage.local.set({'websiteList': bgModule.websiteList}, function() {});
    }
    if(request.action == "updateBlackList"){
        bgModule.blackList = request.blackList;
        chrome.storage.local.set({'blackList': bgModule.blackList}, function() {
      });
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
        bgModule.saveData();
        //console.log("chrome is not active " );
        bgModule.updateTotalVisits(bgModule.websiteList);
        bgModule.checkInactiveDays(bgModule.lastActiveSince);
        bgModule.resetTimer();
        bgModule.lastActiveSince = bgModule.timeStamp();
      }else {
        //set current active to start the timer
          chrome.tabs.query({active: true, currentWindow: true},function(tabs){
            var websiteName = bgModule.extractDomain(tabs[0].url);
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
