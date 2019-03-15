const Data = require('./data');

class PastDaysList extends Data {
  constructor(storageName, pastDaysList) {
    super(storageName, pastDaysList);
    this.pastDaysList = pastDaysList;
  }

  async getList() {
    const result = await super.get();
    this.pastDaysList = result.pastDaysList;
  }

  addToList(day) {
    this.blacklist.push(day);
    super.save(this.pastDaysList);
    console.log('Past day was added to past days list...');
  }

  removeFromList(day) {
    const index = this.pastDaysList.indexOf(day);
    this.pastDaysList.splice(index, 1);
    super.save(this.pastDaysList);
    console.log('One day was removed from past days list...');
  }

  resetList() {
    this.pastDaysList.length = 0;
    super.save(this.pastDaysList);
    console.log('Past days list was reset...');
  }
}
module.exports = PastDaysList;
