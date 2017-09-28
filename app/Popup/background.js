//Main Website List
var websiteList = [];
//Blacklist of websites
var blackList = ["newtab", "www.google.", "chrome://", "localhost", "chrome-extension://"];

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
//Adds or Updateds the array with tab urls
function tabUpdatedAndActiveCallback(newUrl, favIcon, startTime, deactivationTime, timeDifference) {
    //blacklist check
    if (blackListCheck(newUrl) == false) {
        var websiteName = extractDomain(newUrl);
        var existingWebsite = search(websiteName);
        var start = moment().format();
        //favicon check
        if (favIcon === undefined) {
            favIcon = "/assets/images/default_icon.png";
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
            if (existingWebsite.favIcon == "/assets/images/default_icon.png") {
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

