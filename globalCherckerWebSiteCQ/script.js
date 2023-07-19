dataChecker = {
  url_site: window.location.href,
  global_score: "2",
  state_check: "false",
  cdp_global_score: {
    check_title: "Global score CDP",
    global_score: 0,
    scores: [],
  },
  webdesigner_global_score: {
    check_title: "Global score Webdesigner",
    global_score: 0,
    scores: [],
  },
  meta_check: {
    meta_check_state: "false",
    nb_meta: "2",
    check_title: "Meta",
    global_score: "3",
    profil: ["CDP"],
    meta: [
      {
        meta_state: "false",
        meta_type: "title",
        meta_txt: "mon title magique performant et beau",
        meta_size: "6",
        meta_reco: "La reco est de 50 à 65 caractères.",
        meta_score: "5",
        check_title: "Meta title",
      },
      {
        meta_state: "false",
        meta_type: "description",
        meta_txt: "mon desc magique performant et beau",
        meta_size: "6",
        meta_reco: "la reco est de de 140 à 156 caractères.",
        meta_score: "10",
        check_title: "Meta description",
      },
    ],
  },
  link_check: {
    link_check_state: "false",
    nb_link: "1",
    check_title: "Links validities",
    global_score: "5",
    profil: ["CDP", "WEBDESIGNER"],
    link: [
      {
        link_state: "false",
        link_url: "www.monimage.com",
        link_status: 200,
        link_text: "mon lien",
        alt_img_score: "5",
      },
    ],
  },
  alt_img_check: {
    alt_img_check_state: "false",
    nb_alt_img: "1",
    check_title: "Images alt",
    global_score: "5",
    profil: ["CDP"],
    alt_img: [
      {
        alt_img_state: "true",
        alt_img_src: "www.monimage.com",
        alt_img_score: "5",
      },
    ],
  },
  img_check: {
    img_check_state: "false",
    nb_img: "1",
    nb_img_duplicate: [],
    check_title: "Images check",
    global_score: "5",
    profil: ["WEBDESIGNER"],
    alt_img: [
      {
        alt_img_state: "true",
        alt_img_src: "www.monimage.com",
        alt_img_score: "5",
        check_title: "Images alt",
      },
    ],
    size_img: [
      {
        size_img_state: "false",
        size_img_src: "www.monimage.com",
        size_img: "20KB",
        size_img_score: "5",
        check_title: "Images size",
      },
    ],
    ratio_img: [
      {
        ratio_img_state: "false",
        ratio_img_src: "www.monimage.com",
        type_img: "image/SRC",
        img_height: "100px",
        img_width: "100px",
        parent_img_height: "100px",
        parent_img_width: "100px",
        ratio_parent_img_height: "100px",
        ratio_parent_img_width: "100px",
        ratio_img: "20KB",
        ratio_img_score: "5",
        check_title: "Images ratio",
      },
    ],
  },
  hn: {
    hn_check_state: "false",
    nb_hn: "1",
    check_title: "Hn ",
    global_score: "1",
    hn_reco: {
      profil: ["CDP"],
      global_score: "1",
      check_title: "Reco longueur Hn",
      hn_preco: "La preco est de 50 à 90 caractères",
      hn: [
        {
          hn_type: "h1",
          hn_letters_count: "10",
          hn_txt: "mon titre h1 est beau",
          hn_index: "1",
          hn_words_sliced: "5",
          hn_words_count: "4",
          hn_score: "5",
          check_title: "Reco longueur des Hn",
        },
        {
          hn_type: "h2",
          hn_letters_count: "10",
          hn_txt: "mon titre h1 est beau",
          hn_index: "1",
          hn_words_sliced: "5",
          hn_words_count: "4",
          hn_score: "5",
          check_title: "Reco longueur des Hn",
        },
      ],
    },
    hn_outline: {
      profil: ["CDP", "WEBDESIGNER"],
      check_title: "Validité du outline des Hn",
      global_score: "1",
      hn: [
        {
          hn_type: "h2",
          hn_validity: "true",
          hn_validity_message: "Valide",
        },
      ],
    },
  },
  bold_check: {
    bold_check_state: "false",
    nb_bold: "1",
    check_title: "validité des préco lié au bold des textes.",
    global_score: "0",
    profil: ["CDP"],
    bold_txt: [
      {
        bold_txt_state: "false",
        bold_txt_content: "exmple texte en gras.",
        bold_txt_score: "0",
      },
    ],
  },
};

notJquery = typeof jQuery == "undefined";
window["dataResult"] = [{ data: { key: "value" } }];
function addJquery() {
  console.log("jQuery n'est pas installé, lancement de cette librairie ...");
  //Script permettant de charger jQuery est de l'utiliser ensuite dans votre projet.
  const loadScript = async (url) => {
    const response = await fetch(url);
    const script = await response.text();
    console.log(script);
    eval(script);
  };
  const scriptUrl =
    "//cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js";
  loadScript(scriptUrl);
}
notJquery && addJquery();

