"use strict";
const WebsiteBlackList = require('./WebsiteBlackList');

class AppLoadService {
  constructor(){
    return this.initializeApp();
  }
  initializeApp(){
    //TODO
    //initialise lists(empyt or pull from storage/firebase)
    return {
      WebsiteBlackList : this.initializeBlackList(),
      WebsiteList : this.initializeWebsiteList(),
      PastDaysList : this.initializePastDaysList()
    }
    //start timer
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
    //TODO
    const instance = [];
    return instance;
  }
  initializePastDaysList(){
    //TODO
    const instance = [];
    return instance;
  }
}
module.exports = AppLoadService;
