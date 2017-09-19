// Initialize Firebase
var config = {
     apiKey: "AIzaSyATPYL8AmU4Joh0TAxqcEFKsFCANmnSZBI",
     authDomain: "internt-junkie.firebaseapp.com",
     databaseURL: "https://internt-junkie.firebaseio.com",
     projectId: "internt-junkie",
     storageBucket: "internt-junkie.appspot.com",
     messagingSenderId: "673180643315"
   };
firebase.initializeApp(config);



(function () {
    
    var BGController = function ($scope, authService) {
        firebase.auth().onAuthStateChanged(function(user) {
        console.log('User state change detected from the Background script of the Chrome Extension:', user);
          if(user){
              auth = true;
              authService.authenticated = auth;
              chrome.runtime.sendMessage({auth: "exist"});
          }else{
              auth = false;
              authService.authenticated = auth;
              chrome.runtime.sendMessage({auth: "null"});
          }
        });
        var user = firebase.auth().currentUser;
        if(user){
            console.log("User EXIST: "+user);
            auth = true;
            authService.authenticated = auth;
            console.log(authService.authenticated);
            chrome.runtime.sendMessage({auth: "exist"});
        }else{
            console.log("user is NULLL");
            auth = false;
            authService.authenticated = auth;
            console.log(authService.authenticated);
            chrome.runtime.sendMessage({auth: "null"});
        }
    };
    //regsiter a controller in the module
    app.controller("BGController", ["$scope", "authService", BGController]);
}());


//Main Website List
var websiteList = [];
//Blacklist of websites
var blackList = ["newtab", "www.google.", "chrome://", "localhost"];

//Variables
var globalURL; //URL to avoid count on tab reload
var prevTab = ''; //Check for preveous tab url for stopTime stamp
var activeWIndow;

var auth = false;
//Get the clean domain name
function extractDomain(url) {
    'use strict';
    if (url !== undefined) {
        //vars
        var domain;
        var regex = /(\..*){2,}/;
        
        //find & remove protocol (http, ftp, etc.) and get domain
        if (url.indexOf("://") > -1) {
            domain = url.split('/')[2];
        } else {
            domain = url.split('/')[0];
        }
        //find & remove port number
        domain = domain.split(':')[0];
        
        //removes everything before 1 dot - like: "www"
        if (regex.test(domain)) {
            domain = domain.substring(domain.indexOf(".") + 1);
        }
        return domain;
    }
    return "";
}

//Search if the website already exist in the array
function search(websiteName) {
    for (var i = 0; i < websiteList.length; i++) {
        if (websiteList[i].websiteName === websiteName) {
            return websiteList[i];
        }
    }
    return websiteList[i];
}

//Checks if url is passing a blackList
function blackListCheck(websiteName) {
    for (var b = 0; b < blackList.length; b++) {
        if (websiteName.includes(blackList[b]) || websiteName == "") {
            return true;
        }
    }
    return false; // TODO thnik of a better blacklist
}

//Updates the status of the tab
function updateDeactivationTime(tabURL) {
    var websiteName = extractDomain(tabURL);
    var existingWebsite = search(websiteName);

    if (existingWebsite) {
        var deactivationTime = moment().format();
        var duration = moment.duration(moment(deactivationTime).diff(existingWebsite.startTime));

        if (existingWebsite.timeDifference != null) {
            var duration = duration.add(existingWebsite.timeDifference);
        }
        //format time
        var days = duration.days();
        var hours = duration.hours();
        var min = duration.minutes();
        var sec = duration.seconds();
        formatedTime = {
            "days": days,
            "hours": hours,
            "min": min,
            "sec": sec
        };

        //update values
        existingWebsite.deactivationTime = deactivationTime;
        existingWebsite.timeDifference = duration;
        existingWebsite.formatedTime = formatedTime;
    }
}

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

//Adds or Updateds the array with tab urls
function tabUpdatedAndActiveCallback(newUrl, favIcon, startTime, deactivationTime, timeDifference) {
    //blacklist check
    if (blackListCheck(newUrl) == false) {
        var websiteName = extractDomain(newUrl);
        var existingWebsite = search(websiteName);
        var start = moment().format();
        //favicon check
        if (favIcon === undefined) {
            favIcon = "/images/default_icon.png";
        }
        if (!existingWebsite) {
            //add new website to the list
            var website = {
                websiteName: websiteName,
                favIcon: favIcon,
                websiteVisits: 1,
                startTime: start,
                deactivationTime: "",
            };
            websiteList.push(website);
        } else {
            if (existingWebsite.favIcon == "/images/default_icon.png") {
                existingWebsite.favIcon = favIcon;
            }
            //add tab start time
            existingWebsite.startTime = start;
            //add visits
            existingWebsite.websiteVisits++;
        }
        console.log(websiteList);
        //save the list to the storage
        chrome.storage.local.set({
            'websiteList': websiteList
        });
    } else {
        //log if blocked 
        console.log("blocked website " + newUrl);
    }
}
function windowNowInactive(tabURL){
    var domain = extractDomain(tabURL);
    var existingWebsite = search(domain);
    if (existingWebsite) {
        console.log("this website updated end time because of window focus " + existingWebsite.websiteName);
        var end = moment().format();
        var duration = moment.duration(moment(end).diff(existingWebsite.startTime));

        if (existingWebsite.timeDifference != null) {
            var duration = duration.add(existingWebsite.timeDifference);
        }
        //format time
        var days = duration.days();
        var hours = duration.hours();
        var min = duration.minutes();
        var sec = duration.seconds();
        formatedTime = {
            "days": days,
            "hours": hours,
            "min": min,
            "sec": sec
        };

        //update values
        existingWebsite.deactivationTime = end;
        existingWebsite.timeDifference = duration;
        existingWebsite.formatedTime = formatedTime;
    }
}
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

