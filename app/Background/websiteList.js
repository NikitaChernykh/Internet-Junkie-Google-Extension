"use strict";

class WebsiteList extends Array{
  constructor(...websites) {
    super();
    this.websites = [];
    websites.forEach((website) => this.websites.push(website));
    console.log(websites);
  }
}
module.exports = WebsiteList;
