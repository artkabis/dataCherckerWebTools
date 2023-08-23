(() => {
  let _cm = {},
    content = {};
  _cm.words = "";
  if (document.body != null)
    _cm.words = document.body.innerText
      .replace(/\n/gm, " ")
      .replace(/\t/gm, " ")
      .replace(/’/g, "'")
      .replaceAll('.', ' ')
      .replaceAll(',', ' ')
      .replace(/  /g, " ")
      .replace(/  /g, " ")
      .replace('(', '')
      .replace(')', '');


      

  let words = _cm.words.split(" ");
  words = words.filter(word => word.length>= 3 && !word.match(/[0-9]/g));
  const words_fr = [
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
  var words_useful = [];
  var words_top = {};
  for (var i = 0; i < words.length; i++) {
    !words_fr.includes(words[i].trim().toLowerCase()) &&
      words[i].length >= 2 &&
      words_useful.push(words[i].trim());
  }
  for (var i = 0; i < words_useful.length; i++) {
    if (!words_top[words_useful[i]]) words_top[words_useful[i]] = 1;
    else words_top[words_useful[i]] += 1;
  }
  words_cloud = {};
  Object.size = function (obj) {
    let size = 0,
      key;
    for (key in obj) if (obj.hasOwnProperty(key)) size++;
    return size;
  };
  let words_index =[];
  for (var i = 0; i < 16; i++) words_cloud[i] = "";
  for (var i = 0; i < 16; i++) {
    let sizeBestWords;
    if (Object.size(words_top) > 0) {
      words_cloud[i + 1] = Object.keys(words_top).filter((x) => {
        sizeBestWords = (words_top[x] == Math.max.apply(null, Object.values(words_top)))&&Object.values(words_top);
        words_top[x] == Math.max.apply(null, Object.values(words_top));
        //console.log({x},sizeBestWords)
        return words_top[x] == Math.max.apply(null, Object.values(words_top)) && words_top[x];
      })[0];
      delete words_top[words_cloud[i + 1]];
      console.log('>>>>>>>>>>>>>>>>>>>>>>>>>',{words_top});

    }
    words_index = words_top;

  }
  console.log({words_index},{words_cloud});
  _cm.words_cloud = words_cloud;
  _cm.words_count = words_useful.length;
  content.words_cloud = words_cloud;
  console.log({ words_cloud }, words_useful.length);
  var element = document.querySelector(".words-cloud");
  //if (content.words_cloud[6] == '') element.parentElement.classList.add("orange");
  //else element.parentElement.classList.add("green");
  var el = "<div class='cloud'>";
  var rand = [13, 1, 14, 7, 2, 16, 6, 9, 10, 11, 3, 8, 12, 5, 4];
  for (var i = 0; i < rand.length; i++) {
    console.log
    el +=
      "<div class='cloud" +
      rand[i] +
      "'>" +
      content.words_cloud[rand[i]] + //'<span class"iterations">('+Object.values(words_top)
      "</div>";
  }
  el += "</div>";
  //element.innerHTML = el;
  cloudWindow = window.open("", "_blank", "width=250,height=400,toolbar=no");
  cloudWindow.document.write(`<html><head><style>
    .word-cloud {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        width: 100%;
    }
    .cloud{
        text-align: center;
        background-color: #efefef;
        max-width: 250px;
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
      }</style><title>Structure corrigée</title>`);

  cloudWindow.document.write(
    `</head><body><div class="word-cloud">${el}</div><body><script></script></html>`
  );
  cloudWindow.document.close();
})();