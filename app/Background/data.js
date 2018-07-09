"use strict";

class Data {
  constructor(storageName, list){
    this.storageName = storageName;
    this.list = list;
    console.log();
    this.save(storageName,list).then((successMessage) => {
      console.log("Yay! " + successMessage);
    })
  }

  save(storageName,list){
    return new Promise(function(resolve, reject) {
      chrome.storage.local.set({'blacklist' : list});
      resolve("blacklist saved!");
    });
  }

  get(){
    return new Promise(function(resolve, reject) {
      chrome.storage.local.get(function(result){
        console.log("Got the blacklist");
        resolve(result.blacklist);
      });
    });
  }
}

module.exports = Data;
