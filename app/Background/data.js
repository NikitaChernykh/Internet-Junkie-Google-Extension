class Data {
  constructor(storageName, list){
    this.storageName = storageName;
    this.save(this.list);
    console.log("saved "+storageName+" on Data init!");
  }

  save(list){
    //chrome.storage.local.remove("undefined"); for dev puproses only
    chrome.storage.local.set({[this.storageName] : list});
    console.log(this.storageName + " saved!");
  }
  
  get(){
    return new Promise(function(resolve, reject) {
      chrome.storage.local.get(result => resolve(result));
    });
  }
}

module.exports = Data;
