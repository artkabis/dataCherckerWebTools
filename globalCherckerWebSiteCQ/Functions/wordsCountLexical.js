(() => {
  // Fonction pour obtenir le top 16 des mots les plus utilisés
  function getTopWords(text, excludeWords) {
    const words = text
      .replace(/\n|\t/g, " ")
      .replace(/’/g, "'")
      .replace(/[.,()]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ");

    const wordCounts = {};

    // Compter les occurrences de chaque mot
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

    // Obtenir le top 16 des mots les plus utilisés
    const topWords = Object.keys(wordCounts)
      .sort((a, b) => wordCounts[b] - wordCounts[a])
      .slice(0, 16);

    // Compter les occurrences de chaque mot du top 16
    const wordCountsTop16 = topWords.map((word) => ({
      word: word,
      iteration: words.reduce((count, currentWord) => {
        return currentWord.toLowerCase() === word ? count + 1 : count;
      }, 0),
    }));

    return wordCountsTop16;
  }

  // Exemple d'utilisation
  const excludedWords = [
    "alors",
    "ainsi",
    "au",
    "aucuns",
    "aussi",
    "autre",
    "avant",
    "avait",
    "avec",
    "avez",
    "avoir",
    "bon",
    "car",
    "ce",
    "cela",
    "ces",
    "ceux",
    "chaque",
    "ci",
    "comme",
    "comment",
    "dans",
    "des",
    "du",
    "de",
    "dedans",
    "dehors",
    "depuis",
    "devrait",
    "doit",
    "donc",
    "dos",
    "début",
    "le",
    "elle",
    "elles",
    "en",
    "encore",
    "essai",
    "est",
    "et",
    "etc",
    "etc.",
    "evoyer",
    "eu",
    "fait",
    "faites",
    "fois",
    "font",
    "hors",
    "ici",
    "il",
    "ils",
    "je",
    "juste",
    "la",
    "le",
    "les",
    "leur",
    "là",
    "ma",
    "maintenant",
    "mais",
    "mes",
    "mine",
    "moins",
    "mon",
    "mot",
    "même",
    "ni",
    "nommés",
    "notre",
    "nous",
    "ou",
    "où",
    "par",
    "parce",
    "pas",
    "peut",
    "peu",
    "plupart",
    "pour",
    "pourquoi",
    "quand",
    "que",
    "quel",
    "quelle",
    "quelles",
    "quels",
    "qui",
    "sa",
    "sans",
    "ses",
    "seulement",
    "si",
    "sien",
    "son",
    "sont",
    "soit",
    "sous",
    "soyez",
    "sur",
    "ta",
    "tandis",
    "tellement",
    "tels",
    "tél",
    "tes",
    "ton",
    "tous",
    "tout",
    "trop",
    "très",
    "tu",
    "voient",
    "vont",
    "votre",
    "vous",
    "vu",
    "vos",
    "un",
    "une",
    "on",
    "nos",
    "qu'il",
    "qu'ils",
    "qu'elle",
    "qu'elles",
    "ça",
    "étaient",
    "état",
    "étions",
    "été",
    "être",
  ];
  const contentBody = document.body.innerText
    .replace(/\n/gm, " ")
    .replace(/\t/gm, " ")
    .replace(/’/g, "'")
    .replaceAll(".", " ")
    .replaceAll(",", " ")
    .replace(/  /g, " ")
    .replace(/  /g, " ")
    .replace("(", "")
    .replace(")", "");

  const topWords = getTopWords(contentBody, excludedWords);
  const cloudContainer = document.createElement("div");
  cloudContainer.className = "cloud";
  const rand = [10, 7, 11, 8, 14, 3, 5, 1, 4, 12, 13, 9, 6, 16, 2];

  rand.forEach((index) => {
    const wordInfo = topWords[index - 1];
    if (wordInfo) {
      const word = wordInfo.word;
      const iteration = wordInfo.iteration;
      const cloudElement = document.createElement("div");
      cloudElement.className = `cloud${index}`;
      cloudElement.innerHTML = `${word} (<span class="iteration">${iteration}</span>)`;
      cloudContainer.appendChild(cloudElement);
    }
  });
  console.log(cloudContainer.h);
  console.log("Top 16 des mots les plus utilisés :", topWords);
  let cloudWindow = window.open(
    "",
    "_blank",
    "width=400,height=300,toolbar=no"
  );
  cloudWindow.document.write(`<html><head><style>
    .word-cloud {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        width: 100%;
        background-color: #efefef;
    }
    .cloud{
        text-align: center;
        background-color: #efefef;
        max-width: 400px;
        height:auto;
      }
      .cloud1,.cloud2{
        display: inline-block;
        font-size:34px;
        letter-spacing: 1px;
        color:#3f6a8e;
        opacity: 1;
        padding: 0px 5px;
      }
      .cloud3,.cloud4{
        display: inline-block;
        font-size:30px;
        letter-spacing: 1px;
        color:#3f6a8e;
        opacity: 0.95;
        padding: 0px 5px;
      }
      .cloud5,.cloud6{
        display: inline-block;
        font-size:26px;
        letter-spacing: 1px;
        color:#3f6a8e;
        opacity: 0.9;
        padding: 0px 5px;
      }
      .cloud7,.cloud8{
        display: inline-block;
        font-size:24px;
        letter-spacing: 1px;
        color:#3f6a8e;
        opacity: 0.8;
        padding: 0px 5px;
      }
      .cloud9,.cloud10{
        display: inline-block;
        font-size:20px;
        letter-spacing: 1px;
        color:#3f6a8e;
        opacity: 0.85;
        padding: 0px 5px;
      }
      .cloud11,.cloud12{
        display: inline-block;
        font-size:18px;
        letter-spacing: 1px;
        color:#3f6a8e;
        opacity: 0.8;
        padding: 0px 5px;
      }
      .cloud13,.cloud14{
        display: inline-block;
        font-size:16px;
        letter-spacing: 1px;
        color:#3f6a8e;
        opacity: 0.75;
        padding: 0px 5px;
      }
      .cloud15,.cloud16{
        display: inline-block;
        font-size:15px;
        letter-spacing: 1px;
        color:#3f6a8e;
        opacity: 0.7;
        padding: 0px 5px;
      }</style><title>Words cloud</title>`);

  cloudWindow.document.write(
    `</head><body><div class="word-cloud"></div><body><script></script></html>`
  );
  cloudWindow.document.close();
  cloudWindow.onload = function () {
    cloudWindow.document
      .querySelector(".word-cloud")
      .appendChild(cloudContainer);
  };
})();
