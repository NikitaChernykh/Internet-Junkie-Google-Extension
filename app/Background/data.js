"use strict";

class Data {
  constructor(storageName, list){
    this.storageName = storageName;
    this.save(this.list);
    console.log("saved on Data init!");
  }

  save(list){
    //chrome.storage.local.remove("undefined");
    chrome.storage.local.set({[this.storageName] : list});
    console.log(this.storageName + " saved!");
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
