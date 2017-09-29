
const bgModule = require("../../app/Popup/background.js");

describe("terst cases for extractDomain()", () =>{
    
    it("extracts domain from a string", () => {   
       var testValue = "http://www.facebook.com";
       var expected = bgModule.extractDomain(testValue);
       expect(expected).toBe("facebook.com");
    });
    
    it("returns '' from a undefined", () => {   
       var testValue = undefined;
       var expected = bgModule.extractDomain(testValue);
       expect(expected).toBe("");
    });
    
});