var background = chrome.extension.getBackgroundPage();
console.log(background);
console.log(background.websiteList);
console.log(background.websiteList.length);
for (var i = 1; i < background.websiteList.length; i++) {
  document.write("<tr><td>" + i + ") " + background.websiteList[i].websiteName +
                  " visits: "+ background.websiteList[i].websiteVisits + "</td><br><hr>");
}