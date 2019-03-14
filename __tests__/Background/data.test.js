const data = require("../../app/Background/data.js");
const list = [1, 2, 4];
const chrome = {
  storage: {}
};

jest.mock(data);

describe("Data Module", () => {
  describe("data functionality", () => {
    it("should run constructor", done => {
      data.save = jest.fn();
      chrome = {};
      expect(data.save).toBeCalled();
    });
  });
});
