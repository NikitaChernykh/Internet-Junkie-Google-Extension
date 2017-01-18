function list(tabs) {
  var contents = '';
  var counter = 0;
  for (var i = 0; i < tabs.length; i++) {

      //contents += tabs[i].url + '\n';
	  if(!tabs[i].pinned){
      if(tabs[i].url.includes("facebook")){
              counter++;
        }
    }
	  //contents += tabs[i].url + '\n';
  }
  contents += counter + " Facebook tab(s) open" + '\n';
  document.getElementById('url-list').value = contents;
}

document.getElementById('copy').addEventListener('click', function(e) {
  chrome.tabs.getAllInWindow(null, list);
  var textarea = document.getElementById('url-list');
  textarea.focus();
  var result = document.execCommand('copy');
});