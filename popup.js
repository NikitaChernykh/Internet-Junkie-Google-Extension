//Get acsses to the background.js
var background = chrome.extension.getBackgroundPage();

//Sort websites in descending order by visits
background.websiteList.sort(function(a, b){
    return b.websiteVisits - a.websiteVisits;
});

//Place holder for no results
if(background.websiteList.length == 0){
  document.write("<div>No addiction image holder</div>");
}
      
//Display list of visited sites
for (var i = 0; i < background.websiteList.length; i++) {
  //Variables
  if(i <5){
    var websiteName = background.websiteList[i].websiteName;
    var visits = background.websiteList[i].websiteVisits; 
    var icon = background.websiteList[i].favIcon;
    document.write(
      "<div class='listContainer'><tr><td>"
    + "<img src=" +icon+ " height='20' width='20'></td>"
    + "<td><a href='http://" +websiteName+ "' target='_blank'> " +websiteName+ "</a>"
    + " visits: " +visits+"</td><br></div>"
    );
  }
  
}