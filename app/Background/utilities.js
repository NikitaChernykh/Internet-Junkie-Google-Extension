const moment = require('moment-timezone');

module.exports = {
  timeStamp() {
    return moment().format('YYYY-MM-DD HH:mm');
  },
  distructureArray(val, devider, index) {
    return val.split(devider)[index];
  },
  extractDomain(url) {
    if (url !== undefined) {
      let result = url;
      // find & remove protocol (http, ftp, etc.) and get hostname
      if (url.indexOf('://') > -1) {
        result = this.distructureArray(url, '/', 2);
      } else {
        result = this.distructureArray(url, '/', 0);
      }

      // find & remove port number after hostname
      result = this.distructureArray(result, ':', 0);

      // if no dots in the striped url => return empty
      if (result.match(/[.]/gi) === null) {
        return '';
      }
      return result;
    }
  },
  search(websiteName, list) {
    for (let i = 0; i < list.length; i += 1) {
      if (list[i].websiteName === websiteName) {
        return list[i];
      }
    }
    return null;
  },
  sortWebsiteList(list) {
    list.sort(function(a, b) {
      return b.websiteVisits - a.websiteVisits;
    });
  },
};
