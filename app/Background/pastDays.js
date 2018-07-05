"use strict";

class PastDays extends Array{
  constructor(...days) {
    super();
    this.days = [];
    websites.forEach((day) => this.days.push(day));
    console.log(days);
  }
}
module.exports = PastDays;
