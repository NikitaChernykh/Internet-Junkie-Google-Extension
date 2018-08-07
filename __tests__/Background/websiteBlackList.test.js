
//jest.unmock("../../app/Background/WebsiteBlackList");

//const WebsiteBlackList = require("../../app/Background/WebsiteBlackList");
//const bl = new WebsiteBlackList([
              // "newtab","chrome://",
              // "localhost", "chrome-extension://",
              // "about:blank","file://"
              // ]);
//jest.mock('../../app/Background/data');


describe("Black List", () =>{
  describe("getList functionality", () =>{
    it("should the blacklist", () => {

        // let blacklist = bl.getList();
        // console.log(blacklist);
        // expect(blacklist).toEqual([
        //               "newtab","chrome://",
        //               "localhost", "chrome-extension://",
        //               "about:blank","file://"
        //               ]);
    });
  });

  describe("checkIfExistInList functionality", () =>{
    it("should check if website already exits in the list", () => {
        // const testWebsite = "www.google.ca";
        // const testWebsite2 = "file://";
        //
        // expect(bl.checkIfExistInList(testWebsite)).toEqual(false);
        // expect(bl.checkIfExistInList(testWebsite2)).toEqual(true);
        // expect(bl.checkIfExistInList(" ")).toEqual(false);
        // expect(bl.checkIfExistInList("")).toEqual(true);
    });
  });

  describe("addToList functionality", () =>{
    it("should add website to blacklist", () => {
      // const testWebsite = "www.google.com";
      // const length = blacklist.length;
      //
      // bl.addToList(testWebsite);
      // expect(blacklist.length).toEqual(length+1);
      // expect(blacklist[(blacklist.length)-1]).toEqual(testWebsite);
    });
  });

  describe("removeFromList functionality", () =>{
    it("should add remove website from blacklist", () => {
      // const testWebsite = "chrome-extension://";
      // const length = blacklist.length;
      // const index = blacklist.indexOf(testWebsite);
      //
      // bl.removeFromList(testWebsite);
      // expect(blacklist.length).toEqual(length-1);
      // expect(blacklist.indexOf(testWebsite)).toEqual(-1);
    });
  });

  describe("resetList functionality", () =>{
    it("should reset to empty blacklist", () => {
      // bl.resetList();
      // expect(blacklist.length).toEqual(0);
    });
  });
});
