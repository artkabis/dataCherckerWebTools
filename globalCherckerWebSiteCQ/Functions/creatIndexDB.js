
let mydb = null;
export const creatDB = (user, db_name, datas) => {
  const DBOpenRequest = indexedDB.open(db_name, 4);
  console.log("---------------- CREATED DB ----------------");
  console.log('_______________________________ verification des donné passées à creatDB : ',{user},{db_name},{datas});

  DBOpenRequest.onsuccess = (event) => {
    mydb = DBOpenRequest?.result;
    console.log("db open succes : ", event?.target?.result);
    addData(user, mydb, db_name, datas); //Lancement de la création du store de la db
  };
  DBOpenRequest.onupgradeneeded = (event) => {
    mydb = event?.target?.result;
    console.log("db opened : onupgradeneeded :", { mydb });

    mydb.onerror = (event) => {
      console.log("Error loading database.", event);
    };

    mydb.onsuccess = (event) => {
      console.log("upgrade successful", event);
    };
    let objectStore = mydb.createObjectStore(db_name, {
      keyPath: "id",
    });
    console.log("____ service worker - onupgradeneeded : objectStore -> ", {
      objectStore,
    });
    console.log("data parse in creatDB: ", { datas });
  };
};
const addData = (user, mydb, db_name, datas) => {
  let userSoprod = user ? user : "Customer";
  const transaction = mydb
    ? mydb.transaction([db_name], "readwrite")
    : console.warn("Attention la bd d'indexDB n'est pas disponible");
  console.log("--------------------------- transaction readwrite : ", {
    transaction,
  });
  const objectStore = transaction.objectStore(db_name);
  let objectStoreRequest;
  const getObjectStore = objectStore?.get("dcw");
  const timeStamp = Date.now();
  console.log("timeStamp before on message userName : ", { timeStamp });


  console.log(
    "cccccccccccccccccccccccccccccccccccccccheck timestamp ",
    getObjectStore.timestamp,
    timeStamp
  );
  if (getObjectStore && objectStore.get("dcw")) {
    console.log("get  getObjectStore : ", { getObjectStore });
    objectStore.delete("dcw");
    objectStoreRequest = objectStore?.add({
      id: "dcw",
      title: "DataCheckerWebSite",
      data: datas,
      timestamp: timeStamp,
      user: userSoprod,
    });
  } else if (!getObjectStore) {
    objectStoreRequest = objectStore?.add({
      id: "dcw",
      title: "DataCheckerWebSite",
      data: datas,
      timestamp: timeStamp,
      user: userSoprod,
    });
  }
  transaction.oncomplete = (e) => {
    console.log("_____ transaction complete : ", e);
  };
  objectStoreRequest.onsuccess = function (event) {
    console.log("Nouvel objet ajouté dans la base de données >>>> ", {
      event,
    });
  };

  console.log("___________________ objectStore : ", { objectStore });
  const requestCursor = objectStore?.openCursor();
  requestCursor.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      if (cursor.value.title === "DataCheckerWebSite" && cursor.value.timeStamp !== timeStamp) {
        console.log("cursor value detected global_datas : ", cursor.value);
        const updateData = cursor.value;

        updateData.timestamp = Date.now();
        updateData.name = userSoprod;
        updateData.data = datas;
        const request = cursor?.update(updateData);
        request.onsuccess = () => {
          console.log("update timestamp : ", { updateData });
        };
        cursor?.continue();
      } else {
        console.log("Entries all displayed.   Cursor is false");
        return;
      }
    }
  };
};