module.exports = function() {
  function getVersion() {
    return chrome.runtime.getManifest().version;
  }
  return{
      template: '<p class="footer--copyright">&copy; Copyright 2017 All Rights Reserved.</p><p class="footer--version">'+getVersion()+'</p>',
      restrict: "E"
  };
};
