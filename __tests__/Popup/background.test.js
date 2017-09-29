
const bgModule = require("../../app/Popup/background.js");

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
            url_2_result: "",
            url_3_result: "",
            url_4_result: "",
            
        });
    });
});