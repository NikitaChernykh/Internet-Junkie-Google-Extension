//Google Analytics Start
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-91876786-1']);
_gaq.push(['_trackPageview']);
(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
//Google Analytics End


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
    //check for time
    var time = '';
    if(background.websiteList[i].formatedTime == undefined){
      var time = '';
    }else{
      var time = "time: "+background.websiteList[i].formatedTime;
    }

    var website = "<a href='http://" +websiteName+ "' target='_blank'><div class='listContainer'>"
    + "<div class='image'><img src=" +icon+ " height='20' width='20'></div>"
    + "<div class='item'><span> " +websiteName+ "</span>"
    + "<span class='visits'> visits: " +visits+ "</span><span id='time'> " +time+ "</span></div></div></a>";
    content.innerHTML += website;
  }
  
  
}