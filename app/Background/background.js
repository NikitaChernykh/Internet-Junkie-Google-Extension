
var moment = require('moment');
var bgModule = {
    websiteList: [],
    topTenYesterday: [],
    blackList: ["newtab", "google.", "chrome://", "localhost", "chrome-extension://"],
    globalUrl: "",
    prevTab: "",
    daysfrominstall: 0,
    inFocus: false,
    blackListInit: function(){
      chrome.storage.local.set({'blackList': bgModule.blackList}, function() {});
      chrome.storage.local.set({'topTenYesterday': bgModule.topTenYesterday}, function() {});
    },
    resetBlackList: function(){
      chrome.storage.local.set({'blackList': []}, function() {
      });
    },
    resetWebsiteList: function(){
      chrome.storage.local.set({'websiteList': []}, function() {
      });
    },
    resetAtMidnight: function(){
      var now = moment();
      var endoftheday = moment().endOf('day');
      var nextreset = moment.duration(moment(endoftheday).diff(now));
      bgModule.daysfrominstall++;
      setTimeout(function() {
        'use strict';
        console.log("day reset test");
        //TODO test sort
        // var thisday = bgModule.websiteList.sort(function(a,b){
        //   return b.websiteVisits - a.websiteVisits;
        // });
        console.log("daysfrominstall "+bgModule.daysfrominstall);
        bgModule.topTenYesterday = bgModule.websiteList;
        bgModule.topTenYesterday.slice(0,9);
        console.log(bgModule.topTenYesterday);
        console.log(bgModule.websiteList);
        //bgModule.websiteList = [];
        bgModule.saveData();
        bgModule.saveTopYesterday();
        bgModule.resetAtMidnight();
        console.log(bgModule.daysfrominstall);
      }, 1800000);
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
    saveData: function(){
      chrome.storage.local.set({'websiteList': bgModule.websiteList}, function() {
      });
      chrome.storage.local.set({'blackList': bgModule.blackList}, function() {
      });
    },
    saveTopYesterday : function () {
      chrome.storage.local.set({'topTenYesterday': bgModule.topTenYesterday}, function() {
      });
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
      bgModule.saveData();
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
              //max 30 website cap for faster loading
              if(bgModule.websiteList.length >=30){
                return;
              }
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
          bgModule.saveData();
      } else {
          //log if blocked
          console.log("blocked website: " + newUrl);
      }
    }
};
module.exports = bgModule;
