var _cm = {};
_cm.locale = 'fr'
_cm.words = "";
    if (document.body != null) _cm.words = document.body.innerText.replace(/\n/gm, ' ')
        .replace(/\t/gm, ' ')
        .replace(/  /g, " ")
        .replace(/  /g, " ")
        .replace(/’/g, "'");
    var words = _cm.words.split(' ');
    var words_fr = ['alors', 'au', 'aucuns', 'aussi', 'autre', 'avant', 'avec', 'avoir', 'bon', 'car', 'ce', 'cela', 'ces', 'ceux', 'chaque', 'ci', 'comme', 'comment', 'dans', 'des', 'du', 'de', 'dedans', 'dehors', 'depuis', 'devrait', 'doit', 'donc', 'dos', 'début', 'le', 'elle', 'elles', 'en', 'encore', 'essai', 'est', 'et', 'eu', 'fait', 'faites', 'fois', 'font', 'hors', 'ici', 'il', 'ils', 'je', 'juste', 'la', 'le', 'les', 'leur', 'là', 'ma', 'maintenant', 'mais', 'mes', 'mine', 'moins', 'mon', 'mot', 'même', 'ni', 'nommés', 'notre', 'nous', 'ou', 'où', 'par', 'parce', 'pas', 'peut', 'peu', 'plupart', 'pour', 'pourquoi', 'quand', 'que', 'quel', 'quelle', 'quelles', 'quels', 'qui', 'sa', 'sans', 'ses', 'seulement', 'si', 'sien', 'son', 'sont', 'sous', 'soyez	sujet', 'sur', 'ta', 'tandis', 'tellement', 'tels', 'tes', 'ton', 'tous', 'tout', 'trop', 'très', 'tu', 'voient', 'vont', 'votre', 'vous', 'vu', 'vos', 'un', 'une', 'on', 'nos', "qu'il", "qu'ils", "qu'elle", "qu'elles", 'ça', 'étaient', 'état', 'étions', 'été', 'être'];
    var words_en = ["a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours	ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"];
    var words_useful = [];
    var words_top = {};
    for (var i = 0; i < words.length; i++) {
        if (_cm.locale.match(/fr/i)) {
            if (!words_fr.includes(words[i].trim()
                    .toLowerCase()) && words[i].length >= 2) words_useful.push(words[i].trim());
        } else {
            if (!words_en.includes(words[i].trim()
                    .toLowerCase()) && words[i].length >= 2) words_useful.push(words[i].trim());
        }
    }
    for (var i = 0; i < words_useful.length; i++) {
        if (!words_top[words_useful[i]]) words_top[words_useful[i]] = 1;
        else words_top[words_useful[i]] += 1;
    }
    words_cloud = {};
    Object.size = function(obj) {
        var size = 0,
            key;
        for (key in obj)
            if (obj.hasOwnProperty(key)) size++;
        return size;
    };
    for (var i = 0; i < 16; i++) words_cloud[i] = "";
    for (var i = 0; i < 16; i++) {
        if (Object.size(words_top) > 0) {
            words_cloud[(i + 1)] = Object.keys(words_top)
                .filter(x => {
                    return words_top[x] == Math.max.apply(null, Object.values(words_top));
                })[0];
            delete words_top[words_cloud[(i + 1)]];
        }
    }
    _cm.words_cloud = words_cloud;
    _cm.words_count = words_useful.length;
console.log({words_cloud},words_useful.length);
var element = document.querySelector(".words-cloud");
  if (content.words_cloud[6] == '') element.parentElement.classList.add("orange");
  else element.parentElement.classList.add("green");
  var el = "<div class='cloud'>";
  var rand = [13,1,14,7,2,16,6,9,10,11,3,8,12,5,4];
  for (var i = 0; i < rand.length; i++) {
    el += "<div class='cloud" + rand[i] + "'>" + content.words_cloud[rand[i]] + "</div>";
  }
  el += "</div>";
  element.innerHTML = el;
    window.open("", "_blank");
  newWindow.document.write("<html><head><title>Structure corrigée</title>");
  newWindow.document.write(
    "<style>.missing {background-color: white!important;color: orange!important;}.noMissingHeading { background-color:green }.duplicate { background-color: orange }</style>"
  );
  newWindow.document.write(`</head><body><div class="word-cloud">${element.innerHTML}</div><body><script></script></html>`);
  newWindow.document.close();