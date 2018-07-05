"use strict";

class WebsiteList extends Array{
  constructor(list) {
    super();
    this.websites = list;
  }
  getList(){
    return this.websites;
  }
  addToList(website) {
    this.websites.push(website);
  }
  removeFromList(website){
    
  }
}
module.exports = WebsiteList;
