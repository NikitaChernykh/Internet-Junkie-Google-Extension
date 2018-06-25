"use strict";

class WebsiteBlackList extends Array{
  constructor() {
    super();
    this.blacklist = [
      "newtab","chrome://",
      "localhost", "chrome-extension://",
      "about:blank","file://"
    ];
    console.log(this.blacklist);
  }
  add(websiteName) {
    this.websiteName = websiteName;
    this.blacklist.push(websiteName);
  }
  remove(websiteName){
    //TODO implement remove
    //this.websiteName = websiteName;
    //this.blacklist.push(websiteName);
    //console.log(this.blacklist);
  }
  checkExists(websiteName) {
    for (var b = 0; b < this.blacklist.length; b++) {
        if (websiteName.includes(this.blackList[b])) {
            return true;
        }
    }
    return false;
  }
}
module.exports = WebsiteBlackList;
