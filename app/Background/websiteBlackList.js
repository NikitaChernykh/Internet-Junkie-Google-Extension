"use strict"
 const Data = require('./data');

class WebsiteBlackList extends Data{
  constructor(list) {
    super('blacklist',list);
    this.blacklist = list;
  }
  getList(){
    return super.get();
  }
  addToList(websiteName) {
    this.blacklist.push(websiteName);
  }
  removeFromList(websiteName){
    const index = this.blacklist.indexOf(websiteName);
    this.blacklist.splice(index, 1);
  }
  resetList(){
    this.blacklist.length = 0;
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
