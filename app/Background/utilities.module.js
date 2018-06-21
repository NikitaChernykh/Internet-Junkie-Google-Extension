var moment = require('moment-timezone');


module.exports = {
  timeStamp: function(){
    return moment().format("YYYY-MM-DD HH:mm");
  }
};
