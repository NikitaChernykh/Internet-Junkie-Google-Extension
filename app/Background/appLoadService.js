const WebsiteBlackList = require('./websiteBlackList');
const PastDaysList = require('./pastDaysList');
const WebsiteList = require('./websiteList');

class AppLoadService {
  constructor() {
    return this.initializeApp();
  }

  initializeApp() {
    return {
      WebsiteBlackList: this.initializeBlackList(),
      WebsiteList: this.initializeWebsiteList(),
      PastDaysList: this.initializePastDaysList(),
    };
    // TODO
    // start everyday timer
  }

  static initializeBlackList() {
    const instance = new WebsiteBlackList('blacklist', [
      'newtab',
      'chrome://',
      'localhost',
      'chrome-extension://',
      'about:blank',
      'file://',
    ]);
    return instance;
  }

  static initializeWebsiteList() {
    const instance = new WebsiteList('websiteList', []);
    return instance;
  }

  static initializePastDaysList() {
    const instance = new PastDaysList('pastDaysList', []);
    return instance;
  }
}
module.exports = AppLoadService;
