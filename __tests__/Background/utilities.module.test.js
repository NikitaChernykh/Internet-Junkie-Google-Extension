jest.unmock("../../app/Background/utilities.module.js");
jest.unmock('moment');


const UtilitiesModule = require("../../app/Background/utilities.module.js");
const moment = require('moment');


describe("utilities.module script", () =>{
  it ("time stamp should return exact time", () => {
     let timeStampest = moment().format("YYYY-MM-DD HH:mm");
     let time = UtilitiesModule.timeStamp();
     expect(timeStampest).toEqual(time);
  });
});
