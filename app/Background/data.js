"use strict";

class Data {
  constructor(storageName, list){
    this.storageName = storageName;
    this.list = list;
    this.save(storageName,list);
  }

  save(storageName,list){
    chrome.storage.local.set({[storageName] : list});
    console.log(storageName + " saved!");
  }

  get(){
    return new Promise(function(resolve, reject) {
      chrome.storage.local.get(result => resolve(result));
    });
  }
  //TODO
  //to remove item in the storage
  //chrome.storage.local.remove("storageName");

}

module.exports = Data;
