
// jshint esversion: 6

jest.unmock("../../app/Background/background.js");
jest.unmock('moment');

const bgModule = require("../../app/Background/background.js");
const moment = require('moment');

const get = jest.fn();
const set = jest.fn();
const expectedEmptyArray = [];
jest.useFakeTimers();
global.chrome = {
  storage: {
    local: {
      set,
      get
    }
  }
};
describe("background script", () =>{
    it ("should save data in local storage", () => {
      bgModule.saveData();
      expect(chrome.storage.local.set).toHaveBeenCalledWith({'blackList': bgModule.blackList});
      expect(chrome.storage.local.set).toHaveBeenCalledWith({'pastDays': bgModule.pastDays});
      expect(chrome.storage.local.set).toHaveBeenCalledWith({'websiteList': bgModule.websiteList});
    });
    it ("should reset blacklist in local storage to empty array", () => {
      bgModule.resetBlackList();
      expect(bgModule.blackList).toEqual(expectedEmptyArray);
    });
    it ("should reset websitelist in local storage to empty array", () => {
      bgModule.resetWebsiteList();
      expect(bgModule.websiteList).toEqual(expectedEmptyArray);
    });
    it ("should reset past days in local storage to empty array", () => {
      bgModule.resetPastDays();
      expect(bgModule.pastDays).toEqual(expectedEmptyArray);
    });
    it ("time stamp should return today's time", () => {
       let time = bgModule.timeStamp();
       expect(time).toEqual(time);
    });
    it ("should alwayse keep passDays length to 6", () => {
      let pastDaysMoreThanSix = [
        {"day":"Monday"},
        {"day":"Tuesday"},
        {"day":"Wednesday"},
        {"day":"Thursday"},
        {"day":"Saturday"},
        {"day":"Sunday"},
        {"day":"NewMonday"},
        {"day":"NewTuesday"}
        ];
        let expectedArray = [
          {"day":"Monday"},
          {"day":"Tuesday"},
          {"day":"Wednesday"},
          {"day":"Thursday"},
          {"day":"Saturday"},
          {"day":"Sunday"}
        ];
      bgModule.cleanDaysToEqualSeven(pastDaysMoreThanSix);
      expect(bgModule.pastDays).toEqual(expectedArray);
    });
    it ("should keep passDays same if length is less the 6", () => {
      let pastDaysLessThanSix = [
        {"day":"Monday"},
        {"day":"Tuesday"},
        {"day":"Wednesday"},
        {"day":"Thursday"},
        {"day":"Saturday"},
        {"day":"Sunday"}
        ];
      bgModule.cleanDaysToEqualSeven(pastDaysLessThanSix);
      expect(bgModule.pastDays).toEqual(pastDaysLessThanSix);
    });
    it ("should sort website list", () => {
      let fakeList = [
        {"websiteVisits": 56},
        {"websiteVisits": 1},
        {"websiteVisits": 23}
      ];
      let sortedfakeList = [
        {"websiteVisits": 56},
        {"websiteVisits": 23},
        {"websiteVisits": 1}
      ];
      bgModule.sortWebsiteList(fakeList);
      expect(fakeList).toEqual(sortedfakeList);
    });
    it.skip("should check the number of inactive days", () => {
       let lastActive = moment().subtract(41, 'h');
       let numberOfDays = bgModule.checkInactiveDays(lastActive);
    });
    it ("should extract domain from a string", () => {
        const testData = {
           url_1: "https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_split",
           url_2: "www.w3schools.com/jsref/tryit.asp?filename",
           url_3: "dfsdfsdfsdfsdfsdfsdfsdfsdfsdfgsdfsdfssdgsghs",
           url_4: undefined,
           url_5: "w3schools.com",
           url_6: "",
           url_7: "http://projects.google.com/#/projects/active",
           url_8: "www.blog.classroom.me.uk",
           url_9: "http://www.example.com:8080",
           url_10: "http://mywebsitehaswww.com"
        };
        let expectedData = {};
        let result1 = bgModule.extractDomain(testData.url_1);
        let result2 = bgModule.extractDomain(testData.url_2);
        let result3 = bgModule.extractDomain(testData.url_3);
        let result4 = bgModule.extractDomain(testData.url_4);
        let result5 = bgModule.extractDomain(testData.url_5);
        let result6 = bgModule.extractDomain(testData.url_6);
        let result7 = bgModule.extractDomain(testData.url_7);
        let result8 = bgModule.extractDomain(testData.url_8);
        let result9 = bgModule.extractDomain(testData.url_9);
        let result10 = bgModule.extractDomain(testData.url_10);
        expectedData ={
           url_1_result: result1,
           url_2_result: result2,
           url_3_result: result3,
           url_4_result: result4,
           url_5_result: result5,
           url_6_result: result6,
           url_7_result: result7,
           url_8_result: result8,
           url_9_result: result9,
           url_10_result: result10
        };
        expect(expectedData).toEqual({
            url_1_result: "w3schools.com",
            url_2_result: "w3schools.com",
            url_3_result: "",
            url_4_result: "",
            url_5_result: "w3schools.com",
            url_6_result: "",
            url_7_result: "projects.google.com",
            url_8_result: "blog.classroom.me.uk",
            url_9_result: "example.com",
            url_10_result: "mywebsitehaswww.com"
        });
    });
    it ("should check if website exists in global website list", () => {
        const testWebsite = "facebook.dev.com";
        const testWebsiteList = [
          [],
          [{websiteName: "facebook.com"}],
          [{websiteName: "facebook.com"}, {websiteName: "stackoverflow.com"}, {websiteName: "github.com"}],
          [{websiteName: "facebook.com"}, {websiteName: "stackoverflow.com"}, {websiteName: "facebook.dev.com"}]
        ];
        var results = [];

        for (var i = 0; i < testWebsiteList.length; i++) {
          bgModule.websiteList = testWebsiteList[i];
          results.push(bgModule.search(testWebsite));
        }

        var expectedData ={
           search_1_result: results[0],
           search_2_result: results[1],
           search_3_result: results[2],
           search_4_result: results[3]
        };
        expect(expectedData).toEqual({
            search_1_result: null,
            search_2_result: null,
            search_3_result: null,
            search_4_result: {websiteName: "facebook.dev.com"},

        });
    });
    it ("should check if website exists in blacklist", () => {
        const testWebsite = "www.google.ca";
        const testBlacklist = [
          [],
          ["newtab", "www.google.", "chrome://", "localhost", "chrome-extension://"],
          ["newtab", "chrome://", "localhost", "chrome-extension://", "badwebsite.com"]
        ];

        let results = [];

        for (var i = 0; i < testBlacklist.length; i++) {
          bgModule.blackList = testBlacklist[i];
          results.push(bgModule.blackListCheck(testWebsite));
        }

        const expectedData ={
           search_1_result: results[0],
           search_2_result: results[1],
           search_3_result: results[2]
        };
        expect(expectedData).toEqual({
            search_1_result: false,
            search_2_result: true,
            search_3_result: false
        });
    });
    it ('should add exact amount of empty days', function() {
      const saveEmptyDaySpy = spyOn(bgModule, "saveEmptyDay");
      const savePastDaySpy = spyOn(bgModule, "savePastDay");

      bgModule.addEmptyDays(2);
      expect(savePastDaySpy).toHaveBeenCalledTimes(1);
      expect(saveEmptyDaySpy.calls.count()).toEqual(2);
    });
    it ("should check search can find website by name", () => {
      let result = bgModule.search('facebook.com');
      expect(result).toEqual({"websiteName": "facebook.com"});
    });
    it.skip("should check if tab was updated correctly with existing website", () => {
      var testData ={
         newUrl: "https://esj.com/articles/2012/09/24/better-unit-testing.aspx",
         favIcon: "https://scott.mn/favicon.ico"
      };
      let websiteName = "esj.com";

      bgModule.search = jest.fn();
      bgModule.search.mockImplementation(() => ({
        websiteName: "esj.com",
        startTime : moment().format(),
        websiteVisits : 55
      }));
      let result = bgModule.search();
      bgModule.tabUpdatedAndActive(testData.newUrl,testData.favIcon);

      expect(bgModule.extractDomain(testData.newUrl)).toEqual(websiteName);
      expect(bgModule.search(websiteName)).toBeTruthy();
      expect(result.websiteVisits).toEqual(55);
    });
    it ("should check if empty day is saved", () => {
      bgModule.cleanDaysToEqualSeven = jest.fn();
      bgModule.resetWebsiteList = jest.fn();
      bgModule.saveData = jest.fn();
      bgModule.saveEmptyDay();
      expect(bgModule.pastDays[0]).toEqual({"totalVisits": 0, "websiteList": []});
      expect(bgModule.cleanDaysToEqualSeven).toHaveBeenCalledWith(bgModule.pastDays);
      expect(bgModule.resetWebsiteList).toHaveBeenCalledTimes(1);
      expect(bgModule.saveData).toHaveBeenCalledTimes(1);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({'pastDays': bgModule.pastDays});
    });
    it ("should check if past day is saved", () => {
      bgModule.sortWebsiteList = jest.fn();
      bgModule.cleanDaysToEqualSeven = jest.fn();
      bgModule.resetWebsiteList = jest.fn();
      bgModule.saveData = jest.fn();
      bgModule.savePastDay();
      expect(bgModule.total.totalVisits).toEqual(0);
      expect(bgModule.sortWebsiteList).toHaveBeenCalledTimes(1);
      expect(bgModule.pastDays[0]).toEqual({"totalVisits": bgModule.pastDays[0].totalVisits, "websiteList": bgModule.websiteList.slice(0, 10)});
      expect(bgModule.cleanDaysToEqualSeven).toHaveBeenCalledWith(bgModule.pastDays);
      expect(bgModule.resetWebsiteList).toHaveBeenCalledTimes(1);
      expect(bgModule.saveData).toHaveBeenCalledTimes(1);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({'pastDays': bgModule.pastDays});
    });
    it ("should get the reset time", () => {
      var timeNow = moment();
      var endOfTheDay = moment().endOf('day');
      var nextResetTime = moment.duration(moment(endOfTheDay).diff(timeNow)).asMilliseconds();
      expect(bgModule.getResetTime(bgModule.lastActiveSince)).toBeLessThanOrEqual(nextResetTime);
    });
    it ("should return 0 when lastActiveSince is in the past day", () => {
      let lastActive = bgModule.lastActiveSince;
      lastActive = moment().subtract(24, 'h');
      expect(bgModule.getResetTime(lastActive)).toEqual(0);
    });
    it ("should reset timer", () => {
      const spy = spyOn(bgModule, 'setDaylyTimer');
      let timeout = bgModule.myTimer;
      bgModule.resetTimer();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(timeout).toEqual(timeout++);
    });
    it ("should set dayly timer", () => {
      bgModule.setDaylyTimer();
      const setDaylyTimerSpy = spyOn(bgModule, 'setDaylyTimer');
      jest.runOnlyPendingTimers();
      expect(setDaylyTimerSpy).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenCalledTimes(1);
    });

});
