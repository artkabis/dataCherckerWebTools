export const downloaderWPMedia = async (tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: async function () {
      // Afficher une notification à l'utilisateur
      alert("Ce script va télécharger plusieurs images. Veuillez autoriser les téléchargements multiples lorsque Chrome vous le demandera.");

      // Configuration globale avec prompts pour une meilleure expérience utilisateur
      const CONFIG = {
        maxImages: Number(prompt("Entrez le nombre maximum d'images à télécharger", "100")),
        startIndex: Number(prompt("À partir de quelle image commencer? (0 pour la première)", "0")),
        downloadBaseDelay: Number(prompt("Délai minimum entre les téléchargements (en ms)", "500")),
        batchSize: Number(prompt("Nombre d'images à télécharger simultanément", "3")),
        sizeFactor: 0.01, // Facteur de multiplication pour le poids de l'image
        containerID: "WPMediaDownloaderContainer"
      };

      // Classe pour l'interface utilisateur
      class DownloaderUI {
        constructor(config) {
          this.config = config;
          this.container = null;
          this.counterElement = null;
          this.progressBar = null;
          this.downloadButton = null;
          this.logContainer = null;
        }

        createUI() {
          // Supprimer l'ancien conteneur s'il existe
          const existingContainer = document.getElementById(this.config.containerID);
          if (existingContainer) {
            existingContainer.remove();
          }

          // Créer le conteneur principal
          const container = document.createElement("div");
          container.id = this.config.containerID;
          container.style.position = "fixed";
          container.style.top = "20px";
          container.style.right = "20px";
          container.style.zIndex = "9999";
          container.style.background = "rgba(255,255,255,0.95)";
          container.style.padding = "15px";
          container.style.borderRadius = "8px";
          container.style.boxShadow = "0 0 15px rgba(0,0,0,0.2)";
          container.style.width = "300px";
          container.style.maxHeight = "80vh";
          container.style.overflowY = "auto";
          container.style.fontFamily = "Arial, sans-serif";

          // Titre
          const title = document.createElement("h3");
          title.textContent = "Téléchargeur de médias WordPress";
          title.style.margin = "0 0 15px 0";
          title.style.color = "#23282d";
          title.style.borderBottom = "1px solid #eee";
          title.style.paddingBottom = "10px";
          container.appendChild(title);

          // Info sur la configuration
          const configInfo = document.createElement("div");
          configInfo.innerHTML = `
            <p style="margin: 5px 0; font-size: 12px;">Images: <strong>${this.config.maxImages}</strong> à partir de l'index <strong>${this.config.startIndex}</strong></p>
            <p style="margin: 5px 0; font-size: 12px;">Lot de <strong>${this.config.batchSize}</strong> images, délai min: <strong>${this.config.downloadBaseDelay}ms</strong></p>
          `;
          configInfo.style.marginBottom = "10px";
          container.appendChild(configInfo);

          // Compteur
          const counter = document.createElement("div");
          counter.textContent = "Préparation...";
          counter.style.marginBottom = "10px";
          counter.style.fontWeight = "bold";
          container.appendChild(counter);
          this.counterElement = counter;

          // Barre de progression
          const progressWrapper = document.createElement("div");
          progressWrapper.style.width = "100%";
          progressWrapper.style.height = "20px";
          progressWrapper.style.backgroundColor = "#f1f1f1";
          progressWrapper.style.borderRadius = "4px";
          progressWrapper.style.overflow = "hidden";
          progressWrapper.style.marginBottom = "15px";

          const progressBar = document.createElement("div");
          progressBar.style.width = "0%";
          progressBar.style.height = "100%";
          progressBar.style.backgroundColor = "#0073aa";
          progressBar.style.transition = "width 0.3s ease";

          progressWrapper.appendChild(progressBar);
          container.appendChild(progressWrapper);
          this.progressBar = progressBar;

          // Bouton de téléchargement
          const downloadButton = document.createElement("button");
          downloadButton.textContent = "Préparer les images";
          downloadButton.style.width = "100%";
          downloadButton.style.padding = "8px 12px";
          downloadButton.style.backgroundColor = "#0073aa";
          downloadButton.style.color = "white";
          downloadButton.style.border = "none";
          downloadButton.style.borderRadius = "4px";
          downloadButton.style.cursor = "pointer";
          downloadButton.style.fontWeight = "bold";
          downloadButton.style.marginBottom = "15px";
          downloadButton.style.transition = "background-color 0.2s ease";
          downloadButton.disabled = true;

          downloadButton.addEventListener("mouseover", () => {
            if (!downloadButton.disabled) {
              downloadButton.style.backgroundColor = "#00a0d2";
            }
          });

          downloadButton.addEventListener("mouseout", () => {
            if (!downloadButton.disabled) {
              downloadButton.style.backgroundColor = "#0073aa";
            }
          });

          container.appendChild(downloadButton);
          this.downloadButton = downloadButton;

          // Conteneur pour les liens (caché)
          const linksContainer = document.createElement("div");
          linksContainer.id = "MediaDownloaderLinks";
          linksContainer.style.display = "none";
          container.appendChild(linksContainer);

          // Zone de log
          const logContainer = document.createElement("div");
          logContainer.style.maxHeight = "200px";
          logContainer.style.overflowY = "auto";
          logContainer.style.border = "1px solid #eee";
          logContainer.style.padding = "8px";
          logContainer.style.borderRadius = "4px";
          logContainer.style.fontSize = "11px";
          logContainer.style.fontFamily = "monospace";
          logContainer.style.backgroundColor = "#f9f9f9";
          container.appendChild(logContainer);
          this.logContainer = logContainer;

          // Bouton pour fermer/minimiser
          const closeButton = document.createElement("button");
          closeButton.textContent = "×";
          closeButton.style.position = "absolute";
          closeButton.style.top = "10px";
          closeButton.style.right = "10px";
          closeButton.style.border = "none";
          closeButton.style.background = "none";
          closeButton.style.fontSize = "20px";
          closeButton.style.cursor = "pointer";
          closeButton.style.color = "#666";

          closeButton.addEventListener("click", () => {
            if (container.style.width === "300px") {
              // Minimiser
              container.style.width = "auto";
              container.style.height = "auto";
              title.style.display = "none";
              configInfo.style.display = "none";
              progressWrapper.style.display = "none";
              downloadButton.style.display = "none";
              logContainer.style.display = "none";
              linksContainer.style.display = "none";
              closeButton.textContent = "□";
              counter.style.margin = "0";
              container.style.padding = "5px 10px";
            } else {
              // Restaurer
              container.style.width = "300px";
              container.style.height = "auto";
              title.style.display = "block";
              configInfo.style.display = "block";
              progressWrapper.style.display = "block";
              downloadButton.style.display = "block";
              logContainer.style.display = "block";
              closeButton.textContent = "×";
              counter.style.margin = "0 0 10px 0";
              container.style.padding = "15px";
            }
          });

          container.appendChild(closeButton);

          // Ajouter le conteneur au document
          document.body.appendChild(container);
          this.container = container;

          return {
            container,
            linksContainer,
            downloadButton,
            counter: this.counterElement,
            progressBar: this.progressBar,
            logContainer: this.logContainer
          };
        }

        updateCounter(current, total, status = "") {
          this.counterElement.textContent = `${status || "Progression"}: ${current}/${total}`;
          const percentage = (current / total) * 100;
          this.progressBar.style.width = `${percentage}%`;
        }

        activateDownloadButton(callback, total) {
          this.downloadButton.textContent = `Télécharger ${total} images`;
          this.downloadButton.style.backgroundColor = "#46b450";
          this.downloadButton.disabled = false;
          this.downloadButton.addEventListener("click", callback);
        }

        log(message, isError = false) {
          const logEntry = document.createElement("div");
          logEntry.textContent = message;
          logEntry.style.margin = "2px 0";
          if (isError) {
            logEntry.style.color = "#d63638";
          }
          this.logContainer.appendChild(logEntry);
          this.logContainer.scrollTop = this.logContainer.scrollHeight;
        }
      }

      // Classe pour gérer les opérations sur les images
      class ImageProcessor {
        static getMimeType(extension) {
          const cleanExt = extension.toLowerCase().replace(/^\./, '');
          const mimeTypes = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            svg: 'image/svg+xml',
            webp: 'image/webp',
            bmp: 'image/bmp',
            ico: 'image/x-icon',
            tiff: 'image/tiff',
            tif: 'image/tiff'
          };
          return mimeTypes[cleanExt] || `image/${cleanExt}`;
        }

        static async fetchImage(url, ui) {
          try {
            ui.log(`Récupération de: ${url}`);

            return new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open('GET', url, true);
              xhr.responseType = 'blob';

              xhr.onload = function () {
                if (xhr.status === 200) {
                  const blob = xhr.response;
                  resolve({ blob, size: blob.size });
                  ui.log(`Image récupérée: ${(blob.size / 1024).toFixed(1)} KB`);
                } else {
                  reject(new Error(`HTTP status: ${xhr.status}`));
                }
              };

              xhr.onerror = function () {
                reject(new Error('Échec de la requête réseau'));
              };

              xhr.send();
            });
          } catch (error) {
            ui.log(`Erreur lors du téléchargement de ${url}: ${error.message}`, true);
            throw error;
          }
        }

        static processImageUrl(imgSrc) {
          // Gérer les URLs relatives et absolues
          const url = imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, window.location.origin).href;
          const urlObj = new URL(url);
          const pathSegments = urlObj.pathname.split('/');
          const filename = pathSegments[pathSegments.length - 1];
          const extension = filename.includes('.') ? filename.split('.').pop() : '';

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
        constructor(config, ui) {
          this.config = config;
          this.ui = ui;
          this.downloadQueue = [];
          this.linksContainer = document.getElementById("MediaDownloaderLinks");
        }

        addToQueue(imageData) {
          this.downloadQueue.push(imageData);
        }

        createDownloadLink(blob, name, extension, size) {
          const filename = name.endsWith(`.${extension}`) ? name : `${name}.${extension}`;
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = filename;
          link.dataset.size = size;
          link.dataset.name = filename;
          this.linksContainer.appendChild(link);
          this.ui.log(`Lien créé: ${filename} (${(size / 1024).toFixed(1)} KB)`);
          return link;
        }

        async downloadSingle(link, index, totalLinks) {
          const size = parseInt(link.dataset.size);
          const filename = link.dataset.name;

          // Calculer un délai basé sur la taille du fichier
          const delay = Math.max(
            this.config.downloadBaseDelay,
            Math.min(Math.sqrt(size) * this.config.sizeFactor, 2000)
          );

          return new Promise(resolve => {
            setTimeout(() => {
              try {
                link.click();
                URL.revokeObjectURL(link.href); // Libérer la mémoire
                this.ui.updateCounter(index + 1, totalLinks, "Téléchargé");
                this.ui.log(`Téléchargé: ${filename} (délai: ${delay.toFixed(0)}ms)`);
              } catch (error) {
                this.ui.log(`Erreur sur ${filename}: ${error.message}`, true);
              }
              resolve();
            }, delay);
          });
        }

        async processQueue() {
          const links = Array.from(this.linksContainer.querySelectorAll("a"));
          const totalLinks = links.length;

          if (totalLinks === 0) {
            this.ui.log("Aucune image à télécharger.", true);
            return;
          }

          if (!confirm(`Chrome va vous demander d'autoriser ${totalLinks} téléchargements. Êtes-vous prêt?`)) {
            this.ui.log("Téléchargement annulé par l'utilisateur.");
            return;
          }

          this.ui.log(`Début du téléchargement de ${totalLinks} images en lots de ${this.config.batchSize}.`);

          // Traiter les images par lots
          for (let i = 0; i < totalLinks; i += this.config.batchSize) {
            const batch = links.slice(i, Math.min(i + this.config.batchSize, totalLinks));

            // Télécharger plusieurs images en parallèle
            await Promise.all(
              batch.map((link, batchIndex) =>
                this.downloadSingle(link, i + batchIndex, totalLinks)
              )
            );
          }

          this.ui.log("Tous les téléchargements sont terminés!", false);
          this.ui.counterElement.style.color = "#46b450";
        }
      }

      // Fonction principale
      async function main() {
        try {
          // Initialiser l'interface utilisateur
          const ui = new DownloaderUI(CONFIG);
          const uiElements = ui.createUI();

          // Initialiser le gestionnaire de téléchargement
          const downloadManager = new DownloadManager(CONFIG, ui);

          // Sélectionner les images
          const selector = '.save-ready img, td[data-colname="Fichier"] img';
          const images = Array.from(document.querySelectorAll(selector))
            .slice(CONFIG.startIndex, CONFIG.startIndex + CONFIG.maxImages);

          if (images.length === 0) {
            ui.log("Aucune image trouvée avec le sélecteur: " + selector, true);
            ui.activateDownloadButton(() => {
              ui.log("Aucune image à télécharger.");
            }, 0);
            return;
          }

          ui.log(`${images.length} images trouvées, préparation en cours...`);

          // Traiter chaque image
          let processedCount = 0;
          for (const img of images) {
            try {
              const { url, name, extension } = ImageProcessor.processImageUrl(img.src);

              // Récupérer l'image
              const { blob, size } = await ImageProcessor.fetchImage(url, ui);

              // Créer le lien de téléchargement
              downloadManager.createDownloadLink(blob, name, extension, size);

              // Mettre à jour l'interface
              processedCount++;
              ui.updateCounter(processedCount, images.length, "Préparé");

            } catch (error) {
              ui.log(`Échec du traitement: ${error.message}`, true);
              processedCount++;
              ui.updateCounter(processedCount, images.length, "Préparé");
            }
          }

          // Activer le bouton de téléchargement
          ui.activateDownloadButton(() => downloadManager.processQueue(), processedCount);

        } catch (error) {
          console.error('Erreur majeure lors du traitement:', error);
          alert(`Une erreur s'est produite: ${error.message}`);
        }
      }

      // Lancer le script
      main();
    }
  });
};