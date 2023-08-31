export const checkUserIndexDB = () => {
    console.log('CheckingNameIndexDB');
    return new Promise((resolve, reject) => {
        let mydb = null;
        const db_name = "db_datas_checker";
        const DBOpenRequest = indexedDB.open(db_name, 4);
        let userName;
        
        DBOpenRequest.onsuccess = (event) => {
            mydb = DBOpenRequest.result;
            console.log("db open succes : ", event.target.result);
            if(event.target.result.objectStoreNames.length){

           
            const transaction = mydb.transaction([db_name], "readonly");
            const objectStore = transaction.objectStore(db_name);
            var objectStoreRequest = objectStore.get('dcw');
            
            objectStoreRequest.onsuccess = function (event) {
                // On indique la réussite de l'insertion
                userName = objectStoreRequest.result.user;
                console.log('userName in checkUserIndexDB : ',{userName});
                resolve(userName); // Résoudre la promesse avec la valeur de userName
            };
            }
        };

        DBOpenRequest.onupgradeneeded = (event) => {
            mydb = event.target.result;
            console.log('db opened : onupgradeneeded :', {mydb});
        
            mydb.onerror = (event) => {
                console.log("Error loading database.", event);
                reject(event); // Rejeter la promesse en cas d'erreur
            };
        
            mydb.onsuccess = (event) => {
                console.log("upgrade successful", event);
            };
        };
    });
};