
var bgModule = {
    websiteList: [],
    blackList: ["newtab", "www.google.", "chrome://", "localhost", "chrome-extension://"],
    globalUrl: "",
    prevTab: "",
    inFocus: false,
    extractDomain: function(url){
       'use strict';
        if (url !== undefined) {
            //vars
            var domain;
            var regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
            if (regex.test(url)) {
                //find & remove protocol (http, ftp, etc.) and get domain
                if (url.indexOf("://") > -1) {
                    domain = url.split('/')[2];
                } else {
                    domain = url.split('/')[0];
                }
                //find & remove port number
                domain = domain.split(':')[0];
                
                var arr = domain.match(/[.]/gi);
                var counter = arr.length;
                while(counter > 1){
                    domain = domain.substr(domain.indexOf('.')+1);
                    counter--;
                }
                return domain;
            }
            return "";
        }
        return ""; 
    },
    search: function (websiteName) {
        for (var i = 0; i < bgModule.websiteList.length; i++) {
            if (bgModule.websiteList[i].websiteName === websiteName) {
                return bgModule.websiteList[i];
            }
        }
        return bgModule.websiteList[i];
    },
    blackListCheck: function (websiteName) {
        for (var b = 0; b < bgModule.blackList.length; b++) {
            if (websiteName.includes(bgModule.blackList[b]) || websiteName == "") {
                return true;
            }
        }
        return false; // TODO thnik of a better blacklist
    },
    updateDeactivationTime: function (tabURL) {
        var websiteName = bgModule.extractDomain(tabURL);
        var existingWebsite = bgModule.search(websiteName);

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
            var formatedTime = {
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
    },
    windowNowInactive: function (tabURL){
        var domain = bgModule.extractDomain(tabURL);
        var existingWebsite = bgModule.search(domain);
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
            var formatedTime = {
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
    },
    tabUpdatedAndActiveCallback: function (newUrl, favIcon, startTime, deactivationTime, timeDifference) {
        //blacklist check
        if (bgModule.blackListCheck(newUrl) == false) {
            var websiteName = bgModule.extractDomain(newUrl);
            var existingWebsite = bgModule.search(websiteName);
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
                bgModule.websiteList.push(website);
            } else {
                if (existingWebsite.favIcon == "/assets/images/default_icon.png") {
                    existingWebsite.favIcon = favIcon;
                }
                //add tab start time
                existingWebsite.startTime = start;
                //add visits
                existingWebsite.websiteVisits++;
            }
            console.log(bgModule.websiteList);
            //save the list to the storage
            chrome.storage.local.set({
                'websiteList': bgModule.websiteList
            });
        } else {
            //log if blocked 
            console.log("blocked website " + newUrl);
        }
    }
}
module.exports = bgModule;

