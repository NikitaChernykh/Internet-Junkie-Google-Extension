jest.unmock("../../app/Background/background.js");
jest.unmock('moment');

const bgModule = require("../../app/Background/background.js");
const UtilitiesModule = require("../../app/Background/utilities.module.js");
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
      UtilitiesModule.sortWebsiteList(fakeList);
      expect(fakeList).toEqual(sortedfakeList);
    });
    it.skip("should check the number of inactive days", () => {
       let lastActive = moment().subtract(41, 'h');
       let numberOfDays = bgModule.checkInactiveDays(lastActive);
    });

    it ('should add exact amount of empty days', function() {
      const saveEmptyDaySpy = spyOn(bgModule, "saveEmptyDay");
      const savePastDaySpy = spyOn(bgModule, "savePastDay");

      bgModule.addEmptyDays(2);
      expect(savePastDaySpy).toHaveBeenCalledTimes(1);
      expect(saveEmptyDaySpy.calls.count()).toEqual(2);
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

      expect(bgModule.UtilitiesModule(testData.newUrl)).toEqual(websiteName);
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
      UtilitiesModule.sortWebsiteList = jest.fn();
      bgModule.cleanDaysToEqualSeven = jest.fn();
      bgModule.resetWebsiteList = jest.fn();
      bgModule.saveData = jest.fn();
      bgModule.savePastDay();
      expect(bgModule.total.totalVisits).toEqual(0);
      expect(UtilitiesModule.sortWebsiteList).toHaveBeenCalledTimes(1);
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
