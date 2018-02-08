var bgModule = require('../../app/Background/background.js');

//reset for arrays on app reload
bgModule.resetAtMidnight();
bgModule.resetPastDays();
// bgModule.resetWebsiteList();
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
            console.error(errorMsg);
        }else{
            if(tab.active && tab.url != "chrome://newtab/"){
                bgModule.tabUpdatedAndActive(tab.url, tab.favIconUrl);
                bgModule.globalURL = tab.url;
            }
        }
    });
});
//Check if the tab is Updated
chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
  if(tab.url != "chrome://newtab/"){
      //check for inactive tab reloading
      if (tab.active) {
          //comapre if the domain is the same
          if (!tab.url.includes(bgModule.extractDomain(bgModule.globalURL))) {
              if (changeInfo.status == "complete" && tab.status == "complete" && tab.url != undefined) {
                  if (tab.active && tab.url != "chrome://newtab/") {
                      bgModule.tabUpdatedAndActive(tab.url, tab.favIconUrl);
                      bgModule.updateDeactivationTime(bgModule.prevTab);
                      bgModule.prevTab = bgModule.extractDomain(tab.url);
                      bgModule.globalURL = tab.url;
                  }
              }
          }
      }
    }
    // Passing the above test means this is the event we were waiting for.
    // There is nothing we need to do for future onUpdated events, so we
    // use removeListner to stop getting called when onUpdated events fire.
    chrome.tabs.onUpdated.removeListener(listener);
});
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == "popup") {
        //get websites
        chrome.storage.local.get('websiteList', function (data) {
          //TODO: add logging
        });
        //get blacklist
        chrome.storage.local.get('blackList', function (data) {
        });
        //get pastDays
        chrome.storage.local.get('pastDays', function (data) {
        });
        //get totalVisits
        bgModule.updateTotalVisits(bgModule.websiteList);
        var inactiveDays = bgModule.checkInactiveTime();
        if( inactiveDays >= 1){
            console.log("adding empty days");
            bgModule.addEmptyDays(inactiveDays);
        }else{
            console.log("don't do anything");
        }

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

// Check if chome is out of focus or pc in sleep mode
chrome.windows.onFocusChanged.addListener(function(window) {
    chrome.windows.getCurrent(function(win){
      if(win.type !== "normal" || window === chrome.windows.WINDOW_ID_NONE){
        bgModule.inFocus = false;
        if(bgModule.prevTab !== ""){
          bgModule.updateDeactivationTime(bgModule.prevTab);
        }
        bgModule.globalURL = bgModule.prevTab;
        bgModule.saveData();
        bgModule.lastActiveSince = bgModule.timeStamp();
        console.log("chrome is not active " );
      }else {
          bgModule.inFocus = true;
          chrome.tabs.query({active: true, currentWindow: true},function(tabs){
            if(bgModule.prevTab !== ""){
                bgModule.tabUpdatedAndActive(bgModule.extractDomain(tabs[0].url));
                bgModule.prevTab = bgModule.extractDomain(tabs[0].url);
                bgModule.globalURL = bgModule.extractDomain(tabs[0].url);
            }
          });
          console.log("chrome is active ");
      }
    });
});
