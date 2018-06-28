"use strict";
var bgModule = require('../../app/Background/background.js');
var moment = require('moment-timezone');

module.exports = {
  timeStamp: function(){
    return moment().format("YYYY-MM-DD HH:mm");
  },
  extractDomain: function(url){
    if (url !== undefined) {
      var hostname;
      //find & remove protocol (http, ftp, etc.) and get hostname
      if (url.indexOf("://") > -1) {
          hostname = url.split('/')[2];
      }
      else {
          hostname = url.split('/')[0];
      }

      //find & remove port number
      hostname = hostname.split(':')[0];

      //find & remove "?"
      hostname = hostname.split('?')[0];

      //text wiput dots will not pass
      var arr = hostname.match(/[.]/gi);
      if(arr == null){
         return "";
      }
      //removes www. from filtered urls
      if(hostname.substring(0,4) == "www."){
        hostname = hostname.slice(4);
      }
      return hostname;
    }
    return "";
  },
  search: function(websiteName, list){
    for (var i = 0; i < list.length; i++) {
        if (list[i].websiteName === websiteName) {
            return list[i];
        }
    }
    return null;
  },
  sortWebsiteList: function(list){
    list = list.sort(function(a,b){
      return b.websiteVisits - a.websiteVisits;
    });
  }
};
