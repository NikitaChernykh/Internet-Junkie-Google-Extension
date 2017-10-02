
const bgModule = require("../../app/Popup/background.js");
const moment = require('moment');

describe("test cases for extractDomain()", () =>{

    it("extracts domain from a string", () => {
        const testData = {
           url_1: "https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_split",
           url_2: "www.w3schools.com/jsref/tryit.asp?filename",
           url_3: "dfsdfsdfsdfsdfsdfsdfsdfsdfsdfgsdfsdfssdgsghs",
           url_4: undefined
        }
        var expectedData = {};
        var result1 = bgModule.extractDomain(testData.url_1);
        var result2 = bgModule.extractDomain(testData.url_2);
        var result3 = bgModule.extractDomain(testData.url_3);
        var result4 = bgModule.extractDomain(testData.url_4);
        expectedData ={
           url_1_result: result1,
           url_2_result: result2,
           url_3_result: result3,
           url_4_result: result4
        };
        expect(expectedData).toEqual({
            url_1_result: "w3schools.com",
            url_2_result: "w3schools.com",
            url_3_result: "",
            url_4_result: "",

        });
    });
});

describe("test cases for search()", () =>{

    it("checks if website exists in global website list", () => {
        const testWebsite = "w3schools.com";
        const testWebsiteList = [
          [],
          [{websiteName: "facebook.com"}],
          [{websiteName: "facebook.com"}, {websiteName: "stackoverflow.com"}, {websiteName: "github.com"}],
          [{websiteName: "facebook.com"}, {websiteName: "stackoverflow.com"}, {websiteName: "w3schools.com"}]
        ];

        var results = [];

        for (var i = 0; i < testWebsiteList.length; i++) {
          bgModule.websiteList = testWebsiteList[i];
          results.push(bgModule.search(testWebsite));
        }

        var expectedData ={
           search_1_result: results[0],
           search_2_result: results[1],
           search_3_result: results[2],
           search_4_result: results[3]
        };
        expect(expectedData).toEqual({
            search_1_result: null,
            search_2_result: null,
            search_3_result: null,
            search_4_result: {websiteName: "w3schools.com"},

        });
    });
});

describe("test cases for blackListCheck()", () =>{

    it("checks if website exists in blacklist", () => {
        const testWebsite = "https://badwebsite.com";
        const testBlacklist = [
          [],
          ["newtab", "www.google.", "chrome://", "localhost", "chrome-extension://"],
          ["newtab", "www.google.", "chrome://", "localhost", "chrome-extension://", "badwebsite.com"]
        ];

        var results = [];

        for (var i = 0; i < testBlacklist.length; i++) {
          bgModule.blackList = testBlacklist[i];
          results.push(bgModule.blackListCheck(testWebsite));
        }

        var expectedData ={
           search_1_result: results[0],
           search_2_result: results[1],
           search_3_result: results[2]
        };
        expect(expectedData).toEqual({
            search_1_result: false,
            search_2_result: false,
            search_3_result: true
        });
    });
});

describe("test cases for updateDeactivationTime()", () =>{
    it("checks if deactivation time was updated correctly", () => {
        const testWebsiteName = "https://atom.io/";
        const testExistingWebsite = "scott.mn";
        const testEnd = "2017-10-02T15:32:15-04:00";
        const testStartTime = "2017-10-02T10:32:15-04:00";
        const testWebsiteList = [
           {
             websiteName: "scott.mn",
             favIcon: "https://scott.mn/favicon.ico",
             websiteVisits: 5,
             startTime: "2017-10-02T15:49:40-04:00",
             deactivationTime: "2017-10-02T15:49:43-04:00"
           },
           {websiteName: "stackoverflow.com"},
           {websiteName: "w3schools.com"}
        ]
    });
});
