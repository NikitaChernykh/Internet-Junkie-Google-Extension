//Check if the tab is Activated
chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.query({active: true, currentWindow: true},function(tabs){
        console.log(tabs[0].url);
        console.log("prev tab at the begining of the query: "+ prevTab);
        if(typeof prevTab == "undefined"){
            prevTab = extractDomain(tabs[0].url);
        }else{
            console.log("prev tab before status update: "+ prevTab);
            updateDeactivationTime(prevTab);
            prevTab = extractDomain(tabs[0].url);
        }
    });
    chrome.tabs.get(activeInfo.tabId, function(tab){
        if(chrome.runtime.lastError){
            var errorMsg = chrome.runtime.lastError.message;
            console.log(errorMsg);
        }else{
            if(tab.active && tab.url != "chrome://newtab/"){
                tabUpdatedAndActiveCallback(tab.url, tab.favIconUrl);
                globalURL = tab.url;
            }
        }
    });
});

//Check if the tab is Updated
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if(tab.url != "chrome://newtab/"){
      //check for anactive tab reloading
      if (tab.active) {
          //comapre if the domain is the same
          if (!tab.url.includes(extractDomain(globalURL))) {
              if (changeInfo.status == "complete" && tab.status == "complete" && tab.url != undefined) {
                  if (tab.active && tab.url != "chrome://newtab/") {
                      tabUpdatedAndActiveCallback(tab.url, tab.favIconUrl);
                      updateDeactivationTime(prevTab);
                      prevTab = extractDomain(tab.url);
                      globalURL = tab.url;
                  }
              }
          }
      }
    }
});


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == "popup") {
        chrome.storage.local.get('websiteList', function (data) {
        console.log("LIST OF WEBSITES FROM STORAGE");
        console.log(data);
        });
    }
    if (request.action == "remove") {
        console.log(request.list);
        websiteList = request.list;
    }
});

// Check if chome is out of focus or pc in sleep mode TODO in progress 
chrome.windows.onFocusChanged.addListener(function(window) {
    if (window == chrome.windows.WINDOW_ID_NONE) {
        inFocus = false;
        console.log("chrome is NOT active");
        console.log("I just stoped: " + prevTab);
        updateDeactivationTime(prevTab);
        globalURL = prevTab;
    } else {
        inFocus = true;
        chrome.tabs.query({active: true, currentWindow: true},function(tabs){
            console.log("I just restarted: " + tabs[0].url);
            console.log("global was: " + globalURL);
            tabUpdatedAndActiveCallback(extractDomain(tabs[0].url));
            prevTab = extractDomain(tabs[0].url);
            globalURL = extractDomain(tabs[0].url);
        });
        console.log("global now: " + globalURL);
        console.log("chrome is active");
    }
});

