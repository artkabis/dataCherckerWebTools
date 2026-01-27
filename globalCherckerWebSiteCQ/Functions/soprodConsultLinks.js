/**
 * Ajoute des boutons "CONSULT" sur les lignes du tableau des enregistrements Soprod
 * Fonctionne uniquement sur https://soprod.solocalms.fr
 */
export const soprodConsultLinks = (tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      // Vérifier que le domaine est correct
      const allowedDomain = 'soprod.solocalms.fr';
      const currentDomain = window.location.hostname;

      if (currentDomain !== allowedDomain) {
        alert(`Cette fonctionnalité n'est disponible que sur ${allowedDomain}\nDomaine actuel: ${currentDomain}`);
        return;
      }

      // Vérifier que les sélecteurs sont disponibles
      const tableContainer = document.querySelector('.recordsPortlet #tableRecordsList');
      if (!tableContainer) {
        alert('Conteneur du tableau non trouvé (.recordsPortlet #tableRecordsList).\nVérifiez que vous êtes sur la bonne page.');
        return;
      }

      const tableRows = document.querySelectorAll('.recordsPortlet #tableRecordsList tbody tr');
      if (!tableRows || tableRows.length === 0) {
        alert('Aucune ligne trouvée dans le tableau.\nVérifiez que le tableau contient des données.');
        return;
      }

      // Compteur pour les boutons ajoutés
      let buttonsAdded = 0;
      let errors = [];

      tableRows.forEach((row, index) => {
        try {
          // Vérifier si un bouton CONSULT existe déjà
          if (row.querySelector('.soprod-consult-btn')) {
            return; // Passer cette ligne si le bouton existe déjà
          }

          row.style.position = 'relative';

          // Créer le bouton CONSULT
          const consultBtn = document.createElement('a');
          consultBtn.innerHTML = 'CONSULT';
          consultBtn.className = 'soprod-consult-btn';
          consultBtn.style.cssText = `
            color: white !important;
            position: absolute;
            background: #009cff;
            bottom: 5px;
            left: 50%;
            padding: 2.5px 8px;
            transform: translateX(-50%);
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
            cursor: pointer;
            text-decoration: none;
            z-index: 100;
            transition: background 0.2s ease;
          `;

          // Hover effect
          consultBtn.addEventListener('mouseenter', () => {
            consultBtn.style.background = '#007acc';
          });
          consultBtn.addEventListener('mouseleave', () => {
            consultBtn.style.background = '#009cff';
          });

          // Trouver la première cellule
          const firstTD = row.querySelector('td:first-child');
          if (!firstTD) {
            errors.push(`Ligne ${index + 1}: première cellule non trouvée`);
            return;
          }

          firstTD.style.cssText = 'position: relative !important';

          // Extraire l'EPJ depuis la deuxième cellule
          const secondTD = row.querySelector('td:nth-child(2)');
          if (!secondTD) {
            errors.push(`Ligne ${index + 1}: deuxième cellule non trouvée`);
            return;
          }

          const cellContent = secondTD.textContent;
          const epjParts = cellContent.split(' / ');

          if (epjParts.length < 2) {
            errors.push(`Ligne ${index + 1}: format EPJ invalide (${cellContent})`);
            return;
          }

          const epj = epjParts[1].trim();
          if (!epj) {
            errors.push(`Ligne ${index + 1}: EPJ vide`);
            return;
          }

          const consultUrl = `https://soprod.solocalms.fr/Consultation/Record/${epj}?redirect=true`;

          // Ajouter le bouton à la cellule
          firstTD.appendChild(consultBtn);

          // Gestionnaire de clic sur le bouton
          consultBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            window.open(consultUrl, '_blank', 'width=800,height=600');
          });

          // Gestionnaire de clic sur la première cellule (comportement original du script)
          firstTD.addEventListener('click', (event) => {
            // Ne pas déclencher si on clique sur le bouton lui-même
            if (event.target === consultBtn) {
              return;
            }
            event.preventDefault();
            event.stopPropagation();
            window.open(consultUrl, '_blank', 'width=800,height=600');
          });

          buttonsAdded++;
          console.log(`[SoprodConsult] Ligne ${index + 1}: EPJ=${epj}, URL=${consultUrl}`);
        } catch (error) {
          errors.push(`Ligne ${index + 1}: ${error.message}`);
        }
      });

      // Afficher le résumé
      let message = `Boutons CONSULT ajoutés: ${buttonsAdded}/${tableRows.length}`;
      if (errors.length > 0) {
        message += `\n\nErreurs (${errors.length}):\n${errors.slice(0, 5).join('\n')}`;
        if (errors.length > 5) {
          message += `\n... et ${errors.length - 5} autres erreurs`;
        }
      }

      console.log('[SoprodConsult] Résumé:', { buttonsAdded, totalRows: tableRows.length, errors });
      alert(message);
    },
  });
};
