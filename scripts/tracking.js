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

    

//TO DO move it in a saparate script
var config = {
     apiKey: "AIzaSyATPYL8AmU4Joh0TAxqcEFKsFCANmnSZBI",
     authDomain: "internt-junkie.firebaseapp.com",
     databaseURL: "https://internt-junkie.firebaseio.com",
     projectId: "internt-junkie",
     storageBucket: "internt-junkie.appspot.com",
     messagingSenderId: "673180643315"
   };
   firebase.initializeApp(config);