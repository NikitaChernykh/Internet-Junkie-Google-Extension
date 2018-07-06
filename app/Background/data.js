"use strict";

class Data {
  constructor(storageName, list){
    this.storageName = storageName;
    this.list = list;
    this.save(storageName,list);
  }

  save(storageName,list){
    chrome.storage.local.set({'blacklist' : list});
    console.log("saved");
  }
  get(){
    chrome.storage.local.get(function(result){
      console.log(result);
      return result.blacklist;
    });
  }
}

module.exports = Data;
