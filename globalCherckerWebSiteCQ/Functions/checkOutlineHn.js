(($) => {
  console.log(
    "----------------------------- START check Hn outline validity -----------------------------"
  );
  console.log(" ------------------------------- HnOutlineValidity starting");

  const isHeadingValid = (currentHn, previousHn) => {
    const currentHnIndex = parseInt(currentHn.charAt(1));
    const previousHnIndex = parseInt(previousHn.charAt(1));
    if (currentHn === previousHn) {
      return false;
    }

    if (currentHnIndex !== previousHnIndex + 1) {
      return false;
    }
    if (currentHn === "h1" && previousHn) {
      return false
    }

    return true;
  };

  const hasDuplicateH1 = () => {
    const h1Tags = document.querySelectorAll("h1");
    const h1Texts = Array.from(h1Tags).map((h1) => h1.textContent.toLowerCase());
    const uniqueH1Texts = new Set(h1Texts);

    return h1Texts.length > 1;
  };

  /****** NOUVELLE FONCTION : Détection des Hn scindés par saut de ligne ******/
  const checkSplitHeadings = () => {
    const dmNewParagraphs = document.querySelectorAll(".dmNewParagraph");
    const splitHeadingsIssues = [];

    dmNewParagraphs.forEach((paragraph, index) => {
      const headings = paragraph.querySelectorAll("h1, h2, h3, h4, h5, h6");

      if (headings.length > 1) {
        // Vérifier si plusieurs Hn consécutifs du même niveau
        const headingTypes = Array.from(headings).map(h => h.tagName.toLowerCase());

        // Compter les occurrences de chaque type
        const headingCounts = {};
        headingTypes.forEach(type => {
          headingCounts[type] = (headingCounts[type] || 0) + 1;
        });

        // Détecter si plusieurs Hn du même niveau (probable scindage)
        const hasDuplicateTypes = Object.values(headingCounts).some(count => count > 1);

        if (hasDuplicateTypes) {
          const combinedText = Array.from(headings).map(h => h.textContent.trim()).join(" ");
          const problematicType = Object.keys(headingCounts).find(key => headingCounts[key] > 1);

          splitHeadingsIssues.push({
            container: paragraph,
            headings: Array.from(headings),
            headingType: problematicType,
            count: headingCounts[problematicType],
            combinedText: combinedText,
            index: index
          });

          // Styling visuel du conteneur problématique
          paragraph.style.cssText = `
            border: 3px dashed red !important;
            outline: 5px solid rgba(255, 0, 0, 0.2) !important;
            outline-offset: 5px !important;
            position: relative !important;
            background: rgba(255, 165, 0, 0.1) !important;
          `;

          // Ajouter un message d'avertissement visible
          const warningDiv = document.createElement('div');
          warningDiv.style.cssText = `
            position: absolute;
            top: -30px;
            left: 0;
            background: #ff4444;
            color: white;
            padding: 5px 10px;
            font-size: 12px;
            font-weight: bold;
            border-radius: 3px;
            z-index: 9999;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          `;
          warningDiv.textContent = `⚠️ ${headingCounts[problematicType]} ${problematicType.toUpperCase()} scindés détectés`;
          warningDiv.setAttribute('title', 'Supprimez les sauts de ligne dans votre titre');
          paragraph.style.position = 'relative';
          paragraph.appendChild(warningDiv);

          // Console warning détaillé
          console.log(
            `%c⚠️ ALERTE : Hn scindés détectés dans .dmNewParagraph [${index}]`,
            'color: red; font-size: 14px; font-weight: bold;'
          );
          console.log(
            `%c   Type: ${problematicType.toUpperCase()} × ${headingCounts[problematicType]}`,
            'color: orange;'
          );
          console.log(
            `%c   Texte combiné: "${combinedText}"`,
            'color: orange;'
          );
          console.log(
            `%c   ℹ️ Solution: Supprimer les sauts de ligne dans l'éditeur pour fusionner en un seul ${problematicType.toUpperCase()}`,
            'color: blue;'
          );
          console.log('   Conteneur:', paragraph);
          console.log('   Titres concernés:', headings);
          console.log('---');
        }
      }
    });

    // Résumé global
    if (splitHeadingsIssues.length > 0) {
      console.log(
        `%c⚠️ RÉSUMÉ: ${splitHeadingsIssues.length} bloc(s) avec des Hn scindés détecté(s)`,
        'color: red; font-size: 16px; font-weight: bold; background: yellow; padding: 5px;'
      );

      // Ajouter au dataChecker
      dataChecker.hn.split_headings = {
        detected: true,
        count: splitHeadingsIssues.length,
        issues: splitHeadingsIssues.map(issue => ({
          heading_type: issue.headingType,
          split_count: issue.count,
          combined_text: issue.combinedText,
          container_index: issue.index
        })),
        global_score: 0, // Pénalité
        message: "Des titres ont été scindés par des sauts de ligne dans l'éditeur"
      };
    } else {
      console.log(
        '%c✓ Aucun Hn scindé détecté',
        'color: green; font-weight: bold;'
      );

      dataChecker.hn.split_headings = {
        detected: false,
        count: 0,
        issues: [],
        global_score: 5,
        message: "Aucun titre scindé détecté"
      };
    }

    return splitHeadingsIssues;
  };
  /****** FIN NOUVELLE FONCTION ******/


  let hnTagArray = [], rendu = "", validStructure = true;
  hnTagContentArray = [];
  document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(function (t, i) {
    hnTagArray.push(t.tagName.toLowerCase());
    t.tagName.toLowerCase() == 'h1' && $(t).css("border", "double 3px green");
    t.tagName.toLowerCase() == 'h2' && $(t).css("border", "double 3px purple");
    t.tagName.toLowerCase() == 'h3' && $(t).css("border", "double 3px orange");

    hnTagContentArray.push(t.textContent);
  });

  previousHn = null;

  hnTagArray.forEach(function (currentHn, index) {
    const currentHnContent = hnTagContentArray[index].replaceAll('\n', ' ').replace(/<br\s*\/?>/gi, ' ').replace(/<BR\s*\/?>/gi, ' ');
    const currentHnIndex = parseInt(currentHn.charAt(1));


    if (index > 0) {
      const isValid = isHeadingValid(currentHn, previousHn);

      if (!isValid) {
        const missingHeadingsCount =
          currentHnIndex - (parseInt(previousHn.charAt(1)) + 1);

        for (let i = 1; i <= missingHeadingsCount; i++) {
          const missingHnIndex = parseInt(previousHn.charAt(1)) + i;
          const missingHn = `h${missingHnIndex}`;
          const missingHnContent = `Missing Heading - ${missingHn}`;
          rendu += `${currentHn} -- ${currentHnContent} - Non valide_`;
          console.log(`%c<${missingHn}> - ${missingHnContent}  !!!!  </${missingHn}>`, 'color:red');
          validStructure = false;
        }
      }
      if (currentHn === "h1" && hasDuplicateH1()) {
        rendu += `${currentHn} -- ${currentHnContent} - Non valide_`;

        console.log(`%c<${currentHn}> Warning: Duplicate H1 -- ${currentHnContent}   </${currentHn}>`, 'color:red');
        validStructure = false;
      }
    } else if (index === 0 && currentHn !== "h1") {
      rendu += `${currentHn} -- ${currentHnContent} - Non valide_`;

      console.log(`%c<${currentHn}> Warning: Hn cannot be before H1 -- ${currentHnContent}   </${currentHn}>`, 'color:red');
      validStructure = false;
    }
    rendu += `${currentHn} -- ${currentHnContent} - valide_`;
    console.log(`%c <${currentHn}> - ${currentHnContent} </${currentHn}>`, 'color:green');
    previousHn = currentHn;
  });


  if (validStructure) {
    console.log("Structure des Hn valide.");
  } else {
    console.log("Structure des Hn invalide.");
  }

  /****** APPEL DE LA FONCTION DE DÉTECTION DES Hn SCINDÉS ******/
  console.log('\n========== Vérification des Hn scindés ==========');
  const splitHeadingsFound = checkSplitHeadings();
  console.log('=================================================\n');


  /****** Vérification qu'au moins deux h2 sont suivi du h1 ****************** */
  console.log('Vérification des doubles h2 après h1 >>>>')

  const headings = document.querySelectorAll('h1, h2, h3');

  let h1Found = false;
  let consecutiveH2Count = 0;
  let h3Detected = false;
  const minimumConsecutiveH2Count = 2;

  for (var i = 0; i < headings.length; i++) {
    var currentHeading = headings[i];

    if (i === 0 && currentHeading.tagName.toLowerCase() === 'h1') {
      h1Found = true;
      consecutiveH2Count = 0;
    } else if (!h3Detected && currentHeading.tagName.toLowerCase() === 'h2' && h1Found) {
      consecutiveH2Count++;
    }
  }

  (h1Found && consecutiveH2Count >= minimumConsecutiveH2Count) && console.log('%cLa structure est valide : votre h1 est bien suivi d\'au moins deux h2.', 'color:green');

  (consecutiveH2Count < minimumConsecutiveH2Count) ? console.log('%cAttention : Vous avez un h2 orphelin (ou absent) situé après votre h1. Ils doivent être (au minimum) au nombre de deux.', 'color:orange') :
    !h1Found ? console.log('%cErreur : Aucun H1 n\a été trouvé..', 'color:orange') : '';


  /*************************************** Gestion des precos liée à la longueur de Hn */
  const allTagHn = document.querySelectorAll("h1,h2,h3,h4,h5,h6");
  let globalScoreHnReco = [],
    nbHn = 0;
  dataChecker.hn.hn_reco.hn.length = 0;
  allTagHn.forEach((t, i) => {
    nbHn++;
    const cleanTagContent = t.textContent.trim()
      .replaceAll("\n", " ")
      .replaceAll("\t", "")
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<BR\s*\/?>/gi, ' ')
      .replace(/\s\s+/g, ' ');
    const tagContent = t.innerText.trim()
      .replaceAll("\n", " ")
      .replaceAll(",", " ")
      .replaceAll("\t", "")
      .replaceAll("'", "’")
      .replaceAll("l'", "")
      .replaceAll("l’", "")
      .replaceAll("t’", "")
      .replaceAll("  ", " ")
      .replaceAll('D’', " ")
      .replaceAll('d’', " ")
      .replace(/\s\s+/g, " ");
    const nbLetters = cleanTagContent.length;
    const nbLettersNoSpace = cleanTagContent.replace(/\s+/g, '').length;
    const tagName = t.tagName;

    let words = tagContent.split(" ");
    const exclusesWords = settingWords.exclusesWords;

    words = words.filter((w) => !exclusesWords.includes(w.toLowerCase()));
    console.log({
      [tagName]: cleanTagContent,
      " nb lettres": nbLetters,
      "nb lettre sans espaces": nbLettersNoSpace,
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
        hn_txt: cleanTagContent,
        hn_index: i,
        hn_words_sliced: words,
        hn_words_count: Number(words.length),
        hn_preco: "Entre 50 et 90 caractères",
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
        hn_txt: cleanTagContent,
        hn_index: i,
        hn_words_sliced: words,
        hn_words_count: Number(words.length),
        hn_preco: "Entre 50 et 90 caractères",
        hn_score: 5,
      });
      globalScoreHnReco.push(5);
    }
  });

  let renduTab = rendu.split("_");
  let scoreOutlineHn = [];
  dataChecker.hn.hn_outline.hn = [];
  renduTab.forEach((t, i) => {
    if (t.length > 0) {
      let validity = t.includes("Non valide") ? false : true;
      const score = (validity === false) ? 0 : 5;
      const cleanT = t.replaceAll('undefined', '')
      dataChecker.hn.hn_outline.hn.push({
        hn_type: t.split(" -- ")[0],
        hn_validity: validity,
        hn_validity_message: t.split(" -- ")[1],
        hn_validity_score: score,
      });
      scoreOutlineHn.push(score);
    }
  });

  const hasZeroInOutlineHn = (array) => {
    return array.filter((value) => {
      return value === 0;
    }).length === 0 ? 5 : 0;
  };

  const scoreHnOutline = hasZeroInOutlineHn(scoreOutlineHn)
  const scoreHnReco =
    globalScoreHnReco.length > 1
      ? Number(
        (
          globalScoreHnReco.reduce((a, b) => a + b) / globalScoreHnReco.length
        ).toFixed(2)
      )
      : globalScoreHnReco[0];

  // Intégrer le score des Hn scindés dans le score global
  const scoreSplitHeadings = dataChecker.hn.split_headings?.global_score || 5;

  dataChecker.hn.hn_reco.hn_check_state = true;
  dataChecker.hn.hn_reco.global_score = scoreHnReco;
  dataChecker.hn.hn_outline.global_score = scoreHnOutline;
  dataChecker.hn.hn_check_state = true;

  // Score global incluant la pénalité des Hn scindés
  dataChecker.hn.global_score = Number(
    ((scoreHnReco + scoreHnOutline + scoreSplitHeadings) / 3).toFixed(2)
  );

  dataChecker.hn.nb_hn = nbHn;

  console.log(
    "----------------------------- END check Hn outline validity -----------------------------"
  );
})(jQuery);
