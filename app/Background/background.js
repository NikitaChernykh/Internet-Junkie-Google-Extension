
var moment = require('moment-timezone');
var UtilitiesModule = require('../../app/Background/utilities.module.js');

var bgModule = {
    pastDays : [],
    websiteList: [],
    blackList: [
      "newtab","chrome://",
      "localhost", "chrome-extension://",
      "about:blank","file://"],
    globalUrl: "",
    prevTab: "",
    lastActiveSince: null,
    myTimer: 0,
    daysfrominstall: 0,
    total:{
      "totalVisits": 0
    },

    saveData: function(){
      chrome.storage.local.set({'blackList': bgModule.blackList});
      chrome.storage.local.set({'pastDays': bgModule.pastDays});
      chrome.storage.local.set({'websiteList': bgModule.websiteList});
    },
    resetBlackList: function(){
      bgModule.blackList = [];
      chrome.storage.local.set({'blackList': []}, function() {
      });
    },
    resetWebsiteList: function(){
      bgModule.websiteList = [];
      chrome.storage.local.set({'websiteList': []}, function() {
      });
    },
    changelastActiveTime: function(hours){
      var now = moment();
      bgModule.lastActiveSince = now.subtract(hours, 'h');
    },
    resetPastDays: function(){
      bgModule.pastDays = [];
      chrome.storage.local.set({'pastDays': []}, function() {
      });
    },
    updateTotalVisits: function(list){
      bgModule.sortWebsiteList(list);
      for(var f = 0; f < list.length; f++){
        if(f < 10){
          bgModule.total.totalVisits += list[f].websiteVisits;
        }
      }
      //TODO add total time
    },
    checkInactiveDays: function(lastActive){
        var inactiveDays = 0;
        if(lastActive === null && isNaN(moment(lastActive).date())){
          return;
        }else{
          if(moment(lastActive).isSame(moment(), 'day') == false){
            //if yesteday
            if(moment(lastActive).date() === moment().add(-1, 'days').date()){
              //savePastDay
              bgModule.savePastDay();
              bgModule.lastActiveSince = null;
            }else{
              var startOfDay = moment().startOf('day');
              inactiveDays = moment.duration(moment(startOfDay).diff(lastActive)).days();
              if( inactiveDays >= 1){
                  bgModule.addEmptyDays(inactiveDays);
                  bgModule.lastActiveSince = null;
              }else{
                  //console.log("don't do anything 2");
              }
            }
          }else{
            return;
        }
      }
    },
    addEmptyDays : function(days){
      bgModule.savePastDay();
      while (days > 0) {
        bgModule.saveEmptyDay();
        days--;
      }
    },
    savePastDay: function(){

      bgModule.updateTotalVisits(bgModule.websiteList);
      var pastDay = {
            "websiteList": bgModule.websiteList.slice(0, 10)
      };
      bgModule.pastDays.unshift(pastDay);
      bgModule.cleanDaysToEqualSeven(bgModule.pastDays);
      chrome.storage.local.set({'pastDays': bgModule.pastDays});
      bgModule.total.totalVisits = 0;
      bgModule.resetWebsiteList();
      bgModule.saveData();
    },
    cleanDaysToEqualSeven: function(pastDays){
      if(pastDays.length > 6){
         bgModule.pastDays = pastDays.slice(0,6);
      }
    },
    saveEmptyDay: function(){
      var pastDay = {
            "websiteList": [],
            "totalVisits": 0
      };
      bgModule.pastDays.unshift(pastDay);
      bgModule.cleanDaysToEqualSeven(bgModule.pastDays);
      chrome.storage.local.set({'pastDays': bgModule.pastDays});
      bgModule.resetWebsiteList();
      bgModule.saveData();
    },
    sortWebsiteList: function(list){
      list = list.sort(function(a,b){
        return b.websiteVisits - a.websiteVisits;
      });
    },
    getResetTime: function(lastActive){
      var timeNow = moment();
      var endOfTheDay = moment().endOf('day');
      var nextResetTime = moment.duration(moment(endOfTheDay).diff(timeNow)).asMilliseconds();
      if(lastActive != null){
        if(moment(lastActive).isSame(moment(), 'day') == false){
          nextResetTime = 0;
        }
      }
      return nextResetTime;
    },
    setDaylyTimer: function(){
      var resetTime = bgModule.getResetTime(bgModule.lastActiveSince);
      bgModule.myTimer = setTimeout(function() {
        'use strict';
        bgModule.sortWebsiteList(bgModule.websiteList);
        bgModule.savePastDay();
        bgModule.lastActiveSince = UtilitiesModule.timeStamp();
        bgModule.setDaylyTimer();
      }, resetTime);
    },
    resetTimer: function (){
      clearTimeout(bgModule.myTimer);
      bgModule.setDaylyTimer();
    },
    extractDomain: function (url){
      if (url !== undefined) {
        var hostname;
        //find & remove protocol (http, ftp, etc.) and get hostname
        if (url.indexOf("://") > -1) {
            hostname = url.split('/')[2];
        }
        else {
            hostname = url.split('/')[0];
        }

        //find & remove port number
        hostname = hostname.split(':')[0];

        //find & remove "?"
        hostname = hostname.split('?')[0];

        //text wiput dots will not pass
        var arr = hostname.match(/[.]/gi);
        if(arr == null){
           return "";
        }
        //removes www. from filtered urls
        if(hostname.substring(0,4) == "www."){
          hostname = hostname.slice(4);
        }
        return hostname;
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
      //prevent from empty entry needs refactor leter
      if(tabURL == ""){
        return;
      }
      var websiteName = bgModule.extractDomain(tabURL);
      var existingWebsite = bgModule.search(websiteName);
      if (existingWebsite) {
          var deactivationTime = moment().format();
          var duration = moment.duration(moment(deactivationTime).diff(existingWebsite.startTime));

          if (existingWebsite.timeDifference != null) {
              duration = duration.add(existingWebsite.timeDifference);
          }
          var formatedTime = {
              "days": duration.days(),
              "hours": duration.hours(),
              "min": duration.minutes(),
              "sec": duration.seconds()
          };
          //update values
          existingWebsite.deactivationTime = deactivationTime;
          existingWebsite.timeDifference = duration;
          existingWebsite.formatedTime = formatedTime;
      }
      bgModule.saveData();
    },
    tabUpdatedAndActive: function (newUrl, favIcon) {
      //prevent from empty entry needs refactor leter
      //could be similar issue with favicon url
      if(newUrl === "" || typeof newUrl === "undefined"){
        return;
      }
      if(typeof favIcon === "undefined"){
        favIcon = "/assets/images/default_icon.png";
      }
      //blacklist check
      if (bgModule.blackListCheck(newUrl) == false) {
          var websiteName = bgModule.extractDomain(newUrl);
          var existingWebsite = bgModule.search(websiteName);
          var start = moment().format();
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

//for web console testing
//to call methods from the web console use window.test.[name of the method]
//window.test = bgModule;
