//Get acsses to the background.js
var background = chrome.extension.getBackgroundPage();
var content = document.getElementById("websiteList");

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

  if(i <5){
    //Variables
    var websiteName = background.websiteList[i].websiteName;
    var visits = background.websiteList[i].websiteVisits; 
    var icon = background.websiteList[i].favIcon;
    var website = "<a href='http://" +websiteName+ "' target='_blank'><div class='listContainer'>"
    + "<div class='image'><img src=" +icon+ " height='20' width='20'></div>"
    + "<div class='item'><span> " +websiteName+ "</span>"
    + " visits: " +visits+"</div></div></a>";
    content.innerHTML += website;
  }
  
  
}