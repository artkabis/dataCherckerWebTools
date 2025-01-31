export const downloaderWPMedia = async (tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: async function () {
      // Configuration globale
      const CONFIG = {
        maxImages: Number(prompt("Entrez le nombre maximum d'images à télécharger", "100")),
        startIndex: 0,
        containerID: "ContainerLinks",
        downloadBaseDelay: 500, // Délai de base en ms
        sizeFactor: 0.01 // Facteur de multiplication pour le poids de l'image
      };

      // Créer le conteneur pour les liens de téléchargement
      const createContainer = () => {
        const container = document.createElement("div");
        container.id = CONFIG.containerID;
        document.body.appendChild(container);
        return container;
      };

      // Classe pour gérer les opérations sur les images
      class ImageProcessor {
        static getMimeType(extension) {
          const mimeTypes = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            svg: 'image/svg+xml',
            webp: 'image/webp'
          };
          return mimeTypes[extension.toLowerCase()] || `image/${extension.toLowerCase()}`;
        }

        static async fetchImage(url) {
          try {
            // Utiliser XMLHttpRequest au lieu de fetch pour éviter les problèmes CORS
            return new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open('GET', url, true);
              xhr.responseType = 'blob';

              xhr.onload = function () {
                if (xhr.status === 200) {
                  const blob = xhr.response;
                  resolve({ blob, size: blob.size });
                } else {
                  reject(new Error(`HTTP error! status: ${xhr.status}`));
                }
              };

              xhr.onerror = function () {
                reject(new Error('Network request failed'));
              };

              xhr.send();
            });
          } catch (error) {
            console.error(`Erreur lors du téléchargement de ${url}:`, error);
            throw error;
          }
        }

        static processImageUrl(imgSrc) {
          // Gérer les URLs relatives et absolues
          const url = imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, window.location.origin).href;
          const urlObj = new URL(url);
          const pathSegments = urlObj.pathname.split('/');
          const filename = pathSegments[pathSegments.length - 1];
          const extension = filename.split('.').pop();

          // Détecter et corriger les images redimensionnées
          const resizedPattern = /[-_](\d+x\d+)\./;
          const isResized = resizedPattern.test(filename);

          let finalUrl = url;
          let name = filename.split('.')[0];

          if (isResized) {
            name = name.replace(resizedPattern, '');
            finalUrl = url.replace(resizedPattern, '.');
          }

          return { url: finalUrl, name, extension };
        }
      }

      // Gestionnaire de téléchargement
      class DownloadManager {
        constructor(container) {
          this.container = container;
          this.downloadQueue = [];
          this.batchSize = 3; // Nombre d'images à télécharger simultanément
          this.currentBatch = new Set(); // Suivi des téléchargements en cours
        }

        addToQueue(imageData) {
          this.downloadQueue.push(imageData);
        }

        createDownloadLink(blob, name, size) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = name;
          link.dataset.size = size;
          this.container.appendChild(link);
          return link;
        }

        async downloadSingle(link, index, totalLinks) {
          const size = Number(link.dataset.size);
          // Calculer un délai basé uniquement sur la taille du fichier
          const delay = Math.min(
            Math.max(CONFIG.downloadBaseDelay, Math.sqrt(size) * CONFIG.sizeFactor),
            2000 // Délai maximum de 2 secondes
          );

          await new Promise(resolve => {
            setTimeout(() => {
              try {
                link.click();
                URL.revokeObjectURL(link.href);
                console.log(`Image ${index + 1}/${totalLinks} téléchargée. Taille: ${size} bytes, Délai: ${delay}ms`);
              } catch (error) {
                console.error(`Erreur lors du téléchargement de l'image ${index + 1}:`, error);
              }
              resolve();
            }, delay);
          });
        }

        async processQueue() {
          const links = Array.from(document.querySelectorAll(`#${CONFIG.containerID} a`));
          const totalLinks = links.length;

          // Traiter les images par lots
          for (let i = 0; i < totalLinks; i += this.batchSize) {
            const batch = links.slice(i, i + this.batchSize);
            // Télécharger plusieurs images en parallèle
            await Promise.all(
              batch.map((link, batchIndex) =>
                this.downloadSingle(link, i + batchIndex, totalLinks)
              )
            );
          }
        }
      }

      // Fonction principale
      async function main() {
        try {
          const container = createContainer();
          const downloadManager = new DownloadManager(container);

          // Sélectionner les images
          const selector = '.save-ready img, td[data-colname="Fichier"] img';
          const images = Array.from(document.querySelectorAll(selector))
            .slice(CONFIG.startIndex, CONFIG.maxImages);

          console.log(`Traitement de ${images.length} images...`);

          // Traiter chaque image
          for (const img of images) {
            const { url, name, extension } = ImageProcessor.processImageUrl(img.src);
            try {
              console.log(`Traitement de l'image: ${url}`);
              const { blob, size } = await ImageProcessor.fetchImage(url);
              downloadManager.createDownloadLink(blob, `${name}.${extension}`, size);
            } catch (error) {
              console.error(`Erreur lors du traitement de ${url}:`, error);
              continue;
            }
          }

          // Démarrer le téléchargement
          await downloadManager.processQueue();

          console.log('Téléchargement terminé !');
        } catch (error) {
          console.error('Erreur lors du traitement:', error);
        }
      }

      // Lancer le script
      main();
    }
  });
};