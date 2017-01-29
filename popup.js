//Get acsses to the background.js
var background = chrome.extension.getBackgroundPage();

//Sort websites in descending order by visits
background.websiteList.sort(function(a, b){
    return b.websiteVisits - a.websiteVisits;
});

//Display list of visited sites
for (var i = 0; i < background.websiteList.length; i++) {
  //Variables
  var websiteName = background.websiteList[i].websiteName;
  var visits = background.websiteList[i].websiteVisits; 
  var icon = background.websiteList[i].favIcon;
  
  document.write(
    "<tr><td>"
  + "<img src=" +icon+ " height='20' width='20'></td>"
  + "<td><a href='http://" +websiteName+ "' target='_blank'> " +websiteName+ "</a>"
  + " visits: " +visits+ "</td><br><hr>"
  );
}