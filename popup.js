//Get acsses to the background.js
var background = chrome.extension.getBackgroundPage();

//Display list of visited sites
for (var i = 0; i < background.websiteList.length; i++) {
  document.write("<tr><td>" + (i+1) + ") " + background.websiteList[i].websiteName +
                  " visits: "+ background.websiteList[i].websiteVisits + "</td><br><hr>");
}