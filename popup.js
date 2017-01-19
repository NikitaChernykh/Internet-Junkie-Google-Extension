 chrome.runtime.sendMessage({
      connection: "connected"
 },
 function(response) {
      //connection message
      console.log(response.msg);
});
