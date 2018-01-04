'use strict';
var moment = require('moment');
var bgModule = {
    websiteList: [],
    blackList: ["newtab", "google.", "chrome://", "localhost", "chrome-extension://"],
    globalUrl: "",
    prevTab: "",
    inFocus: false,
    blackListInit: function(){
      chrome.storage.local.set({'blackList': bgModule.blackList}, function() {});
    },
    resetBlackList: function(){
      chrome.storage.local.set({'blackList': []}, function() {
      });
    },
    resetWesiteList: function(){
      chrome.storage.local.set({'websiteList': []}, function() {
      });
    },
    resetAtMidnight: function(){
      //Declare now date
      //Declare night date(end of day)

      //Declare the time left to next day
      //var msToMidnight = night.getTime() - now.getTime();

      //set timeout
      setTimeout(function() {
        console.log("day reset test");
        //reset();              //      This is the function being called at midnight.
        bgModule.resetAtMidnight();    //      Then, reset again next midnight.
      }, 5000);                 //      Shoud be msToMidnight time to next day

      //run resetAtMidnight on the first load of the application.
    },
    extractDomain: function (url){
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
          var arr = domain.match(/[.]/gi);
          if(arr == null){
             return "";
          }
          var counter = arr.length;
          while(counter > 1){
              domain = domain.substr(domain.indexOf('.')+1);
              counter--;
          }
          return domain;
      }
      return "";
    },
    search: function (websiteName){
      for (var i = 0; i < bgModule.websiteList.length; i++) {
          if (bgModule.websiteList[i].websiteName === websiteName) {
              return bgModule.websiteList[i];
          }
      }
      return null;
    },
    blackListCheck: function (websiteName) {
      for (var b = 0; b < bgModule.blackList.length; b++) {
          if (websiteName.includes(bgModule.blackList[b])) {
              return true;
          }
      }
      return false;
    },
    updateDeactivationTime: function (tabURL) {
      var websiteName = bgModule.extractDomain(tabURL);
      var existingWebsite = bgModule.search(websiteName);
      if (existingWebsite) {
          var deactivationTime = moment().format();
          var duration = moment.duration(moment(deactivationTime).diff(existingWebsite.startTime));

          if (existingWebsite.timeDifference != null) {
              duration = duration.add(existingWebsite.timeDifference);
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
      chrome.storage.local.set({'websiteList': bgModule.websiteList}, function() {
      });
    },
    tabUpdatedAndActive: function (newUrl, favIcon) {
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
          //save the webiste list to the storage
          chrome.storage.local.set({'websiteList': bgModule.websiteList}, function() {
          });
      } else {
          //log if blocked
          console.log("blocked website: " + newUrl);
      }
    }
};
module.exports = bgModule;
