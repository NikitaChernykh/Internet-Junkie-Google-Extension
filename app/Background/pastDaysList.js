"use strict"
const Data = require('./data');

class PastDaysList extends Data{
  constructor(storageName,pastDays) {
    super(storageName,pastDays);
    this.pastDays = pastDays;
  }

  async getList(){
    const result = await super.get();
    this.pastDays = result.pastDays;
  }

  addToList(day) {
    this.blacklist.push(day);
    super.save(this.pastDays);
    console.log("Past day was added to past days list...");
  }

  removeFromList(day){
    const index = this.pastDays.indexOf(day);
    this.pastDays.splice(index, 1);
    super.save(this.pastDays);
    console.log("One day was removed from past days list...");
  }

  resetList(){
    this.pastDays.length = 0;
    super.save(this.pastDays);
    console.log("Past days list was reset...");
  }
}
module.exports = PastDaysList;
