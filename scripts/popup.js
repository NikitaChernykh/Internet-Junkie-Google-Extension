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

//Place holder monster for no results
if( background.websiteList[0] == undefined || background.websiteList[0].websiteVisits < 5){
  document.write('<div class="monsterText">Wow! You are not addicted to any website yet!</div><div class="container"><div class="monster"></div><div class="hair"></div><div class="face"><div class="eyes"><div class="iris"></div></div></div><div class="mouth"></div><div class="drool"></div><div class="teeth"><div></div><div></div></div><div class="text"></div></div>');
  document.getElementById("heading").style.display = "none";
  document.getElementById("websiteList").style.display = "none";
}

//Send message on popup active
//chrome.runtime.sendMessage({action:"popup"});
