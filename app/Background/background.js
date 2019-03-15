const moment = require('moment-timezone');
const AppLoadService = require('../../app/Background/appLoadService');
const UtilitiesModule = require('../../app/Background/utilities.js');

const appLoadService = new AppLoadService();

const { WebsiteBlackList } = appLoadService;
const { PastDaysList } = appLoadService;
const { WebsiteList } = appLoadService;

console.log(WebsiteBlackList.blacklist);
console.log(PastDaysList.pastDays);
console.log(WebsiteList.websiteList);

const bgModule = {
  pastDays: [],
  websiteList: WebsiteList.websiteList,
  blacklist: WebsiteBlackList.blacklist,
  globalUrl: '',
  prevTab: '',
  lastActiveSince: null,
  myTimer: 0,
  daysfrominstall: 0,
  total: {
    totalVisits: 0,
  },
  updateTotalVisits: list => {
    UtilitiesModule.sortWebsiteList(list);
    for (let f = 0; f < list.length; f += 1) {
      if (f < 10) {
        bgModule.total.totalVisits += list[f].websiteVisits;
      }
    }
  },
  checkInactiveDays: lastActive => {
    let inactiveDays = 0;
    if (lastActive === null) {
      return;
    }
    if (moment(lastActive).isSame(moment(), 'day') === false) {
      // if yesteday
      if (
        moment(lastActive).date() ===
        moment()
          .add(-1, 'days')
          .date()
      ) {
        bgModule.savePastDay();
        bgModule.lastActiveSince = null;
      } else {
        const startOfDay = moment().startOf('day');
        inactiveDays = moment
          .duration(moment(startOfDay).diff(lastActive))
          .days();
        if (inactiveDays >= 1) {
          bgModule.addEmptyDays(inactiveDays);
          bgModule.lastActiveSince = null;
        } else {
          // console.log("don't do anything 2");
        }
      }
    }
  },
  addEmptyDays(days) {
    bgModule.savePastDay();
    while (days > 0) {
      bgModule.saveEmptyDay();
    }
  },
  savePastDay() {
    bgModule.updateTotalVisits(bgModule.websiteList);
    const pastDay = {
      websiteList: bgModule.websiteList.slice(0, 10),
    };
    bgModule.pastDays.unshift(pastDay);
    bgModule.cleanDaysToEqualSeven(bgModule.pastDays);
    chrome.storage.local.set({ pastDays: bgModule.pastDays });
    bgModule.total.totalVisits = 0;
    WebsiteList.resetList();
  },
  cleanDaysToEqualSeven(pastDays) {
    if (pastDays.length > 6) {
      bgModule.pastDays = pastDays.slice(0, 6);
    }
  },
  saveEmptyDay() {
    const pastDay = {
      websiteList: [],
      totalVisits: 0,
    };
    bgModule.pastDays.unshift(pastDay);
    bgModule.cleanDaysToEqualSeven(bgModule.pastDays);
    chrome.storage.local.set({ pastDays: bgModule.pastDays });
    WebsiteList.resetList();
  },
  getResetTime(lastActive) {
    const timeNow = moment();
    const endOfTheDay = moment().endOf('day');
    let nextResetTime = moment
      .duration(moment(endOfTheDay).diff(timeNow))
      .asMilliseconds();
    if (lastActive != null) {
      if (moment(lastActive).isSame(moment(), 'day') === false) {
        nextResetTime = 0;
      }
    }
    return nextResetTime;
  },
  setDaylyTimer() {
    if (bgModule.lastActiveSince === null) {
      bgModule.lastActiveSince = UtilitiesModule.timeStamp();
    } else {
      const resetTime = bgModule.getResetTime(bgModule.lastActiveSince);
      bgModule.myTimer = setTimeout(function() {
        UtilitiesModule.sortWebsiteList(bgModule.websiteList);
        bgModule.savePastDay();
        bgModule.lastActiveSince = UtilitiesModule.timeStamp();
        bgModule.setDaylyTimer();
      }, resetTime);
    }
  },
  resetTimer() {
    clearTimeout(bgModule.myTimer);
    bgModule.setDaylyTimer();
  },

  updateDeactivationTime(tabURL) {
    // prevent from empty entry needs refactor leter
    if (tabURL === '') {
      return;
    }
    const websiteName = UtilitiesModule.extractDomain(tabURL);
    const existingWebsite = UtilitiesModule.search(
      websiteName,
      bgModule.websiteList
    );
    if (existingWebsite) {
      const deactivationTime = moment().format();
      let duration = moment.duration(
        moment(deactivationTime).diff(existingWebsite.startTime)
      );

      if (existingWebsite.timeDifference != null) {
        duration = duration.add(existingWebsite.timeDifference);
      }
      const formatedTime = {
        days: duration.days(),
        hours: duration.hours(),
        min: duration.minutes(),
        sec: duration.seconds(),
      };
      // update values
      existingWebsite.deactivationTime = deactivationTime;
      existingWebsite.timeDifference = duration;
      existingWebsite.formatedTime = formatedTime;
    }
  },
  tabUpdatedAndActive(newUrl, icon) {
    let favIcon = icon;
    if (newUrl === '' || typeof newUrl === 'undefined') return;

    if (typeof favIcon === 'undefined') {
      favIcon = '/assets/images/default_icon.png';
    }

    // blacklist check
    if (WebsiteBlackList.checkIfExistInList(newUrl) === false) {
      const websiteName = UtilitiesModule.extractDomain(newUrl);
      const existingWebsite = UtilitiesModule.search(
        websiteName,
        bgModule.websiteList
      );
      const start = moment().format();
      if (!existingWebsite) {
        // max 30 website cap for faster loading
        if (bgModule.websiteList.length >= 30) {
          return;
        }
        // add new website to the list
        const website = {
          websiteName,
          favIcon,
          websiteVisits: 1,
          startTime: start,
          deactivationTime: '',
        };
        WebsiteList.addToList(website);
      } else {
        if (existingWebsite.favIcon === '/assets/images/default_icon.png') {
          existingWebsite.favIcon = favIcon;
        }
        // add tab start time
        existingWebsite.startTime = start;
        // add visits
        existingWebsite.websiteVisits += 1;
      }
    }
  },
};
module.exports = bgModule;

// for web console testing
// to call methods from the web console use window.test.[name of the method]
window.test = bgModule;
