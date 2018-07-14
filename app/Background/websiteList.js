"use strict"
const Data = require('./data');

class WebsiteList extends Data{
  constructor(storageName,websiteList) {
    super(storageName,websiteList);
    this.websiteList = websiteList;
  }
  async getList(){
    const result = await super.get();
    this.websiteList = result.websiteList;
  }

  addToList(website) {
    this.websiteList.push(website);
    super.save(this.websiteList);
    console.log(website.websiteName+" was added to webiste list...");
  }

  removeFromList(website){
    //TODO
  }

  resetList(){
    this.websiteList.length = 0;
    super.save(this.websiteList);
    console.log("Website list was reset...");
  }
}
module.exports = WebsiteList;
