jest.unmock("../../app/Background/utilities.module.js");
jest.unmock('moment');

const UtilitiesModule = require("../../app/Background/utilities.module.js");
const moment = require('moment');

describe("Utilities Module", () =>{

  describe("time stamp functionality", () =>{
    it ("should return exact time", () => {
        let timeStampTest = moment().format("YYYY-MM-DD HH:mm");
        let time = UtilitiesModule.timeStamp();
        expect(timeStampTest).toEqual(time);
    });
  });
});
