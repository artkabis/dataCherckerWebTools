export async function getActiveTabURL() {
    const tabs = await chrome.tabs.query({
        currentWindow: true,
        active: true
    });
  
    return tabs[0];
}


export const openDb = async (dbName,dbVersion,storeName) =>{
  // Open the database
  //parameters - database name and version number. - integer
  var db
  var request = await indexedDB.open(dbName, dbVersion);

  console.log({request},' request result : ',request.result)
  db = request.result
  //Generating handlers
  //Error handlers
  request.onerror = function(event) {
    console.log("Error: ")
  };
  //OnSuccess Handler
  request.onsuccess = function(event) {
      console.log("Success: ")
      db = event.target.result
  };
    
    //OnUpgradeNeeded Handler
  request.onupgradeneeded = function(event) { 
    console.log("On Upgrade Needed")
      
      db = event.target.result;
      // Create an objectStore for this database
      //Provide the ObjectStore name and provide the keyPath which acts as a primary key
      db.createObjectStore(storeName, {keyPath: 'id', autoIncrement: true });
  };
}
export const getObjectStore = (db, storeName, mode) =>{
    var tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
}

export const LS = {
    getAllItems: () => chrome.storage.local.get(),
    getItem: async key => (await chrome.storage.local.get(key))[key],
    setItem: (key, val) => chrome.storage.local.set({[key]: val}),
    removeItems: keys => chrome.storage.local.remove(keys),
  };