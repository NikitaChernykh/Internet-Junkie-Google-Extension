module.exports = function() {
  function getVersion() {
    return chrome.runtime.getManifest().version;
  }
  return{
      template: '<p class="footer--copyright">&copy; 2017-'+ (new Date()).getFullYear()+ '</p><p class="footer--version">'+getVersion()+'</p>',
      restrict: "E"
  };
};
