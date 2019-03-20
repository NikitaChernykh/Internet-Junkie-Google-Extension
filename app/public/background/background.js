/* global chrome */
const moment = require('moment-timezone');

console.log("Background loaded");

function loadData(key,callback){
    chrome.storage.local.get(key, function(data){
        callback(data);
        return;
    });
}

//clear storage
function clearStorage(){
    chrome.storage.local.clear();
    console.log("clearStorage ran");
}

init();

function init(){
    chrome.browserAction.setBadgeText({ text: "BETA" });
    loadData('daily_summaries',data => {
        if(isEmpty(data)){
            console.log(data);
            console.log("localStorage is empty");
            chrome.storage.local.set({'daily_summaries':[
                {
                    date: moment(),
                    websiteList:[],
                    totalVisits: 0,
                    totalTime: null
                }
            ]})
            console.log("localStorage initialised...");
        }else{
            console.log(data);
            console.log("localStorage is not empty");
        }
    });
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}


chrome.tabs.onActivated.addListener(function (activeInfo) {
    console.log("onActivated");
    console.log(activeInfo);
    chrome.tabs.get(activeInfo.tabId,(tab)=>{ processTab(tab)});
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    console.log("onUpdated");
    processTab(tab);
});
function processTab (tab) {
    console.log(tab);
    const websiteURL =  tab.url;
    const websiteName =  extractDomain(tab.url);
    // if(existCheck(websiteName ,daily_summaries[0])){
    //     console.log("exist");
    //     // update site entry
    // } else{
    //     console.log("new site");
    //     // create new site entry

    // }
    console.log(`${websiteURL}, ${websiteName}`);
}
// chrome.windows.onFocusChanged.addListener(function(window) {
//     console.log("onFocusChanged");
//     console.log(window);
// });

function existCheck(name, list){
    console.log(list);
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