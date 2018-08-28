

const UtilitiesModule = require("../../app/Background/utilities.js");
//const moment = require('moment');
describe("Utilities Module", () =>{

  describe("timeStamp functionality", () =>{
    it("should return exact time", () => {
        // let timeStampTest = moment().format("YYYY-MM-DD HH:mm");
        // let time = UtilitiesModule.timeStamp();
        // expect(timeStampTest).toEqual(time);
    });
  });

  describe("extractDomain functionality", () =>{
    it("should extract domain from a string", () => {
      const testData = {
         url_1: "https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_split",
         url_2: "www.w3schools.com/jsref/tryit.asp?filename",
         url_3: "dfsdfsdfsdfsdfsdfsdfsdfsdfsdfgsdfsdfssdgsghs",
         url_4: undefined,
         url_5: "w3schools.com",
         url_6: "",
         url_7: "http://projects.google.com/#/projects/active",
         url_8: "www.blog.classroom.me.uk",
         url_9: "http://www.example.com:8080",
         url_10: "http://mywebsitehaswww.com"
      };
      let result1 = UtilitiesModule.extractDomain(testData.url_1);
      let result2 = UtilitiesModule.extractDomain(testData.url_2);
      let result3 = UtilitiesModule.extractDomain(testData.url_3);
      let result4 = UtilitiesModule.extractDomain(testData.url_4);
      let result5 = UtilitiesModule.extractDomain(testData.url_5);
      let result6 = UtilitiesModule.extractDomain(testData.url_6);
      let result7 = UtilitiesModule.extractDomain(testData.url_7);
      let result8 = UtilitiesModule.extractDomain(testData.url_8);
      let result9 = UtilitiesModule.extractDomain(testData.url_9);
      let result10 = UtilitiesModule.extractDomain(testData.url_10);
      let expectedData ={
         url_1_result: result1,
         url_2_result: result2,
         url_3_result: result3,
         url_4_result: result4,
         url_5_result: result5,
         url_6_result: result6,
         url_7_result: result7,
         url_8_result: result8,
         url_9_result: result9,
         url_10_result: result10
      };
      expect(expectedData).toEqual({
          url_1_result: "w3schools.com",
          url_2_result: "w3schools.com",
          url_3_result: "",
          url_4_result: "",
          url_5_result: "w3schools.com",
          url_6_result: "",
          url_7_result: "projects.google.com",
          url_8_result: "blog.classroom.me.uk",
          url_9_result: "example.com",
          url_10_result: "mywebsitehaswww.com"
      });
    });
  });

  describe("search functionality", () =>{
    it("should check if search can find website by name", () => {
      // const testWebsite = "facebook.dev.com";
      // const testWebsiteList = [
      //   [],
      //   [{websiteName: "facebook.com"}],
      //   [{websiteName: "facebook.com"}, {websiteName: "stackoverflow.com"}, {websiteName: "github.com"}],
      //   [{websiteName: "facebook.com"}, {websiteName: "stackoverflow.com"}, {websiteName: "facebook.dev.com"}]
      // ];
      // const expectedData ={
      //    search_1_result: UtilitiesModule.search(testWebsite,testWebsiteList[0]),
      //    search_2_result: UtilitiesModule.search(testWebsite,testWebsiteList[1]),
      //    search_3_result: UtilitiesModule.search(testWebsite,testWebsiteList[2]),
      //    search_4_result: UtilitiesModule.search(testWebsite,testWebsiteList[3])
      // };
      // expect(expectedData).toEqual({
      //     search_1_result: null,
      //     search_2_result: null,
      //     search_3_result: null,
      //     search_4_result: {websiteName: "facebook.dev.com"},
      // });
    });
  });
});
