
const chrome = require('sinon-chrome');
const background = require("../../app/Popup/background");

const search = jest.fn(function() {
  return false;
});

test('blaklistcheck', () => {
    expect(search("dss")).toBe(false);
});