"use strict";

class WebsiteBlackList extends Array{
  constructor(list) {
    super();
    this.blacklist = list;
  }
  getList(){
    return this.blacklist;
  }
  addToList(websiteName) {
    this.blacklist.push(websiteName);
  }
  removeFromList(websiteName){
    //TODO implement remove
    //this.websiteName = websiteName;
    //this.blacklist.push(websiteName);
    //console.log(this.blacklist);
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
