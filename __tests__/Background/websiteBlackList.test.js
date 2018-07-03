
jest.unmock("../../app/Background/WebsiteBlackList");

const WebsiteBlackList = require("../../app/Background/WebsiteBlackList");
const bl = new WebsiteBlackList(["newtab","chrome://",
"localhost", "chrome-extension://",
"about:blank","file://"]);
const blacklist = bl.getList();

describe("Black List", () =>{

  describe("checkIfExistInList functionality", () =>{
    it ("should check if website already exits in the list", () => {
        const testWebsite = "www.google.ca";
        const testWebsite2 = "file://";

        expect(bl.checkIfExistInList(testWebsite)).toEqual(false);
        expect(bl.checkIfExistInList(testWebsite2)).toEqual(true);
        expect(bl.checkIfExistInList(" ")).toEqual(false);
        expect(bl.checkIfExistInList("")).toEqual(true);
    });
  });

  describe("addToList functionality", () =>{
    it ("should add website to blacklist", () => {
      const testWebsite = "www.google.com";

      const length = blacklist.length;
      bl.addToList(testWebsite);
      expect(blacklist.length).toEqual(length+1);
      expect(blacklist[(blacklist.length)-1]).toEqual(testWebsite);
    });
  });

});
