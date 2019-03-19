const moment = require('moment-timezone');

export const resetTimer = (timer) => {
    clearTimeout(timer);
    this.setDaylyTimer();
    return "timer";
}

// export const setDaylyTimer = () => {
//     const resetTime = this.getResetTime(lastActive);
//     const timer = setTimeout(function() {
        
//         bgModule.lastActiveSince = this.timeStamp();
//         this.setDaylyTimer();
//       }, resetTime);
//     return timer;
// }

export const timeStamp = () =>{
    return moment().format('YYYY-MM-DD HH:mm');
}

export const getResetTime = (lastActive) => {
    const timeNow = moment();
    const endOfTheDay = moment().endOf('day');
    let nextResetTime = moment.duration(moment(endOfTheDay).diff(timeNow)).asMilliseconds();
    if(lastActive !== null){
        if(moment(lastActive).isSame(moment(), 'day') === false){
          nextResetTime = 0;
        }
      }
    return nextResetTime;
}