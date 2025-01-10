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
    cloudWindow.document.open();
    const head = cloudWindow.document.createElement('head');
    const title = cloudWindow.document.createElement('title');
    title.textContent = 'Nuage de mots-clés';

    const style = cloudWindow.document.createElement('style');
    style.textContent = `
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
          }

          .word-cloud {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            width: 100%;
            padding: 20px;
          }
          .cloud {
              position: fixed;
              top: 20px;
              text-align: center;
              max-width: 500px;
              height: 100vh;
              padding: 20px;
          }
          .cloud-toolbar {
            margin-bottom: 20px;
          }

          .controls-wrapper {
            display: flex;
            gap: 10px;
            justify-content: center;
            align-items: center;
            margin-bottom: 15px;
          }

          .word-search {
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            width: 200px;
          }

          .word-limit {
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }

          .theme-toggle {
            padding: 8px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            background: #f0f0f0;
            transition: background 0.3s ease;
          }

          .theme-toggle:hover {
            background: #e0e0e0;
          }

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

        /* Deuxième groupe */
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

        /* Troisième groupe */
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

        /* Quatrième groupe */
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

        /* Cinquième groupe */
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

        /* Sixième groupe */
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

        /* Septième groupe */
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

        /* Huitième groupe */
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

        /* Neuvième groupe */
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

        /* Dernier groupe */
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
    `;
    head.appendChild(style);
    head.appendChild(title);

    const body = cloudWindow.document.createElement('body');
    const wordCloudDiv = cloudWindow.document.createElement('div');
    wordCloudDiv.className = 'word-cloud';
    body.appendChild(wordCloudDiv);
    const script = cloudWindow.document.createElement('script');
    script.textContent = `
     function toggleTheme() {
            document.body.classList.toggle('dark-theme');
          }
    `;

    body.appendChild(script);

    // Création de la structure HTML
    const html = cloudWindow.document.createElement('html');
    html.appendChild(head);
    html.appendChild(body);

    // Ajout au document
    cloudWindow.document.appendChild(html);
    cloudWindow.document.close();


    cloudWindow.onload = function () {
      const container = cloudWindow.document.querySelector(".word-cloud");
      container.appendChild(cloudContainer);

      // Événements
      const searchInput = cloudContainer.querySelector('.word-search');
      const limitSelect = cloudContainer.querySelector('.word-limit');
      const themeButton = cloudContainer.querySelector('.theme-toggle');

      searchInput.addEventListener('input', (e) => {
        updateWordCloud(e.target.value, parseInt(limitSelect.value));
      });

      limitSelect.addEventListener('change', (e) => {
        updateWordCloud(searchInput.value, parseInt(e.target.value));
      });

      themeButton.addEventListener('click', () => {
        cloudWindow.document.body.classList.toggle('dark-theme');
      });

      // Affichage initial
      updateWordCloud();
    };
  };
}