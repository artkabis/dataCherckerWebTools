// === CORRECTION DANS Functions/wordsCountLexical.js ===
// Remplacer la section problématique (lignes ~350-380) par ceci :

if (typeof window.wordsCloudCounter === 'undefined') {
  window.wordsCloudCounter = () => {
    // Vérifier les dépendances
    if (!window.counterWords || !window.settingWords) {
      console.error('Les dépendances ne sont pas chargées');
      return;
    }

    console.log("counterWords >>>>>>>>>>>>>>>>>> ", window.counterWords);

    function getTopWords(text, excludeWords) {
      let words = text
        .replace(/\n|\t/g, " ")
        .replace(/'/g, "'")
        .replace(/[.,()]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      words = words.split(" ");

      const wordCounts = {};

      words.forEach((word) => {
        const lowercaseWord = word.toLowerCase();
        if (
          lowercaseWord.length >= 2 &&
          !excludeWords.includes(lowercaseWord) &&
          !/\d/.test(lowercaseWord)
        ) {
          wordCounts[lowercaseWord] = (wordCounts[lowercaseWord] || 0) + 1;
        }
      });

      const topWords = Object.keys(wordCounts)
        .sort((a, b) => wordCounts[b] - wordCounts[a])
        .slice(0, 50);

      const wordCountsTop16 = topWords.map((word) => ({
        word: word,
        iteration: words.reduce((count, currentWord) => {
          return currentWord.toLowerCase() === word ? count + 1 : count;
        }, 0),
      }));

      return wordCountsTop16;
    }

    const excludedWords = window.settingWords.exclusesWords;
    console.log({ excludedWords });
    const contentBody = window.counterWords
      .replace(/\n/gm, " ")
      .replace(/\t/gm, " ")
      .replace(/'/g, "'")
      .replaceAll(".", " ")
      .replaceAll(",", " ")
      .replace(/  /g, " ")
      .replace(/  /g, " ")
      .replace("(", "")
      .replace(")", "")
      .replace(/'/g, " ")
      .replaceAll(excludedWords);

    const topWords = getTopWords(contentBody, excludedWords);
    const cloudContainer = document.createElement("div");
    cloudContainer.className = "cloud";

    // Ajout de la barre d'outils
    const toolbar = document.createElement("div");
    toolbar.className = "cloud-toolbar";
    toolbar.innerHTML = `
    <div class="controls-wrapper">
      <input type="text" class="word-search" placeholder="Rechercher un mot...">
      <select class="word-limit">
        <option value="10">10 mots</option>
        <option value="20" selected>20 mots</option>
        <option value="30">30 mots</option>
        <option value="50">50 mots</option>
      </select>
      <button class="theme-toggle">🌙</button>
    </div>
  `;
    cloudContainer.appendChild(toolbar);

    // Conteneur pour les mots
    const wordsWrapper = document.createElement("div");
    wordsWrapper.className = "words-wrapper";
    cloudContainer.appendChild(wordsWrapper);

    const rand = Array.from({ length: 50 }, (_, i) => i + 1)
      .sort(() => Math.random() - 0.5);

    function updateWordCloud(searchTerm = '', limit = 20) {
      wordsWrapper.innerHTML = '';
      const filteredWords = topWords
        .filter(wordInfo => wordInfo.word.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, limit);

      rand.forEach((index) => {
        const wordInfo = filteredWords[index - 1];
        if (wordInfo) {
          const word = wordInfo.word;
          const iteration = wordInfo.iteration;
          const cloudElement = document.createElement("div");
          cloudElement.className = `cloud${index}`;
          cloudElement.innerHTML = `${word} (<span class="iteration">${iteration}</span>)`;
          wordsWrapper.appendChild(cloudElement);
        }
      });
    }

    console.log("Top 20 des mots les plus utilisés :", topWords);
    let cloudWindow = window.open("", "_blank", "width=500,height=600,toolbar=no");

    // === CONSTRUCTION MODERNE ET SÉCURISÉE DU DOM ===
    cloudWindow.document.open();
    cloudWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nuage de mots-clés</title>
          <style>
            :root {
              --bg-color: #efefef;
              --text-color: #333;
              --cloud-color: #3f6a8e;
            }

            body.dark-theme {
              --bg-color: #1a1a1a;
              --text-color: #fff;
              --cloud-color: #8FB3D9;
            }

            body {
              background-color: var(--bg-color);
              color: var(--text-color);
              transition: all 0.3s ease;
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
            }

            .word-cloud {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              width: 100%;
            }

            .cloud {
              text-align: center;
              max-width: 500px;
              width: 100%;
            }

            .cloud-toolbar {
              margin-bottom: 20px;
              padding: 15px;
              background: rgba(255,255,255,0.1);
              border-radius: 8px;
            }

            .controls-wrapper {
              display: flex;
              gap: 10px;
              justify-content: center;
              align-items: center;
              flex-wrap: wrap;
            }

            .word-search {
              padding: 8px 12px;
              border: 1px solid #ddd;
              border-radius: 4px;
              width: 200px;
              font-size: 14px;
            }

            .word-limit {
              padding: 8px 12px;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-size: 14px;
            }

            .theme-toggle {
              padding: 8px 12px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              background: #f0f0f0;
              transition: all 0.3s ease;
              font-size: 16px;
              min-width: 45px;
            }

            .theme-toggle:hover {
              background: #e0e0e0;
              transform: scale(1.05);
            }

            .words-wrapper {
              line-height: 1.6;
            }

            /* Styles pour les mots (inchangés) */
            .cloud1,.cloud2 {
              display: inline-block;
              font-size: 39px;
              letter-spacing: 1px;
              color: var(--cloud-color);
              opacity: 1;
              padding: 5px;
              cursor: pointer;
              transition: transform 0.2s;
            }

            .cloud3,.cloud4,.cloud5 {
              display: inline-block;
              font-size: 33px;
              letter-spacing: 1px;
              color: var(--cloud-color);
              opacity: 0.95;
              padding: 5px;
              cursor: pointer;
              transition: transform 0.2s;
            }

            .cloud6,.cloud7,.cloud8 {
              display: inline-block;
              font-size: 28px;
              letter-spacing: 1px;
              color: var(--cloud-color);
              opacity: 0.9;
              padding: 5px;
              cursor: pointer;
              transition: transform 0.2s;
            }

            .cloud9,.cloud10,.cloud11,.cloud12 {
              display: inline-block;
              font-size: 26px;
              letter-spacing: 1px;
              color: var(--cloud-color);
              opacity: 0.85;
              padding: 5px;
              cursor: pointer;
              transition: transform 0.2s;
            }

            .cloud13,.cloud14,.cloud15,.cloud16,.cloud17 {
              display: inline-block;
              font-size: 24px;
              letter-spacing: 1px;
              color: var(--cloud-color);
              opacity: 0.8;
              padding: 5px;
              cursor: pointer;
              transition: transform 0.2s;
            }

            .cloud18,.cloud19,.cloud20,.cloud21,.cloud22,.cloud23 {
              display: inline-block;
              font-size: 22px;
              letter-spacing: 1px;
              color: var(--cloud-color);
              opacity: 0.75;
              padding: 5px;
              cursor: pointer;
              transition: transform 0.2s;
            }

            .cloud24,.cloud25,.cloud26,.cloud27,.cloud28,.cloud29 {
              display: inline-block;
              font-size: 20px;
              letter-spacing: 1px;
              color: var(--cloud-color);
              opacity: 0.7;
              padding: 5px;
              cursor: pointer;
              transition: transform 0.2s;
            }

            .cloud30,.cloud31,.cloud32,.cloud33,.cloud34,.cloud35 {
              display: inline-block;
              font-size: 18px;
              letter-spacing: 1px;
              color: var(--cloud-color);
              opacity: 0.65;
              padding: 5px;
              cursor: pointer;
              transition: transform 0.2s;
            }

            .cloud36,.cloud37,.cloud38,.cloud39,.cloud40,.cloud41,.cloud42 {
              display: inline-block;
              font-size: 16px;
              letter-spacing: 1px;
              color: var(--cloud-color);
              opacity: 0.6;
              padding: 5px;
              cursor: pointer;
              transition: transform 0.2s;
            }

            .cloud43,.cloud44,.cloud45,.cloud46,.cloud47,.cloud48,.cloud49,.cloud50 {
              display: inline-block;
              font-size: 13px;
              letter-spacing: 1px;
              color: var(--cloud-color);
              opacity: 0.55;
              padding: 5px;
              cursor: pointer;
              transition: transform 0.2s;
            }

            [class^="cloud"]:hover {
              transform: scale(1.1);
            }

            /* Dark theme styles */
            body.dark-theme .word-search,
            body.dark-theme .word-limit {
              background: #333;
              color: #fff;
              border-color: #444;
            }

            body.dark-theme .theme-toggle {
              background: #333;
              color: #fff;
            }

            body.dark-theme .theme-toggle:hover {
              background: #444;
            }

            body.dark-theme .cloud-toolbar {
              background: rgba(255,255,255,0.05);
            }
          </style>
        </head>
        <body>
          <div class="word-cloud">
            <div class="cloud">
              <div class="cloud-toolbar">
                <div class="controls-wrapper">
                  <input type="text" class="word-search" placeholder="Rechercher un mot...">
                  <select class="word-limit">
                    <option value="10">10 mots</option>
                    <option value="20" selected>20 mots</option>
                    <option value="30">30 mots</option>
                    <option value="50">50 mots</option>
                  </select>
                  <button class="theme-toggle" title="Basculer le thème">🌙</button>
                </div>
              </div>
              <div class="words-wrapper"></div>
            </div>
          </div>
        </body>
      </html>
    `);
    cloudWindow.document.close();

    // === ATTENDRE QUE LE DOM SOIT PRÊT PUIS CONFIGURER LES INTERACTIONS ===
    // === ATTENDRE QUE LE DOM SOIT PRÊT PUIS CONFIGURER LES INTERACTIONS ===
    cloudWindow.addEventListener('load', () => {
      console.log("🎨 Configuration des interactions du nuage de mots");

      // === SOLUTION : Utiliser le document de la nouvelle fenêtre explicitement ===
      const newWindowDocument = cloudWindow.document;
      const themeToggle = newWindowDocument.querySelector('.theme-toggle');
      const wordSearch = newWindowDocument.querySelector('.word-search');
      const wordLimit = newWindowDocument.querySelector('.word-limit');
      const wordsWrapper = newWindowDocument.querySelector('.words-wrapper');
      const body = newWindowDocument.body; // Crucial : utiliser le body de la nouvelle fenêtre

      // Debug - vérifier que les éléments existent
      console.log("🔍 Éléments trouvés:", {
        themeToggle: themeToggle,
        wordSearch: wordSearch,
        wordLimit: wordLimit,
        wordsWrapper: wordsWrapper,
        body: body,
        bodyClasses: body ? body.className : 'body introuvable'
      });

      // === FONCTION POUR METTRE À JOUR LE NUAGE ===
      function updateWordCloud(searchTerm = '', limit = 20) {
        console.log(`🔄 Mise à jour nuage: "${searchTerm}", limite: ${limit}`);

        if (!wordsWrapper) {
          console.error("❌ wordsWrapper introuvable");
          return;
        }

        wordsWrapper.innerHTML = '';
        const filteredWords = topWords
          .filter(wordInfo => wordInfo.word.toLowerCase().includes(searchTerm.toLowerCase()))
          .slice(0, limit);

        rand.forEach((index) => {
          const wordInfo = filteredWords[index - 1];
          if (wordInfo) {
            const word = wordInfo.word;
            const iteration = wordInfo.iteration;
            const cloudElement = newWindowDocument.createElement("div"); // Utiliser le document de la nouvelle fenêtre
            cloudElement.className = `cloud${index}`;
            cloudElement.innerHTML = `${word} (<span class="iteration">${iteration}</span>)`;
            wordsWrapper.appendChild(cloudElement);
          }
        });
      }

      // === CONFIGURATION DU TOGGLE THEME (CORRIGÉE) ===
      console.log('>>>>>>>>>>>>>>>>>>>>>>>>>', themeToggle, body)
      if (themeToggle && body) {
        console.log("🎨 Configuration du toggle theme");

        themeToggle.addEventListener('click', (e) => {
          console.log("🎨 Clic sur toggle theme");
          e.preventDefault();

          // Vérifier l'état actuel avant le toggle
          const wasLightTheme = !body.classList.contains('dark-theme');
          console.log(`🎨 État avant toggle: ${wasLightTheme ? 'clair' : 'sombre'}`);
          console.log(`🎨 Classes avant toggle:`, body.className);

          // Toggle la classe
          body.classList.toggle('dark-theme');

          // Vérifier l'état après le toggle
          const isDarkTheme = body.classList.contains('dark-theme');
          console.log(`🎨 État après toggle: ${isDarkTheme ? 'sombre' : 'clair'}`);
          console.log(`🎨 Classes après toggle:`, body.className);

          // Mettre à jour l'icône
          themeToggle.textContent = isDarkTheme ? '☀️' : '🌙';
          themeToggle.title = isDarkTheme ? 'Mode clair' : 'Mode sombre';

          // Force un repaint si nécessaire
          body.style.display = 'none';
          body.offsetHeight; // Trigger reflow
          body.style.display = '';

          console.log(`🎨 Thème final: ${isDarkTheme ? 'sombre' : 'clair'}`);
        });

        // Test initial pour vérifier que le DOM est accessible
        console.log("🧪 Test initial de manipulation du DOM:");
        console.log("Classes initiales du body:", body.className);

        // Test rapide d'ajout/suppression de classe
        body.classList.add('test-class');
        console.log("Après ajout test-class:", body.className);
        body.classList.remove('test-class');
        console.log("Après suppression test-class:", body.className);

      } else {
        console.error("❌ Impossible de configurer le toggle theme:", {
          themeToggle: !!themeToggle,
          body: !!body
        });
      }

      // === CONFIGURATION DE LA RECHERCHE ===
      if (wordSearch) {
        wordSearch.addEventListener('input', (e) => {
          const searchTerm = e.target.value;
          const limit = parseInt(wordLimit?.value || 20);
          updateWordCloud(searchTerm, limit);
        });
      }

      // === CONFIGURATION DE LA LIMITE ===
      if (wordLimit) {
        wordLimit.addEventListener('change', (e) => {
          const limit = parseInt(e.target.value);
          const searchTerm = wordSearch?.value || '';
          updateWordCloud(searchTerm, limit);
        });
      }

      // === INITIALISATION DU NUAGE ===
      console.log("🚀 Initialisation du nuage de mots");
      updateWordCloud('', 20);
    });
  }
}

// === ALTERNATIVE SI LE PROBLÈME PERSISTE ===
// Si l'événement 'load' ne fonctionne pas correctement, vous pouvez essayer :

/*
// Utiliser un setTimeout pour être sûr que le DOM est prêt
setTimeout(() => {
  console.log("🎨 Configuration différée des interactions");
  
  const newWindowDocument = cloudWindow.document;
  const themeToggle = newWindowDocument.querySelector('.theme-toggle');
  const body = newWindowDocument.body;
  
  if (themeToggle && body) {
    themeToggle.addEventListener('click', (e) => {
      e.preventDefault();
      body.classList.toggle('dark-theme');
      
      const isDark = body.classList.contains('dark-theme');
      themeToggle.textContent = isDark ? '☀️' : '🌙';
      
      console.log("Classes du body après toggle:", body.className);
    });
  }
  
  // Reste de la configuration...
}, 100);
*/