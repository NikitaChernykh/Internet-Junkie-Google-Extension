"use strict";

class Data {
  constructor(storageName, list){
    this.storageName = storageName;
    this.list = list;
  }

  save(this.storageName,this.list){
    chrome.storage.local.set({this.storageName, this.list});
  }

  get(this.storageName){
    chrome.storage.local.get(this.storageName);
  }
}

module.exports = Data;
