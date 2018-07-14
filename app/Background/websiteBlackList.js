"use strict"
 const Data = require('./data');

class WebsiteBlackList extends Data{
  constructor(storageName,blacklist) {
    super(storageName,blacklist);
    this.blacklist = blacklist;
  }
  async getList(){
    const result = await super.get();
    this.blacklist = result.blacklist;
    console.log(result);
  }

  addToList(websiteName) {
    this.blacklist.push(websiteName);
    super.save(this.blacklist);
    console.log("saved after added to list");
  }

  removeFromList(websiteName){
    const index = this.blacklist.indexOf(websiteName);
    this.blacklist.splice(index, 1);
    super.save(this.blacklist);
    console.log("saved after removed from list");
  }

  resetList(){
    this.blacklist.length = 0;
    super.save(this.blacklist);
  }

  checkIfExistInList(websiteName) {
    for (var i = 0; i < this.blacklist.length; i++) {
      if (this.blacklist[i].includes(websiteName)) {
          return true;
      }
    }
    return false;
  }
}
module.exports = WebsiteBlackList;
