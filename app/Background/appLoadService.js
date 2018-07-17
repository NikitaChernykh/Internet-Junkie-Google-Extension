"use strict";
const WebsiteBlackList = require('./websiteBlackList');
const PastDaysList = require('./pastDaysList');
const WebsiteList = require('./websiteList');
class AppLoadService {
  constructor(){
    return this.initializeApp();
  }
  initializeApp(){
    return {
      WebsiteBlackList : this.initializeBlackList(),
      WebsiteList : this.initializeWebsiteList(),
      PastDaysList : this.initializePastDaysList()
    }
    //TODO
    //start everyday timer
  }
  initializeBlackList(){
    const instance = new WebsiteBlackList("blacklist",[
      "newtab","chrome://",
      "localhost", "chrome-extension://",
      "about:blank","file://"
      ]);
    return instance;
  }
  initializeWebsiteList(){
    const instance = new WebsiteList("websiteList",[]);
    return instance;
  }
  initializePastDaysList(){
    const instance = new PastDaysList("pastDays",[]);
    return instance;
  }
}
module.exports = AppLoadService;