function init() {
  (($) => {
    console.clear();
    console.log(
      "%cSolocal %c - checker tools %cby Greg ;)",
      "color:#0097ff;font-family:system-ui;font-size:4rem;-webkit-text-stroke: 1px black;font-weight:bold",
      "color:#0097ff;font-family:system-ui;font-size:2rem;-webkit-text-stroke: 1px black;font-weight:bold",
      "color:#0097ff;font-family:system-ui;font-size:1rem;-webkit-text-stroke: 0.2px black;font-weight:bold"
    );
    const url = window.location.href;
    const device =
      "mobile"; /*prompt('Veuillez indiquer le device à tester (mobile ou desktop) : '); */
    const apiCall = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&strategy=${device}&category=pwa&category=seo&category=performance&category=accessibility`;
    fetch(apiCall)
      .then((response) => response.json())
      .then((json) => {
        const lighthouse = json.lighthouseResult;
        const isStackPack = lighthouse?.stackPacks;
        const stack = isStackPack
          ? lighthouse?.stackPacks[0]?.title
          : undefined;
        console.log(lighthouse);
        const lighthouseMetrics = {
          "Testing device": device,
          stack,
          "First Contentful Paint":
            lighthouse?.audits["first-contentful-paint"]?.displayValue,
          "largest-contentful-paint":
            lighthouse?.audits["largest-contentful-paint"]?.displayValue,
          "Speed Index": lighthouse?.audits["speed-index"]?.displayValue,
          "Time To Interactive":
            lighthouse?.audits["interactive"]?.displayValue,
          "Performance score": lighthouse?.categories["performance"]?.score, //lighthouse?.categories["pwa"]?.score,
          "Image alt ko": lighthouse?.audits["image-alt"]?.details?.items,
        };
        console.log(
          Object.fromEntries(
            Object.entries(lighthouseMetrics).filter(([key, value]) => value)
          )
        );
      });

    //Counter Hn in hovered
    $(document).on("mouseover", "h1,h2,h3,h4,h5,h6", function () {
      const txt = $(this) ? $(this)[0].innerText : false;
      const txtLength = txt ? txt.trim().length : false;
      txtLength &&
        $(this).attr(
          "title",
          $(this)[0].tagName +
            " - Nombre de caractéres : " +
            txtLength +
            "\nTexte pris en compte : \n" +
            txt
        );
    });

    //Counter words in content page
    const countWords = (text) => {
      // Supprime les espaces en début et en fin de chaîne
      text = text.trim();
      // Remplace les sauts de ligne par un espace
      text = text.replace(/\n/g, " ");
      // Remplace les doubles espaces consécutifs par un seul espace
      text = text.replace(/\s{2,}/g, " ");
      text = text
        .replaceAll("Button", "")
        .replaceAll("Afficher davantage", "")
        .replaceAll("John Doe", "")
        .replaceAll("City skyline", "")
        .replaceAll("Photo By:", "")
        .replaceAll("Birthday Sparks", "")
        .replaceAll("Fashion Magazine", "")
        .replaceAll("Blurred Lines", "")
        .replaceAll("Photo by:", "");

      // Divise le texte en mots en utilisant les espaces comme séparateurs
      const words = text.split(" ");
      // Retourne le nombre de mots
      console.log(
        "nombre de mot dans la page : ",
        words.length,
        "\nTexte regroupé de la page : ",
        [{ text }]
      );
      return words.length;
    };

    // Obtient le contenu du div avec l'ID "content"
    const contentDiv = $("#dm_content, #Content")[0];
    const contentText = contentDiv ? contentDiv.textContent : false;
    contentText && countWords(contentText);

    //Start meta check
    const title = $('meta[property="og:title"]').attr("content");
    const desc = $('meta[name="description"]').attr("content");
    const titleLength = title.length;
    const checkTitle = titleLength > 0;
    const recoTitle = " Entre 50 et 60 caractères.";
    const checkValideTitle =
      titleLength >= 50 && titleLength <= 65 ? true : false;
    const scoreTitle = checkValideTitle ? 2.5 : 0;

    //data title
    dataChecker.meta_check.meta[0].meta_state =
      title && titleLength ? true : false;
    dataChecker.meta_check.meta[0].meta_txt = checkTitle && title;
    dataChecker.meta_check.meta[0].meta_size = checkTitle && titleLength;
    dataChecker.meta_check.meta[0].meta_reco = recoTitle;
    dataChecker.meta_check.meta[0].meta_score = scoreTitle;

    // desc
    const descLength = desc.length;
    const checkDesc = descLength > 0;
    const recoDesc = " Entre 140 et 156 caractères.";
    const checkValideDesc =
      descLength >= 140 && descLength <= 156 ? true : false;
    const scoreDesc = checkValideDesc ? 2.5 : 0;

    //data desc
    dataChecker.meta_check.meta[1].meta_state =
      desc && descLength ? true : false;
    dataChecker.meta_check.meta[1].meta_txt = checkDesc && desc;
    dataChecker.meta_check.meta[1].meta_size = checkDesc && descLength;
    dataChecker.meta_check.meta[1].meta_reco = recoDesc;
    dataChecker.meta_check.meta[1].meta_score = scoreDesc;

    //Data global meta
    dataChecker.meta_check.global_score = Number(
      (scoreTitle + scoreDesc).toFixed(2)
    );
    dataChecker.meta_check.meta_check_state =
      checkTitle && checkDesc ? true : false;
    let nbMeta = 0;
    if (checkDesc && checkTitle) {
      nbMeta = 2;
    } else if (!checkDesc && !checkTitle) {
      nbMeta = 0;
    } else {
      nbMeta = 1;
    }
    dataChecker.meta_check.nb_meta = nbMeta;

    console.log(
      "----------------------------- Check META --------------------------------------------"
    );
    title && checkTitle
      ? console.log(
          `%c Meta title : ${title} -> caractère : ${titleLength} ----- (de 50 à 65)`,
          `color:${checkValideTitle ? "green" : "red"}`
        )
      : console.log(`%c Meta title non présent !!!`, `color:red`);
    desc && desc.length > 0
      ? console.log(
          `%c Meta description : ${desc} -> caractère : ${descLength} ----- (de 140 à 156)`,
          `color:${checkValideDesc ? "green" : "red"}`
        )
      : console.log(`%c Meta desc non présente !!!`, `color:red`);
    console.log(
      "----------------------------- END Check META --------------------------------------------"
    );
    console.log(
      "----------------------------- Check ALT images --------------------------------------------"
    );
    let nb_alt_imgs_wrong = 0;
    let nbImg = 0;
    let scoreTabAltImg = [];
    dataChecker.alt_img_check.alt_img = [];
    console.log(
      "______________________alt img : ",
      dataChecker.alt_img_check.alt_img
    );
    $("img, svg").each(function (i, t) {
      const src = $(this).attr("src")
        ? $(this).attr("src")
        : $(this).attr("data-src");
      const filterDomain =
        src &&
        this.tagName !== "svg" &&
        !src.includes("mappy") &&
        !src.includes("cdn.manager.solocal.com") &&
        !src.includes("static.cdn-website");
      if (filterDomain) {
        const alt = $(this).attr("alt");
        nbImg++;

        !alt && alt === ""
          ? (console.log(`%cNO ALT >>> ${src}`, "color:red"),
            (nb_alt_imgs_wrong += 1),
            dataChecker.alt_img_check.alt_img.push({
              alt_img_state: "true",
              alt_img_src: src,
              alt_img_score: 0,
            }),
            scoreTabAltImg.push(0))
          : dataChecker.alt_img_check.alt_img.push(
              {
                alt_img_state: "true",
                alt_img_src: src,
                alt_img_score: 5,
              },
              scoreTabAltImg.push(5)
            );
      } else if (
        this.tagName == "svg" &&
        this.getAttribute("alt") &&
        this.getAttribute("alt").length < 1
      ) {
        console.log(
          `%cNO ALT SVG >>> ${(this.getAttribute("data-icon-name"), this)}`,
          "color:red"
        );
        nb_alt_imgs_wrong += 1;
        dataChecker.alt_img_check.alt_img.push({
          alt_img_state: "true",
          alt_img_src: src,
          alt_img_score: 0,
        });
        scoreTabAltImg.push(0);
        console.log(this);
      } else if (
        this.tagName == "svg" &&
        this.getAttribute("alt") &&
        this.getAttribute("alt").length > 2
      ) {
        dataChecker.alt_img_check.alt_img.push({
          alt_img_state: "true",
          alt_img_src: src,
          alt_img_score: 5,
        });
        scoreTabAltImg.push(0);
      }
    });
    const scoreAlt = nb_alt_imgs_wrong > 0 ? 0 : 5;
    dataChecker.alt_img_check.alt_img_check_state = nbImg ? true : false;
    dataChecker.alt_img_check.nb_alt_img = nbImg;
    dataChecker.alt_img_check.global_score =
      scoreTabAltImg.reduce((a, b) => a + b) / nbImg;

    console.log(
      "----------------------------- END Check ALT images --------------------------------------------"
    );
    console.log(
      "----------------------------- Check Hn Validity --------------------------------------------"
    );

    let rendu = "";
    let h1Count = 0;
    let h2Count = 0;
    let h3Count = 0;
    const h1Indexes = [];

    const verifierStructureHn = (HnArray) => {
      const niveaux = ["h1", "h2", "h3", "h4", "h5", "h6"];
      let hasH1 = false;
      let hasH2 = false;
      let hasH3 = false;
      let validStructure = true;

      for (let i = 0; i < HnArray.length; i++) {
        const balise = HnArray[i];
        const niveauActuel = niveaux.indexOf(balise.nodeName.toLowerCase());

        if (balise.nodeName.toLowerCase() === "h1") {
          h1Count++;
          if (!h1Indexes.includes(i)) {
            h1Indexes.push(i);
            if (i === 0) {
              rendu += `${balise.nodeName.toLowerCase()} - Valide_`;
              console.log(
                `%c${balise.nodeName.toLowerCase()} - Valide`,
                "color: green"
              );
              hasH1 = true;
            } else if (i === 0 && niveauActuel !== "h1") {
              rendu += `${balise.nodeName.toLowerCase()} - Non valide (premier tag doit être h1)_`;
              console.log(
                `%c${balise.nodeName.toLowerCase()} - Non valide (premier tag doit être h1)`,
                "color: red"
              );
              validStructure = false;
            }
          } else {
            rendu += `${balise.nodeName.toLowerCase()} - Non valide (doublon)_`;
            console.log(
              `%c${balise.nodeName.toLowerCase()} - Non valide (doublon)`,
              "color: red"
            );
            validStructure = false;
          }

          if (h1Count > 1 && i > 0) {
            if (balise.nodeName.toLowerCase() === "h1") {
              rendu += `${balise.nodeName.toLowerCase()} - Non valide (doublon)_`;
              console.log(
                `%c${balise.nodeName.toLowerCase()} - Non valide (doublon)`,
                "color: red"
              );
              validStructure = false;
            }
          }
        } else if (balise.nodeName.toLowerCase() === "h2") {
          if (!hasH1) {
            rendu += `${balise.nodeName.toLowerCase()} - Non valide (h1 manquant)_`;
            console.log(
              `%c${balise.nodeName.toLowerCase()} - Non valide (h1 manquant)`,
              "color: red"
            );
            validStructure = false;
          } else {
            h2Count++;
            rendu += `${balise.nodeName.toLowerCase()} - Valide_`;
            console.log(
              `%c${balise.nodeName.toLowerCase()} - Valide`,
              "color: green"
            );
            hasH2 = true;
          }
        } else if (balise.nodeName.toLowerCase() === "h3") {
          if (!hasH1 || !hasH2) {
            rendu += `${balise.nodeName.toLowerCase()} - Non valide (h1 ou h2 manquant)_`;
            console.log(
              `%c${balise.nodeName.toLowerCase()} - Non valide (h1 ou h2 manquant)`,
              "color: red"
            );
            validStructure = false;
          } else {
            h3Count++;
            rendu += `${balise.nodeName.toLowerCase()} - Valide_`;
            console.log(
              `%c${balise.nodeName.toLowerCase()} - Valide`,
              "color: green"
            );
            hasH3 = true;
          }
        } else if (balise.nodeName.toLowerCase() === "h4") {
          if (!hasH1 || !hasH2 || !hasH3) {
            rendu += `${balise.nodeName.toLowerCase()} - Non valide (h1, h2 ou h3 manquant)_`;
            console.log(
              `%c${balise.nodeName.toLowerCase()} - Non valide (h1, h2 ou h3 manquant)`,
              "color: red"
            );
            validStructure = false;
          } else {
            rendu += `${balise.nodeName.toLowerCase()} - Valide_`;
            console.log(
              `%c${balise.nodeName.toLowerCase()} - Valide`,
              "color: green"
            );
          }
        } else {
          // Vérifier si le niveau actuel est inférieur au niveau précédent ou a des niveaux intermédiaires manquants
          const niveauPrecedent = niveaux.indexOf(
            HnArray[i - 1].nodeName.toLowerCase()
          );
          if (niveauActuel <= niveauPrecedent) {
            rendu += `${balise.nodeName.toLowerCase()} - Non valide_`;
            console.log(
              `%c${balise.nodeName.toLowerCase()} - Non valide`,
              "color: red"
            );
            validStructure = false;
          } else if (niveauActuel - niveauPrecedent > 1) {
            for (let j = niveauPrecedent + 1; j < niveauActuel; j++) {
              rendu += `${niveaux[j]} - Non valide (niveau manquant)_`;
              console.log(
                `%c${niveaux[j]} - Non valide (niveau manquant)`,
                "color: red"
              );
              validStructure = false;
            }
          } else {
            rendu += `${balise.nodeName.toLowerCase()} - Valide_`;
            console.log(
              `%c${balise.nodeName.toLowerCase()} - Valide`,
              "color: green"
            );
          }
        }
      }

      if (validStructure) {
        console.log("Structure des Hn valide.");
      } else {
        console.log("Structure des Hn invalide.");
      }
    };
    const allTagHn = document.querySelectorAll("h1,h2,h3,h4,h5,h6");
    const HnArray = Array.from(allTagHn, (element) => element);
    verifierStructureHn(HnArray);
    let globalScoreHnReco = [],
      nbHn = 0;
    dataChecker.hn.hn_reco.hn.length = 0;
    allTagHn.forEach((t, i) => {
      nbHn++;
      const nbLetters = t.textContent.length;
      const tagName = t.tagName;
      const tagContent = t.textContent
        .replaceAll("\n", " ")
        .replaceAll(",", " ")
        .replaceAll("\t", "")
        .replaceAll("'", "’")
        .replaceAll("l'", "")
        .replaceAll("l’", "")
        .replaceAll("t’", "")
        .replaceAll("  ", " ");
      let words = tagContent.split(" ");
      const pronoms = [
        "&",
        "?",
        ":",
        "je",
        "me",
        "m’",
        "moi",
        "tu",
        "te",
        "t’",
        "l'",
        "toi",
        "par",
        "nous",
        "vous",
        "il",
        "de",
        "des",
        "près",
        "pour",
        "vers",
        "selon",
        "vos",
        "et",
        "aux",
        "ou",
        "où",
        "votre",
        "notre",
        "à",
        "a",
        "sur",
        "dans",
        "alentours",
        "elle",
        "ils",
        "elles",
        "se",
        "en",
        "y",
        "le",
        "la",
        "l’",
        "les",
        "lui",
        "soi",
        "leur",
        "eux",
        "lui",
        "leur",
        "celui",
        "celui-ci",
        "celui-là",
        "celle",
        "celle-ci",
        "celle-là",
        "ceux",
        "ceux-ci",
        "ceux-là",
        "celles",
        "celles-ci",
        "celles-là",
        "ce",
        "ceci",
        "cela",
        "ça",
        "le mien",
        "le tien",
        "le sien",
        "la mienne",
        "la tienne",
        "la sienne",
        "les miens",
        "les tiens",
        "les siens",
        "les miennes",
        "les tiennes",
        "les siennes",
        "le nôtre",
        "le vôtre",
        "le leur",
        "la nôtre",
        "la vôtre",
        "la leur",
        "les nôtres",
        "les vôtres",
        "les leurs",
        "qui",
        "que",
        "quoi",
        "dont",
        "où",
        "lequel",
        "auquel",
        "duquel",
        "laquelle",
        "à laquelle",
        "de laquelle",
        "lesquels",
        "auxquels",
        "desquels",
        "lesquelles",
        "auxquelles",
        "desquelles",
        "qui",
        "que",
        "quoi",
        "qu'est-ce",
        "lequel",
        "auquel",
        "duquel",
        "laquelle",
        "à laquelle",
        "de laquelle",
        "lesquels",
        "auxquels",
        "desquels",
        "lesquelles",
        "auxquelles",
        "desquelles",
        "on",
        "tout",
        "un",
        "une",
        "l'un",
        "l'une",
        "les uns",
        "les unes",
        "un autre",
        "une autre",
        "d'autres",
        "l'autre",
        "les autres",
        "aucun",
        "aucune",
        "aucuns",
        "aucunes",
        "certains",
        "certaine",
        "certains",
        "certaines",
        "tel",
        "telle",
        "tels",
        "telles",
        "tout",
        "toute",
        "tous",
        "toutes",
        "le même",
        "la même",
        "les mêmes",
        "nul",
        "nulle",
        "nuls",
        "nulles",
        "quelqu'un",
        "quelqu'une",
        "quelques uns",
        "quelques unes",
        "personne (aucun)",
        "autrui",
        "quiconque",
        "d’aucun",
        "autrui",
        "on",
        "personne",
        "quelque chose",
        "quiconque",
        "rien",
        "chacun",
        "chacune",
        "plusieurs",
        "d’aucuns",
        "Quelles",
        "quelles",
        "quelles",
        "sont",
        "Quels",
        "quels",
        "encore",
        "Encore",
        "Nos",
        "nos",
      ];

      words = words.filter((w) => !pronoms.includes(w.toLowerCase()));
      console.log({
        [tagName]: tagContent,
        " nb lettres": nbLetters,
        "nombre de mots comptabilisés (de 5 à 8) ": Number(words.length),
        "mots comptabilisés": words.join(",").replaceAll("\n", " "),
        node: t,
        index: i,
      });

      if (
        ((tagName === "H1" || tagName === "H2") && nbLetters < 50) ||
        nbLetters > 90
      ) {
        dataChecker.hn.hn_reco.hn.push({
          hn_type: tagName,

          hn_letters_count: nbLetters,

          hn_txt: tagContent,

          hn_index: i,

          hn_words_sliced: words,

          hn_words_count: Number(words.length),

          hn_preco: "Nombre de mots comptabilisés (de 5 à 8)",

          hn_score: 0,
        });
        globalScoreHnReco.push(0);
        console.log(
          "%c" +
            tagName +
            " : " +
            tagContent +
            " ------ Erreur -> nombre de caractères : " +
            nbLetters +
            ", ne rentre pas dans la préco de 50 -> 90 caractères",
          "color:red"
        );
      } else {
        dataChecker.hn.hn_reco.hn.push({
          hn_type: tagName,

          hn_letters_count: nbLetters,

          hn_txt: tagContent,

          hn_index: i,

          hn_words_sliced: words,

          hn_words_count: Number(words.length),

          hn_preco: "Nombre de mots comptabilisés (de 5 à 8)",

          hn_score: 5,
        });
        globalScoreHnReco.push(5);
      }
    });
    console.log(
      "----------------------------- START check Hn outline validity -----------------------------"
    );


    rendu = rendu.replaceAll('"', "").replaceAll("'", "").slice(0, -1);
    const renduTab = rendu.split("_");
    let scoreOutlineHn = [];
    dataChecker.hn.hn_outline.hn = [];
    renduTab.forEach((t, i) => {
      let validity = String(t.split(" - ")[1]).includes("Non") ? false : true;
      const score = validity ? 5 : 0;
      dataChecker.hn.hn_outline.hn.push({
        hn_type: t.split(" - ")[0],
        hn_validity: validity,
        hn_validity_message: t.split(" - ")[1],
        hn_validity_score: score,
      });
      scoreOutlineHn.push(score);
    });
    const scoreHnOutline = Number(
      (scoreOutlineHn.reduce((a, b) => a + b) / scoreOutlineHn.length).toFixed(
        2
      )
    );
    const scoreHnReco =
      globalScoreHnReco.length > 1
        ? Number(
            (
              globalScoreHnReco.reduce((a, b) => a + b) /
              globalScoreHnReco.length
            ).toFixed(2)
          )
        : globalScoreHnReco[0];
    dataChecker.hn.hn_reco.hn_check_state = true;
    dataChecker.hn.hn_reco.global_score = scoreHnReco;
    dataChecker.hn.hn_outline.global_score = scoreHnOutline;
    dataChecker.hn.hn_check_state = true;
    dataChecker.hn.global_score = Number(
      ((scoreHnReco + scoreHnOutline) / 2).toFixed(2)
    );

    dataChecker.hn.nb_hn = nbHn;

    console.log(
      "----------------------------- END check Hn outline validity -----------------------------"
    );

    const strongOrBold = $(
      "#Content b, #Content strong, #Content STRONG, #dm_content b, #dm_content B, #dm_content strong, #dm_content STRONG"
    );
    strongOrBold &&
      console.log(
        "----------------------------- Start Check strong & bold valitidy --------------------------------------------"
      );

    let cmpBold = 0,
      boldArray = [];
    strongOrBold.each(function (i, t) {
      const isHnClosest =
        $(this)[0].tagName.toLowerCase() === "h1" ||
        $(this)[0].tagName.toLowerCase() === "h2" ||
        $(this)[0].tagName.toLowerCase() === "h3" ||
        $(this)[0].tagName.toLowerCase() === "h4" ||
        $(this)[0].tagName.toLowerCase() === "h5" ||
        $(this)[0].tagName.toLowerCase() === "h6";
      if (t.textContent.length > 1 && t.textContent !== " ") {
        if (!isHnClosest) {
          cmpBold++;
          boldArray.push({
            target: t,
            text: t.textContent,
            nbWords: t.textContent.includes(" ")
              ? t.textContent.split(" ").length
              : 1,
          });
        }
      }
    });
    $("#dm_content span").each(function (t) {
      const isBold = (el) =>
        el.attr("style") &&
        (el.attr("style").includes("font-weight: bold") ||
          (el.attr("style").includes("font-weight: 700") &&
            $(this)[0].textContent.trim().length));
      const isMultiSpan =
        isBold($(this)) &&
        isBold($(this).children()) &&
        $(this)[0].textContent.trim().length
          ? true
          : false;
      let target = isMultiSpan ? $(this).children() : $(this);
      const duplicateBold =
        isMultiSpan &&
        $(this)[0]
          .textContent.trim()
          .includes($(this).children()[0].textContent.trim());

      isMultiSpan &&
        console.log(
          { target },
          "  isBold : ",
          isBold(target),
          { isMultiSpan },
          { duplicateBold },
          "   text content",
          target[0].textContent,
          " text length",
          $(this)[0].textContent.trim().length
        );
      isBold(target) &&
        target[0].textContent !== "\n" &&
        target[0].textContent !== "" &&
        target[0].textContent.length > 1 &&
        (boldArray.push({
          target: target[0], // Modification : Ajouter [0] pour obtenir l'élément DOM
          text: target[0].textContent.trim(),
          nbWords: target[0].textContent.trim().split(" ").length,
        }),
        cmpBold++);
      duplicateBold && cmpBold--;
    });

    // Créer un nouvel tableau pour stocker les éléments uniques
    const objSansDoublons = [];

    // Parcourir l'array initial boldArray
    for (let i = 0; i < boldArray.length; i++) {
      const element = boldArray[i];
      const { target, text, nbWords } = element;

      // Vérifier si les propriétés "text" et "nbWords" sont identiques
      const isDuplicate = objSansDoublons.some(
        (item) => item.text === text && item.nbWords === nbWords
      );
      if (!isDuplicate) {
        objSansDoublons.push({
          target, // Modification : Ne pas accéder à [0] pour conserver l'élément DOM
          text,
          nbWords,
        });
      }
    }
    dataChecker.bold_check.bold_txt = [];
    dataChecker.bold_check.bold_check_state =
      objSansDoublons.length === 0 || objSansDoublons === undefined
        ? false
        : true;
    dataChecker.bold_check.bold_check_state;
    const isBoldValid = cmpBold >= 3 && cmpBold <= 5;
    !isBoldValid
      ? console.log(
          "%c Attention le nombre déléments mis en gras ne respect pas le standard (3 à 5 expressions), ici >>> " +
            objSansDoublons.length,
          "color:red"
        )
      : console.log(
          "%c Le nombre déléments mis en gras respect le standard (3 à 5 expressions), ici >>> " +
            objSansDoublons.length,
          "color:green"
        ),
      console.log(objSansDoublons),
      objSansDoublons.map((t) => {
        dataChecker.bold_check.bold_check_state = true;
        (dataChecker.bold_check.nb_bold = objSansDoublons.length),
          dataChecker.bold_check.bold_txt.push({
            bold_txt_state: true,
            bold_txt: t.text,
            bold_nb_words: t.nbWords,
          });
        dataChecker.bold_check.global_score =
          isBoldValid && objSansDoublons.length ? 5 : 0;
      }),
      cmpBold > 0 &&
        console.log(
          "----------------------------- End Check strong & bold valitidy --------------------------------------------"
        );
    const formatBytes = (bytes) => {
      return bytes < 1024
        ? bytes + " Bytes"
        : bytes < 1048576
        ? (bytes / 1024).toFixed(2) + " KB"
        : bytes < 1073741824
        ? (bytes / 1048576).toFixed(2) + " MB"
        : (bytes / 1073741824).toFixed(2) + " GB";
    };
    let urlsDuplicate = [],
      requestInitiatedCount = 0,
      requestCompletedCount = 0,
      imagesForAnalyseImg = [],
      imagesForAnalyseBG = [];
    dataChecker.img_check.alt_img = [];
    dataChecker.img_check.size_img = [];
    dataChecker.img_check.ratio_img = [];
    let ratio_scores = [],
      alt_scores = [],
      size_scores = [];

    let cmpFinal = 0;
    const checkUrlImg = async (args) => {
      let result = false;
      requestInitiatedCount++;
      let response;
      const isBgImage = args[4].includes("bg");
      let bgImg = new Image();
      let fsize = "0";
      if (args[1] !== !!0) {
        args[1] = args[1].includes("?") ? args[1].split("?")[0] : args[1];
        try {
          response = await fetch(args[1], {
            method: "GET",
            redirect: "manual", // Permet de suivre les redirections explicitement
            mode: "cors",
          });

          if (response.redirected) {
            if (redirectCount >= 2) {
              throw new Error("Trop de redirections");
            }

            const redirectUrl = response.headers.get("Location");
            if (redirectUrl) {
              redirectCount++;
            }
          }

          if (isBgImage) {
            await new Promise((resolve) => {
              bgImg.src = args[1];
              bgImg.onload = function () {
                args[5] = this.naturalWidth;
                args[6] = this.naturalHeight;
                resolve();
              };
            });
          }

          fsize = response.headers.get("content-length");
          requestCompletedCount++;
          if (fsize) {
            const ratio = Number(
              ((args[5] / args[7] + args[6] / args[8]) / 2).toFixed(2)
            );

            result = {
              target: args[0],
              url: new URL(args[1]).href,
              size: formatBytes(fsize),
              alt: args[2],
              title: args[3],
              type: args[4],
              Imgwidth: args[5],
              Imgheight: args[6],
              parentwidth: args[7],
              parentheight: args[8],
              ratioWidth: args[5] / args[7],
              ratioHeight: args[6] / args[8],
              ratio:
                String(ratio) === ("Infinity" || 0) ? "image cachée" : ratio,
            };
            console.log(result, "");

            if (
              result.type === "srcImage" &&
              (args[2] === null || args[2] === false)
            ) {
              console.log(
                "%c Warning SRC ALT not working : " + new URL(args[1]).href,
                "color: red"
              );
            } else if (ratio > 3 && String(ratio) !== "Infinity") {
              console.log(
                "%c Warning : ratio supérieur à 3 : " + ratio,
                "color: orange"
              );
            } else if (
              ratio > 2 &&
              String(ratio) !== "Infinity" &&
              (args[5] > 900 || args[6] > 900)
            ) {
              console.log(
                "%c Warning : ratio supérieur à 2 : " +
                  ratio +
                  "  pour une image dépassant les 900px",
                "color: orange"
              );
            }
            /*256000 Bytes = 250 KB*/
            if (fsize > 256000 && fsize < 317435) {
              console.log(
                `%c Warning File size exceeds 250 KB : ${formatBytes(
                  fsize
                )}  url : ${result.url}`,
                "color: orange"
              );
            } /*317435 Bytes = 310 KB*/ else if (fsize > 317435) {
              console.log(
                `%c Warning File size exceeds 310 KB : ${formatBytes(
                  fsize
                )}  url : ${result.url}`,
                "color: red"
              );
            }
            result.target.parents(".owl-item.cloned").length === 0 &&
              result.target.parents("#logo").length !== 1 &&
              !result.target.hasClass("vc_parallax-inner") &&
              urlsDuplicate.push({ url: result.url, target: result.target });

            dataChecker.img_check.nb_img = requestCompletedCount;
            size_scores.push(
              fsize > 317435 ? 0 : fsize > 256000 && fsize < 317435 ? 2.5 : 5
            );
            alt_scores.push(result.alt[2] !== false ? 5 : 0);
            ratio_scores.push(
              result.ratio < 2 || result.ratio == "image cachée"
                ? 5
                : result.ratio > 2 && result.ratio < 3
                ? 2.5
                : 0
            );
            dataChecker.img_check.alt_img.push({
              alt_img_state: true,
              alt_img_src: result.url,
              alt_img_score: result.alt[2] !== false ? 5 : 0,
            }),
              dataChecker.img_check.size_img.push({
                size_img_state: "true",
                size_img_src: result.url,
                size_img: result.size,
                size_img_score:
                  fsize > 317435
                    ? 0
                    : fsize > 256000 && fsize < 317435
                    ? 2.5
                    : 5,
                check_title: "Images size",
              }),
              dataChecker.img_check.ratio_img.push({
                ratio_img_state: "true",
                ratio_img_src: result.url,
                type_img: result.type,
                img_height: result.Imgheight,
                img_width: result.Imgwidth,
                parent_img_height: result.parentwidth,
                parent_img_width: result.parentheight,
                ratio_parent_img_height: result.ratioHeight,
                ratio_parent_img_width: result.ratioWidth,
                ratio_img: result.ratio,
                ratio_img_score:
                  result.ratio < 2 ||
                  result.ratio == "image cachée" ||
                  result.Imgheight < 150 ||
                  result.Imgwidth < 150
                    ? 5
                    : result.ratio >= 4
                    ? 2.5
                    : 0,
              });
          }
        } catch (error) {
          requestCompletedCount++;
          console.log("%cNot available", "color:yellow");
          console.log(error, error.message);
          result && console.log({ result }, result.target);
        }
      } else {
        console.log("url not valid : ", result.url);
      }
      //console.log({requestInitiatedCount}, {requestCompletedCount});
      //console.log('external cmp : ',{cmpFinal});
      if (requestInitiatedCount === requestCompletedCount && cmpFinal < 1) {
        setTimeout(function () {
          cmpFinal++;
          //console.log({cmpFinal});
          console.log(" Fin du traitement du check des images size and alt");
          checkUrlImgDuplicate();
        }, 300);
      }
    };

    const trierUrlsRepetees = (items) => {
      const occurences = {};
      items.forEach((item) => {
        const isValidUrl =
          item.url.includes("/uploads/") ||
          item.url.includes("le-de.cdn-website");
        if (isValidUrl) {
          occurences[item.url] = occurences[item.url]
            ? occurences[item.url] + 1
            : 1;
          occurences[item.target] = occurences[item.target] || 0;
        }
      });
      const urlsRepetees = Object.keys(occurences)
        .filter((key) => occurences[key] > 1)
        .map((key) => ({
          url: key,
          target: items.find((item) => item.url === key)?.target,
          iteration: occurences[key],
        }));

      return urlsRepetees;
    };
    let global_size_scores, global_alt_scores, global_ratio_scores;
    const checkUrlImgDuplicate = () => {
      console.log(
        "url duplicate length : ",
        trierUrlsRepetees(urlsDuplicate).length
      );
      if (trierUrlsRepetees(urlsDuplicate).length) {
        console.log(
          "----------------------------- Start Check duplicate images --------------------------------------------"
        );
        console.log(
          "%cAttention vous avez des images dupliquées sur cette page",
          "color:orange"
        );
        console.log(trierUrlsRepetees(urlsDuplicate));
        console.log(
          "----------------------------- End Check duplicate images --------------------------------------------"
        );
      }
      initDataChecker();
    };

    const checkerImageWP = () => {
      console.log(
        "----------------------------- Check validity global image --------------------------------------------"
      );
      //https://cors-anywhere.herokuapp.com/url-image-duda.jpg

      $("img").each(function (i, t) {
        const src = $(this).attr("src");
        let srcV = src ? src : $(this).attr("data-src");
        const altValid =
          $(this).attr("alt") &&
          $(this).attr("alt").length > 0 &&
          $(this).attr("alt") !== "";
        const isDudaImage = srcV && srcV.includes("cdn-website");
        srcV =
          !isDudaImage &&
          srcV &&
          srcV.at(0).includes("/") &&
          srcV.includes("/wp-content/")
            ? window.location.origin +
              "/wp-content/" +
              srcV.split("/wp-content/")[1]
            : srcV;

        if (srcV) {
          $(this) && srcV;
          !srcV.includes("mappy") &&
            !srcV.includes("cdn.manager.solocal.com") &&
            !srcV.includes("gravityforms") &&
            !srcV.includes("static.cdn-website") &&
            imagesForAnalyseImg.push({
              key: "src-img-" + i,
              value: [
                $(this),
                srcV, // ? 'https://reverse-proxy-cors.herokuapp.com/'+$(this)[0].src : $(this)[0].src,
                altValid ? $(this).attr("alt") : false,
                $(this)[0].getAttribute("title"),
                "srcImage",
                $(this)[0].naturalWidth,
                $(this)[0].naturalHeight,
                $(this)[0].parentNode.offsetWidth,
                $(this)[0].parentNode.offsetHeight,
              ],
            });
        }
      });

      let cmpBgImg = 0;
      let allUrlsImages = [];
      $("html *").each(function (i, t) {
        if (
          $(this).css("background-image") &&
          String($(this).css("background-image")) !== "none" &&
          String($(this).css("background-image")).includes("url(")
        ) {
          let bgimg = String($(this).css("background-image"))
            .split('url("')[1]
            .split('")')[0];
          let _this = $(this);
          let customImg = new Image();
          bgimg =
            bgimg.includes("http") || bgimg.includes("data:image/")
              ? bgimg
              : window.location.origin + bgimg;
          const isDudaImage =
            bgimg.includes("https://le-de.cdn-website.com/") ||
            bgimg.includes("https://de.cdn-website.com") ||
            bgimg.includes("dd-cdn.multiscreensite.com")
              ? true
              : false;
          const detectAnotherOrigin = !bgimg.includes(window.location.origin);

          ((detectAnotherOrigin && !isDudaImage) ||
            (detectAnotherOrigin &&
              bgimg.includes("/wp-content/") &&
              bgimg.includes("/dd-cdn.multiscreensite"))) &&
            console.log(
              "%cImage url not current domain origin :" + bgimg,
              "color:yellow;"
            );
          bgimg =
            detectAnotherOrigin &&
            !isDudaImage &&
            bgimg.includes("/wp-content/") &&
            bgimg.split("/wp-content/")[1]
              ? window.location.origin +
                "/wp-content/" +
                bgimg.split("/wp-content/")[1]
              : bgimg;
          // bgimg = (isDudaImage) && bgimg;
          // ? 'https://reverse-proxy-cors.herokuapp.com/'+bgimg : bgimg;

          if (bgimg && !bgimg.includes("undefined")) {
            if (
              !bgimg.includes("mappy") &&
              !bgimg.includes("cdn.manager.solocal.com") &&
              !bgimg.includes("gravityforms")
            ) {
              cmpBgImg++;
              !bgimg.includes("data:image/")
                ? imagesForAnalyseBG.push({
                    key: `bgimg-${cmpBgImg}`,
                    value: [
                      $(this),
                      bgimg,
                      "no alt -> gbimg",
                      "no title -> gbimg",
                      "bgImage",
                      _this.naturalWidth,
                      _this.naturalHeight,
                      _this[0].offsetWidth,
                      _this[0].offsetHeight,
                    ],
                  })
                : console.log(
                    "base64 img detected : ",
                    bgimg.includes("data:image/"),
                    " width : ",
                    customImg.width,
                    " height : ",
                    customImg.height,
                    " url : ",
                    bgimg
                  );
            }
          }
        }
      });

      const allImg = [...imagesForAnalyseBG, ...imagesForAnalyseImg];
      cmpAllImg = 0;
      console.log({ allImg });
      for (const item of allImg) {
        const content = item.value;
        checkUrlImg(content);
        allUrlsImages.push(item.value[1]);
      }
    };

    console.log(
      "--------------------- Start check validity links -----------------------------"
    );
    let sliderButtonValidity = false;
    if ($(".dmImageSlider .slide-button-visible").length) {
      sliderButtonValidity =
        $(".dmImageSlider a") &&
        $(".dmImageSlider a").attr("href") &&
        $(".dmImageSlider a").attr("href").includes("/");
      if (sliderButtonValidity === !!0 || sliderButtonValidity === "") {
        console.log(
          "%c \n !!! ATTENTION !!! Votre slider comporte un bouton mais aucun lien n'a été paramètré.\n",
          "color:red"
        );
        console.log($(".dmImageSlider .slide-button"));
      }
    }
    let timeout = 30000;

    let nbLinks = 0,
      scoreCheckLink = [];
    dataChecker.link_check.link = [];
    function check(_url, _txt, _node) {
      const response = {
        status: null,
        document: null,
      };
      //_url = (_url.includes('solocaldudaadmin.eu-responsivesiteeditor.com'))? window.location.href.split('?')[0]+_url.split('solocaldudaadmin.eu-responsivesiteeditor.com')[1] : _url
      nbLinks++;
      dataChecker.link_check.nb_link = nbLinks;
      return new Promise(function (resolve, reject) {
        let fetchTimeout = null;
        fetch(_url, {
          method: "GET",
          //redirect: "manual", // Permet de suivre les redirections explicitement
          mode: "cors",
        })
          .then((res) => {
            clearTimeout(fetchTimeout);
            response.status = res.status;
            response.document = res.responseText;

            resolve(response);
            if (res.ok) {
              console.log(
                `url: ${_url} %c${_txt} -> %cstatus: %c${response.status}`,
                "color:cornflowerblue;",
                "color:white;",
                "color:green"
              );
              scoreCheckLink.push(5);
            } else {
              console.log(
                `url: ${_url} %c${_txt} -> %cstatus: %c${response.status}`,
                "color:cornflowerblue;",
                "color:white;",
                "color:red"
              );
              console.log("node: ", _node);
              scoreCheckLink.push(0);
            }

            dataChecker.link_check.link.push({
              link_state: true,
              link_status: response.status,
              link_url: _url,
              link_text: _txt.replace(",  text : ", "").trim(),
              link_score: res.ok ? 5 : 0,
              link_msg: res.ok ? "Lien valide." : "Lien non valide.",
            });

            dataChecker.link_check.link_check_state = true;
          })
          .catch((error) => {
            response.status = 404;
            resolve(response);
          });

        fetchTimeout = setTimeout(() => {
          response.status = 408;
          resolve(response);
        }, (timeout += 1000));
      });
    }
    let linksAnalyse = [];
    const linksStack = document.querySelector("#Content")
      ? document.querySelectorAll("#Content a, .social-bar a")
      : document.querySelectorAll(
          "#dm_content a, .dmCall, .dmFooterContainer a"
        );
    $.each(linksStack, function (i, t) {
      let url = t.href;
      if (url) {
        url =
          url.at(0) === "/" || url.at(0) === "?"
            ? window.location.origin + url
            : url;
        let prepubRefonteWPCheck =
          url.includes("site-privilege.pagesjaunes") ||
          url.includes("solocaldudaadmin.eu-responsivesiteeditor")
            ? true
            : !url.includes("pagesjaunes");
        const verif =
          !url.includes("tel:") &&
          !url.includes("mailto:") &&
          !url.includes("javascript:") &&
          !url.includes("logflare") &&
          !url.includes("solocal.com") &&
          !url.includes("sp.report-uri") &&
          !url.includes("chrome-extension") &&
          !url.includes("mappy") &&
          !url.includes("bloctel.gouv.fr") &&
          !url.includes("client.adhslx.com") &&
          prepubRefonteWPCheck &&
          url.at(0) !== "#";
        const externalLink = !url.includes(window.location.origin);
        const txtContent =
          url &&
          url.at(-4) &&
          !url.at(-4).includes(".") &&
          t.textContent.length > 1
            ? ",  text : " + t.textContent.replace(/(\r\n|\n|\r)/gm, "")
            : "";
        ((verif &&
          url.includes(window.location.origin) &&
          url.includes("https")) ||
          url.includes("de.cdn-website.com")) &&
          check(new URL(url).href, txtContent, t, externalLink);

        if (
          verif &&
          externalLink &&
          !url.includes("de.cdn-website.com") &&
          url.includes("https")
        ) {
          console.log(
            `%c Vérifier le lien ${t.textContent.replace(
              /(\r\n|\n|\r)/gm,
              ""
            )} manuellement >>>`,
            "color:red"
          ),
            console.log(new URL(url).href, t);
        } else if (
          verif &&
          externalLink &&
          !url.includes("de.cdn-website.com") &&
          !url.includes("https")
        ) {
          console.log(
            `%c Vérifier le lien ${t.textContent.replace(
              /(\r\n|\n|\r)/gm,
              ""
            )} manuellement et SECURISEZ LE via "https" si ceci est possible >>>`,
            "color:red"
          ),
            console.log(new URL(url).href, t);
        }

        verif &&
          url.includes("https") &&
          check(new URL(url).href, txtContent, t, externalLink);

        checkPhoneNumber = new RegExp(
          /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/
        ).test(url.replaceAll(" ", "").split("tel:")[1]);

        url.includes("tel:") &&
          (checkPhoneNumber
            ? console.log(
                `%cNuméro de téléphone detécté :${url} - Validité : OK`,
                "color:green"
              )
            : console.log(
                `%cNuméro de téléphone detécté :${url} - Validité : KO`,
                "color:red"
              ));

        //linksAnalyse.push(url)
      }
      const dudaPhone =
        $(this).attr("class") !== undefined &&
        $(this).attr("class").includes("dmCall")
          ? $(this).attr("phone")
          : false;
      checkDudaPhoneNumber =
        dudaPhone &&
        new RegExp(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/).test(
          dudaPhone.replaceAll(" ", "")
        );
      if (dudaPhone) {
        console.log(
          "--------------------- Start check validity phone -----------------------------"
        );
        checkDudaPhoneNumber
          ? console.log(
              `%cNuméro de téléphone detécté :${dudaPhone} - Validité : OK`,
              "color:green"
            )
          : console.log(
              `%cNuméro de téléphone detécté :${dudaPhone} - Validité : KO`,
              "color:red"
            );
        console.log(
          "--------------------- End check validity phone -----------------------------"
        );
      }
    });
    linksCounts = {};
    $("#Content a, #dm_content a").each(function (i, t) {
      href = $(this).attr("href");
      href &&
        href.length > 1 &&
        !href.includes("bloctel.gouv.fr") &&
        !href.includes("client.adhslx.com") &&
        href.at(0) !== "#" &&
        linksAnalyse.push(href);
    });

    linksAnalyse.forEach((element) => {
      linksCounts[element] = (linksCounts[element] || 0) + 1;
    });

    const entries = Object.entries(linksCounts);
    const sortedEntries = entries.sort((a, b) => a[1] - b[1]);
    sortedEntries.forEach(([link, count]) => {
      const relativLink =
        link.at(0) === "/" ? window.location.origin + link : link;
      if (count > 1) {
        console.log(
          `%c Attention, vous avez des liens dupliqués sur la page : `,
          "color: orange"
        );
        console.log(
          `%cLien : %c${relativLink} - Nombre de duplications : %c${count}`,
          "color: orange",
          "color:aliceblue",
          "color:red"
        );
      }
    });
    setTimeout(function () {
      console.log(
        "--------------------- END check validity links -----------------------------"
      );
      //$("#Wrapper").length &&
      checkerImageWP();
    }, document.querySelectorAll("a").length * 210);

    //Add globale score in dataChecker
    const initDataChecker = () => {
      console.log("initDataChecker started");

      dataChecker.img_check.nb_img_duplicate.push(
        trierUrlsRepetees(urlsDuplicate).length
          ? trierUrlsRepetees(urlsDuplicate)
          : "OK"
      );
      global_size_scores = Number(
        (size_scores.reduce((a, b) => a + b) / size_scores.length).toFixed(2)
      );
      global_ratio_scores = Number(
        (ratio_scores.reduce((a, b) => a + b) / ratio_scores.length).toFixed(2)
      );
      global_alt_scores = Number(
        (alt_scores.reduce((a, b) => a + b) / alt_scores.length).toFixed(2)
      );
      dataChecker.img_check.global_score = Number(
        (
          (global_ratio_scores + global_size_scores + global_alt_scores) /
          3
        ).toFixed(2)
      );

      dataChecker.img_check.img_check_state = true;

      //Calculate global scores
      dataChecker.link_check.global_score = scoreCheckLink.length
        ? Number(
            (
              scoreCheckLink.reduce((a, b) => a + b) / scoreCheckLink.length
            ).toFixed(2)
          )
        : 5;
      const globalScore = Number(
        (
          Number(
            dataChecker.alt_img_check.global_score +
              dataChecker.hn.global_score +
              dataChecker.meta_check.global_score +
              dataChecker.img_check.global_score +
              dataChecker.link_check.global_score +
              dataChecker.bold_check.global_score
          ) / 6
        ).toFixed(2)
      );
      dataChecker.global_score = globalScore;
      dataChecker.cdp_global_score.scores = [];
      dataChecker.webdesigner_global_score.scores = [];
      let globalScoreWeb = [],
        globalScoreCDP = [];
      function deepSearchByKey(object, originalKey, matches = []) {
        if (object != null) {
          if (Array.isArray(object)) {
            for (let arrayItem of object) {
              deepSearchByKey(arrayItem, originalKey, matches);
            }
          } else if (typeof object == "object") {
            for (let key of Object.keys(object)) {
              if (key == originalKey) {
                matches.push(object);
              } else {
                deepSearchByKey(object[key], originalKey, matches);
              }
            }
          }
        }
        return matches;
      }
      const allDataProfil = deepSearchByKey(dataChecker, "profil");
      const CDPData = allDataProfil.filter((t) => {
        return t.profil.includes("CDP");
      });
      const WebData = allDataProfil.filter((t) => {
        return t.profil.includes("WEBDESIGNER");
      });

      const filteredDataCDP = CDPData.reduce((acc, item) => {
        acc[item.check_title] = item.global_score;
        globalScoreCDP.push(item.global_score);
        return acc;
      }, {});

      const filteredDataWebdesigner = WebData.reduce((acc, item) => {
        acc[item.check_title] = item.global_score;
        globalScoreWeb.push(item.global_score);
        return acc;
      }, {});

      dataChecker.cdp_global_score.scores = filteredDataCDP;

      dataChecker.webdesigner_global_score.scores = filteredDataWebdesigner;

      const globalScoreWebTotal = Number(
        (
          globalScoreWeb.reduce((a, b) => a + b) / globalScoreWeb.length
        ).toFixed(2)
      );
      console.log({ WebData }, { CDPData });
      const globalScoreCDPTotal = Number(
        (
          globalScoreCDP.reduce((a, b) => a + b) / globalScoreCDP.length
        ).toFixed(2)
      );
      dataChecker.webdesigner_global_score.global_score = globalScoreWebTotal;
      dataChecker.cdp_global_score.global_score = globalScoreCDPTotal;

      dataChecker.state_check = true;
      console.log({ dataChecker });
      console.log(
        "%c--------------------------------------------Fin du traitement globale du checkerImages ----------------------------------------------------------------",
        "color:green"
      );

      // Écouteur d'événement pour le clic sur le bouton
      chrome.storage.sync.get("corsEnabled", function (result) {
        var corsEnabled = result.corsEnabled;
        chrome.storage.sync.set({ corsEnabled: corsEnabled }, function () {
          corsEnabled && chrome.runtime.sendMessage({ corsEnabled: false });
        });
      });
    };
  })(jQuery);
}
!notJquery && init();