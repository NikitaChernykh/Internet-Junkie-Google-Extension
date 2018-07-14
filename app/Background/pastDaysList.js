"use strict";

class PastDaysList extends Array{
  constructor(...days) {
    super();
    this.days = [];
    websites.forEach((day) => this.days.push(day));
    console.log(days);
  }
}
module.exports = PastDaysList;
