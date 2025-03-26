let mydb = null;

// Convertir creatDB en Promise pour mieux gérer le flux asynchrone
export const createDB = (user, db_name, datas) => {
  return new Promise((resolve, reject) => {
    console.log("---------------- CREATING DB ----------------");
    console.log('Données passées à creatDB :', { user }, { db_name }, { datas });

    if (!user || !db_name || !datas) {
      const error = new Error("Paramètres invalides pour la création de DB");
      console.error(error);
      reject(error);
      return;
    }

    // Ouvrir ou créer la base de données
    const DBOpenRequest = indexedDB.open(db_name, 4);

    // Gestionnaire d'erreurs global
    DBOpenRequest.onerror = (event) => {
      const error = new Error(`Erreur lors de l'ouverture de la base de données: ${event.target.error}`);
      console.error(error);
      reject(error);
    };

    // Création/mise à jour du schéma si nécessaire
    DBOpenRequest.onupgradeneeded = (event) => {
      console.log("Mise à niveau de la base de données...");
      mydb = event.target.result;

      try {
        // Vérifier si l'object store existe déjà
        if (!mydb.objectStoreNames.contains(db_name)) {
          let objectStore = mydb.createObjectStore(db_name, {
            keyPath: "id"
          });
          console.log("Object store créé:", objectStore);
        } else {
          console.log("Object store existant, aucune mise à jour nécessaire");
        }
      } catch (error) {
        console.error("Erreur lors de la mise à niveau:", error);
        // Ne pas rejeter ici, car onupgradeneeded est suivi de onsuccess
      }
    };

    // Succès de l'ouverture de la DB
    DBOpenRequest.onsuccess = (event) => {
      console.log("Base de données ouverte avec succès");
      mydb = event.target.result;

      // Gestion des erreurs globales de la BD
      mydb.onerror = (event) => {
        console.error("Erreur de base de données:", event.target.error);
      };

      // Ajouter les données et résoudre la promesse
      addData(user, mydb, db_name, datas)
        .then(() => {
          console.log("Données ajoutées avec succès");
          resolve();
        })
        .catch((error) => {
          console.error("Erreur lors de l'ajout des données:", error);
          reject(error);
        });
    };
  });
};

// Convertir addData en Promise
const addData = (user, mydb, db_name, datas) => {
  return new Promise((resolve, reject) => {
    if (!mydb) {
      reject(new Error("La base de données n'est pas disponible"));
      return;
    }

    try {
      // Créer une transaction
      const transaction = mydb.transaction([db_name], "readwrite");
      const objectStore = transaction.objectStore(db_name);
      const timeStamp = Date.now();

      console.log("Transaction créée, timestamp:", timeStamp);

      // Gestion des erreurs de transaction
      transaction.onerror = (event) => {
        console.error("Erreur de transaction:", event.target.error);
        reject(event.target.error);
      };

      // Succès de la transaction
      transaction.oncomplete = (event) => {
        console.log("Transaction terminée avec succès");
        resolve();
      };

      // Vérifier si l'entrée existe déjà
      const getRequest = objectStore.get("dcw");

      getRequest.onsuccess = (event) => {
        const existingData = event.target.result;
        let objectStoreRequest;

        // Supprimer l'ancienne entrée si elle existe
        if (existingData) {
          console.log("Entrée existante trouvée, mise à jour en cours");
          objectStore.delete("dcw");
        }

        // Ajouter les nouvelles données
        objectStoreRequest = objectStore.add({
          id: "dcw",
          title: "DataCheckerWebSite",
          data: datas,
          timestamp: timeStamp,
          user: user
        });

        objectStoreRequest.onsuccess = () => {
          console.log("Données ajoutées avec succès");
        };

        objectStoreRequest.onerror = (event) => {
          console.error("Erreur lors de l'ajout des données:", event.target.error);
        };
      };

      getRequest.onerror = (event) => {
        console.error("Erreur lors de la récupération des données:", event.target.error);
        reject(event.target.error);
      };

    } catch (error) {
      console.error("Erreur dans addData:", error);
      reject(error);
    }
  });
};