
// jshint esversion: 6

jest.unmock("../../app/Background/background.js");
jest.unmock('moment');

const bgModule = require("../../app/Background/background.js");
const moment = require('moment');

const get = jest.fn();
const set = jest.fn();
const expectedEmptyArray = [];
global.chrome = {
  storage: {
    local: {
      set,
      get
    }
  }
};
// let blackListStub = bgModule.blackList;
// let pastDaysStub = [
//   {day: "day1"},
//   {day2: "day2"},
//   {day3: "day3"}];
// let websiteListStub = [
//   {websiteName: "facebook.com"},
//   {websiteName: "stackoverflow.com"},
//   {websiteName: "github.com"}];

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

    it ("shpuld alwayse keep passDays length to 6", () => {
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
      expect(chrome.storage.local.set).toHaveBeenCalledWith({'pastDays': expectedArray});
    });
    it ("shpuld keep passDays same if length is less the 6", () => {
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

    it ("should check the number of inactive days", () => {
       bgModule.lastActiveSince = moment().subtract(2, 'days');
       let numberOfDays = bgModule.checkInactiveDays();
       expect(numberOfDays).toEqual(2);
    });
    it("should extract domain from a string", () => {
        const testData = {
           url_1: "https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_split",
           url_2: "www.w3schools.com/jsref/tryit.asp?filename",
           url_3: "dfsdfsdfsdfsdfsdfsdfsdfsdfsdfgsdfsdfssdgsghs",
           url_4: undefined,
           url_5: "w3schools.com"
        };
        var expectedData = {};
        var result1 = bgModule.extractDomain(testData.url_1);
        var result2 = bgModule.extractDomain(testData.url_2);
        var result3 = bgModule.extractDomain(testData.url_3);
        var result4 = bgModule.extractDomain(testData.url_4);
        var result5 = bgModule.extractDomain(testData.url_5);
        expectedData ={
           url_1_result: result1,
           url_2_result: result2,
           url_3_result: result3,
           url_4_result: result4,
           url_5_result: result5
        };
        expect(expectedData).toEqual({
            url_1_result: "w3schools.com",
            url_2_result: "w3schools.com",
            url_3_result: "",
            url_4_result: "",
            url_5_result: "w3schools.com"

        });
    });
    it("should check if website exists in global website list", () => {
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
    it("should check if website exists in blacklist", () => {
        const testWebsite = "www.google.ca";
        const testBlacklist = [
          [],
          ["newtab", "www.google.", "chrome://", "localhost", "chrome-extension://"],
          ["newtab", "chrome://", "localhost", "chrome-extension://", "badwebsite.com"]
        ];

        var results = [];

        for (var i = 0; i < testBlacklist.length; i++) {
          bgModule.blackList = testBlacklist[i];
          results.push(bgModule.blackListCheck(testWebsite));
        }

        var expectedData ={
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
    it('should add exact amount of empty days', function() {
      const saveEmptyDaySpy = spyOn(bgModule, "saveEmptyDay");
      const savePastDaySpy = spyOn(bgModule, "savePastDay");

      bgModule.addEmptyDays(2);
      expect(savePastDaySpy).toHaveBeenCalledTimes(1);
      expect(saveEmptyDaySpy.calls.count()).toEqual(2);
    });

    it('should save website list to storage', function() {
      spyOn(chrome.storage.local, 'set').and.callThrough();
      bgModule.saveWebsiteList = jest.fn();
      bgModule.saveWebsiteList();
      expect(bgModule.saveWebsiteList).toHaveBeenCalledTimes(1);
    });
    it("should check if deactivation time was updated correctly", () => {

    });
    it("should check if tab was updated correctly", () => {
      var testData ={
         newUrl: "https://esj.com/articles/2012/09/24/better-unit-testing.aspx",
         favIcon: "https://scott.mn/favicon.ico"
      };

      const testWebsiteList = [
         {
           websiteName: "scott.mn",
           favIcon: "https://scott.mn/favicon.ico",
           websiteVisits: 5,
           startTime: "2017-10-02T15:50:40-04:00",
           deactivationTime: "2017-10-02T15:49:43-04:00"
         },
         {
           websiteName: "stackoverflow.com",
           favIcon: "https://scott.mn/favicon.ico",
           websiteVisits: 5,
           startTime: "2017-10-02T15:49:40-04:00",
           deactivationTime: "2017-10-02T15:49:43-04:00"
         },
         {
           websiteName: "esj.com",
           favIcon: "https://scott.mn/favicon.ico",
           websiteVisits: 5,
           startTime: "2017-10-02T15:49:40-04:00",
           deactivationTime: "2017-10-02T15:49:43-04:00"
         },
         {websiteName: "w3schools.com"}
       ];
      testWebsiteList[2].websiteVisits++;
      expect(testWebsiteList[2].websiteVisits).toEqual(6);
    });
    it("should check reset timer at midnight", () => {

    });
});
