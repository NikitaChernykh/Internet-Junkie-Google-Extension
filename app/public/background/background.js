/* global chrome */
//const moment = require('moment-timezone');

console.log("Background loaded");
chrome.browserAction.setBadgeText({ text: "BETA" });


if(localStorage.getItem('daily_summaries') === null){
    //TODO need to start using require...
    // localStorage.setItem('daily_summaries', [
    //     {
    //         date: moment(),
    //         websiteList:[]
    //     }
    // ]);
    console.log("localStorage initialised...");
}



//init chrome storage
chrome.tabs.onActivated.addListener(function (activeInfo) {
    console.log("onActivated");
    console.log(activeInfo);
    chrome.tabs.get(activeInfo.tabId,(tab)=>{ processTab(tab)});
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    console.log("onUpdated");
    processTab(tab)
});
function processTab (tab) {
    console.log(tab);
    const websiteURL =  tab.url;
    const websiteName =  extractDomain(tab.url);
    if(existCheck(websiteName)){
        console.log("exist");
        // update site entry
    }else{
        console.log("new site");
        // create new site entry

    }
    console.log(`${websiteURL}, ${websiteName}`);
}
// chrome.windows.onFocusChanged.addListener(function(window) {
//     console.log("onFocusChanged");
//     console.log(window);
// });

function existCheck(name, list){
    for (let i = 0; i < list.length; i += 1) {
        if (list[i].websiteName === name) {
            return true;
        }
    }
    return false;
}

function distructureArray (val, devider, index) {
    return val.split(devider)[index];
}
function extractDomain (url){
    if (url !== undefined) {
        let result = url;
        // find & remove protocol (http, ftp, etc.) and get hostname
        if (url.indexOf('://') > -1) {
            result = distructureArray(url, '/', 2);
        } else {
            result = distructureArray(url, '/', 0);
        }

        // find & remove port number after hostname
        result = distructureArray(result, ':', 0);

        // if no dots in the striped url => return empty
        if (result.match(/[.]/gi) === null) {
            return '';
        }
        return result;
    }
}