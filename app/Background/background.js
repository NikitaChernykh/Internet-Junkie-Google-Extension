
const moment = require('moment-timezone');
const AppLoadService = require('../../app/Background/appLoadService');
const UtilitiesModule = require('../../app/Background/utilities.js');
const Website = require('./Website');

const appLoadService = new AppLoadService();

const WebsiteBlackList = appLoadService.WebsiteBlackList;
const PastDaysList = appLoadService.PastDaysList;
const WebsiteList = appLoadService.WebsiteList;

console.log(WebsiteBlackList.blacklist);
console.log(PastDaysList.pastDays);
console.log(WebsiteList.websiteList);

var bgModule = {
    pastDays : [],
    websiteList: WebsiteList.websiteList,
    blacklist: WebsiteBlackList.blacklist,
    globalUrl: "",
    prevTab: "",
    lastActiveSince: null,
    myTimer: 0,
    daysfrominstall: 0,
    total:{
      "totalVisits": 0
    },
    updateTotalVisits: function(list){
      UtilitiesModule.sortWebsiteList(list);
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
            //PastDaysList.addToList();
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
      WebsiteList.resetList();
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
      WebsiteList.resetList();
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
        UtilitiesModule.sortWebsiteList(bgModule.websiteList);
        bgModule.savePastDay();
        bgModule.lastActiveSince = UtilitiesModule.timeStamp();
        bgModule.setDaylyTimer();
      }, resetTime);
    },
    resetTimer: function (){
      clearTimeout(bgModule.myTimer);
      bgModule.setDaylyTimer();
    },

    updateDeactivationTime: function (tabURL) {
      //prevent from empty entry needs refactor leter
      if(tabURL == ""){
        return;
      }
      var websiteName = UtilitiesModule.extractDomain(tabURL);
      var existingWebsite = UtilitiesModule.search(websiteName,bgModule.websiteList);
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
    },
    tabUpdatedAndActive: function (newUrl, favIcon) {

      if(newUrl === "" || typeof newUrl === "undefined") return;

      if(typeof favIcon === "undefined"){
        favIcon = "/assets/images/default_icon.png";
      }

      //blacklist check
      if (WebsiteBlackList.checkIfExistInList(newUrl) == false) {
        var websiteName = UtilitiesModule.extractDomain(newUrl);
        var existingWebsite = UtilitiesModule.search(websiteName,bgModule.websiteList);
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
          WebsiteList.addToList(website);
        } else {
          if (existingWebsite.favIcon == "/assets/images/default_icon.png") {
              existingWebsite.favIcon = favIcon;
          }
          //add tab start time
          existingWebsite.startTime = start;
          //add visits
          existingWebsite.websiteVisits++;
        }
      }
    }
};
module.exports = bgModule;


//for web console testing
//to call methods from the web console use window.test.[name of the method]
window.test = bgModule;
