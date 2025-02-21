"use strict";

import * as confetti from "./assets/canvas-confetti.mjs";

console.log("------------ in interface script -----------");
// const queryString = window.location.search;
// const params = new URLSearchParams(queryString);
// const data = params.get("data");
// console.log({ data }, { queryString }, { params }, JSON.parse(data));

let mydb = null;
const db_name = "db_datas_checker";
const DBOpenRequest = indexedDB.open(db_name, 4);
let userName;
DBOpenRequest.onsuccess = (event) => {
  mydb = DBOpenRequest.result;
  console.log("db open succes : ", event.target.result);
  const transaction = mydb.transaction([db_name], "readonly");
  const objectStore = transaction.objectStore(db_name);
  var objectStoreRequest = objectStore.get("dcw");
  objectStoreRequest.onsuccess = function (event) {
    // On indique la réussite de l'insertion
    const datasCheckerDB = objectStoreRequest.result.data;
    userName = objectStoreRequest.result.user;

    console.log("11111111111111111111& interface username : ", { userName });
    console.log("datasCheckerDB datas : ", { datasCheckerDB });
    // fetch('http://127.0.0.1:8000/datasCheck/', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify([{ user: userName, datas: datasCheckerDB }]),
    // }).then(response => {
    //   if (!response.ok) {
    //     throw new Error('Réponse non valide');
    //   }
    //   const contentType = response.headers.get('Content-Type');
    //   if (!contentType || !contentType.includes('application/json')) {
    //     throw new Error('La réponse n\'est pas au format JSON');
    //   }
    //   return response.json(); // Lisez la réponse JSON ici
    // }).then(data => {
    //   console.log('Réponse du serveur :', data);
    // }).catch(error => {
    //   console.log('Erreur lors de la fin du traitement :', error);
    // });
    initInterface(userName, datasCheckerDB);
  };
};
DBOpenRequest.onupgradeneeded = (event) => {
  mydb = event.target.result;
  console.log("db opened : onupgradeneeded :", { mydb });

  mydb.onerror = (event) => {
    console.log("Error loading database.", event);
  };

  mydb.onsuccess = (event) => {
    console.log("upgrade successful", event);
  };
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("interface.js received message request: " + request);
  if (request.action === "send_data_interface") {
    const dataChecker = JSON.parse(request.data);
    console.log(
      "-------------------------------- send_data_interface message.data: ",
      { dataChecker }
    );
  }
});

const initInterface = (userName, datas) => {
  //Désactivation des cors une fois les datas envoyé au server :
  chrome.storage.sync.get("corsEnabled", function (result) {
    var corsEnabled = result.corsEnabled;
    chrome.storage.sync.set({ corsEnabled: corsEnabled }, function () {
      corsEnabled && chrome.runtime.sendMessage({ corsEnabled: false });
    });
  });
  const dataChecker = datas;
  window["dataCheck"] = dataChecker;
  document.querySelector("header .user-name .name").textContent = userName;

  const mainCardContainer = document.getElementById("main_card_container");
  const cardContainer = document.getElementById("card_container");

  //function for mainCard
  const constructMainCard = () => {
    const mainCard = document.createElement("div");
    mainCard.classList.add("main_card");

    const titleMainCard = document.createElement("span");
    titleMainCard.classList.add("title_main_span");
    titleMainCard.innerHTML = "Analyse du site: ";

    const urlContainer = document.createElement("span");
    urlContainer.classList.add("url_span");
    console.log(
      "__________________________________ datachecker in interface  : ",
      { dataChecker }
    );
    urlContainer.innerHTML = dataChecker.url_site.includes("?")
      ? dataChecker.url_site.split("?")[0]
      : dataChecker.url_site;

    const scoreContainer = document.createElement("span");
    scoreContainer.classList.add("score_span");
    scoreContainer.innerHTML =
      "Score Global: " + dataChecker.global_score + "/5";

    //Envoi de confétis si la note globale est au-dessus de 4.8/5
    let myCanvas = document.createElement("canvas");
    myCanvas.classList.add("score_canvas");
    const initCanvas = (particleCount) => {
      document.body.appendChild(myCanvas);

      var myConfetti = confetti.create(myCanvas, {
        resize: true,
        useWorker: true,
      });
      myConfetti({
        particleCount: particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: 0.5,
          y: 0.5,
        },
      });
    };
    const removeCanevas = (canvas) => {
      //Suppression du canvas après 3 secondes.
      console.log({ canvas });
      setTimeout(() => {
        canvas && canvas.remove();
      }, 3000);
    };
    if (dataChecker.global_score >= 4.8) {
      initCanvas(600);
      removeCanevas(myCanvas);
    }

    if (dataChecker.global_score > 4.5 && dataChecker.global_score < 4.8) {
      initCanvas(5);
      removeCanevas(myCanvas);
    }

    mainCard.appendChild(titleMainCard);
    mainCard.appendChild(urlContainer);
    mainCard.appendChild(scoreContainer);
    mainCard.appendChild(createIconScore(dataChecker.global_score));
    // mainCard.appendChild(displayState(monObjetJSON.state_check));

    mainCardContainer.appendChild(mainCard);
  };

  //function for create IconScore
  const createIconScore = (score) => {
    let iconSrc = "";
    let tooltipText = "";

    const numericScore = parseFloat(score);

    if (!isNaN(numericScore)) {
      if (numericScore >= 0 && numericScore < 1.5) {
        iconSrc = "interface_icons/note_1.png";
        tooltipText = "Très Mauvais " + score + "/5";
      } else if (numericScore >= 1.5 && numericScore < 2.5) {
        iconSrc = "interface_icons/note_2.png";
        tooltipText = "Mauvais " + score + "/5";
      } else if (numericScore >= 2.5 && numericScore < 3.5) {
        iconSrc = "interface_icons/note_3.png";
        tooltipText = "Moyen " + score + "/5";
      } else if (numericScore >= 3.5 && numericScore < 4.5) {
        iconSrc = "interface_icons/note_4.png";
        tooltipText = "Bon " + score + "/5";
      } else if (numericScore >= 4.5) {
        iconSrc = "interface_icons/note_5.png";
        tooltipText = "Excellent " + score + "/5";
      } else {
        iconSrc = "interface_icons/note_1.png";
        tooltipText = "Unknown Score";
      }
    } else {
      iconSrc = "interface_icons/note_1.png";
      tooltipText = "Invalid Score";
    }
    const iconScoreElm = document.createElement("span");
    iconScoreElm.classList.add("icon_score");
    iconScoreElm.title = tooltipText;

    const iconScoreImg = document.createElement("img");
    iconScoreImg.src = iconSrc;
    iconScoreElm.appendChild(iconScoreImg);
    return iconScoreElm;
  };

  const displayState = (state) => {
    const iconStateElm = document.createElement("span");
    iconStateElm.classList.add("icon_state");
    console.log(state);
    const iconScoreImg = document.createElement("span");
    if (state) {
      iconStateElm.title = "Analyse ok";
      iconScoreImg.classList.add("icon_state_ok");
    } else {
      iconStateElm.title = "Analyse ko";
      iconScoreImg.classList.add("icon_state_ko");
    }
    iconStateElm.appendChild(iconScoreImg);
    return iconStateElm;
  };

  //execute main card construction
  constructMainCard();

  //construct resumeCardContainer
  const resumeCardContainer = document.getElementById("resume_card_container");

  //gestion du toogle
  function toggle() {
    var toggleButton = document.getElementById("toggleButton");
    var toggleSlider = toggleButton.nextElementSibling;

    if (toggleButton.checked) {
      toggleSlider.style.backgroundColor = "#3f51b5";
    } else {
      toggleSlider.style.backgroundColor = "#ccc";
    }
  }

  $("#toggleButton").on("click", toggle);

  function creerBarreNotation(note) {
    const noteMax = 5; // Note maximale
    const noteMin = 0; // Note minimale

    const noteClamped = Math.min(Math.max(note, noteMin), noteMax);

    const barContainer = document.createElement("div");
    barContainer.className = "bar-container";

    const barFill = document.createElement("div");
    barFill.className = "bar-fill";
    barFill.style.width = (noteClamped / (noteMax - noteMin)) * 100 + "%";

    barContainer.appendChild(barFill);

    return barContainer;
  }

  const createTotalResumeCheck = (object) => {
    const barre = creerBarreNotation(object.global_score);

    const barCheck = document.createElement("div");
    barCheck.className = "bar_check";

    const barTitle = document.createElement("div");
    barTitle.className = "bar_title";
    barTitle.innerHTML = object.check_title + ":";

    const barNote = document.createElement("div");
    barNote.className = "bar_note";
    barNote.innerHTML = object.global_score + "/5";

    const barContainer = document.getElementById("container_bar_check");
    barCheck.appendChild(barTitle);
    barCheck.appendChild(barre);
    barCheck.appendChild(barNote);
    /*barCheck.appendChild(createIconScore(object.global_score));*/

    barContainer.appendChild(barCheck);
  };

  const createResumeCheck = () => {
    if (dataChecker.meta_check) {
      createTotalResumeCheck(dataChecker.meta_check);
    }

    if (dataChecker.alt_img_check) {
      createTotalResumeCheck(dataChecker.alt_img_check);
    }

    if (dataChecker.hn) {
      createTotalResumeCheck(dataChecker.hn);
    }
    if (dataChecker.img_check) {
      createTotalResumeCheck(dataChecker.img_check);
    }
    if (dataChecker.link_check) {
      createTotalResumeCheck(dataChecker.link_check);
    }
    if (dataChecker.bold_check) {
      createTotalResumeCheck(dataChecker.bold_check);
    }
  };

  createResumeCheck();

  $(".target").click(function (event) {
    event.preventDefault();

    var url = $(this).attr("href");
    chrome.windows.create({
      url: url,
      type: "popup",
      width: 600,
      height: 400,
    });
  });

  const createContentCardCheck = (object) => {
    console.log("log de object:");
    console.log(object);

    const containerContentCard = document.createElement("div");

    if (object.check_title === "Meta") {
      containerContentCard.className = "content_card_meta_check";

      const containerResumeMetaCheck = document.createElement("div");
      containerResumeMetaCheck.className = "container_resume_meta_check";

      const spanTitleResumeMetaCheck = document.createElement("span");
      spanTitleResumeMetaCheck.className = "title_resume_meta_check";
      spanTitleResumeMetaCheck.innerHTML = "Statut du check des Meta: ";

      const spanStatutMetaCheck = document.createElement("span");
      spanStatutMetaCheck.className = "span_state_meta_check";

      spanStatutMetaCheck.appendChild(displayState(object.meta_check_state));

      const spanNbMetaCheck = document.createElement("span");
      spanNbMetaCheck.className = "span_nb_meta_check";
      spanNbMetaCheck.innerHTML = "Nb de Meta: " + object.nb_meta;

      containerResumeMetaCheck.appendChild(spanTitleResumeMetaCheck);
      containerResumeMetaCheck.appendChild(spanStatutMetaCheck);
      containerResumeMetaCheck.appendChild(spanNbMetaCheck);

      containerContentCard.appendChild(containerResumeMetaCheck);

      object.meta.forEach((element) => {
        const cardMeta = document.createElement("div");
        cardMeta.className = "meta_card meta_card_" + element.meta_type + "";

        const spanMetaTitle = document.createElement("span");
        spanMetaTitle.className = "card_meta_title";
        spanMetaTitle.innerHTML = element.check_title;

        const spanMetaReco = document.createElement("span");
        spanMetaReco.className = "span_meta_reco";
        spanMetaReco.innerHTML = "Reco: " + element.meta_reco;

        const spanMetaSize = document.createElement("span");
        spanMetaSize.className = "span_meta_size";
        spanMetaSize.innerHTML = "Taille: " + element.meta_size;

        const spanMetaState = document.createElement("span");
        spanMetaState.className = "span_meta_state";
        spanMetaState.appendChild(displayState(element.meta_state));

        const spanMetaTxt = document.createElement("span");
        spanMetaTxt.className = "span_meta_txt";
        spanMetaTxt.innerHTML = "Texte: " + element.meta_txt;

        const spanscoreMeta = document.createElement("span");
        spanscoreMeta.className = "span_score_meta";
        spanscoreMeta.innerHTML = "Score: " + element.meta_score;

        cardMeta.appendChild(spanMetaTitle);
        cardMeta.appendChild(spanMetaState);
        cardMeta.appendChild(spanscoreMeta);
        cardMeta.appendChild(spanMetaReco);
        cardMeta.appendChild(spanMetaSize);
        cardMeta.appendChild(spanMetaTxt);

        containerContentCard.appendChild(cardMeta);
      });

      return containerContentCard;
    } else if (object.check_title === "Images alt") {
      console.log("in alt image object");
      containerContentCard.className = "content_image_alt_check";

      const containerResumeImageAltCheck = document.createElement("div");
      containerResumeImageAltCheck.className =
        "container_resume_image_alt_check";

      const spanTitleResumeImageAltCheck = document.createElement("span");
      spanTitleResumeImageAltCheck.className = "title_resume_image_alt_check";
      spanTitleResumeImageAltCheck.innerHTML =
        "Statut du check des Alt Images: ";

      const spanStatutImageAltCheck = document.createElement("span");
      spanStatutImageAltCheck.className = "span_state_image_alt_check";

      spanStatutImageAltCheck.appendChild(
        displayState(object.alt_img_check_state)
      );

      const spanNbAltImageCheck = document.createElement("span");
      spanNbAltImageCheck.className = "span_nb_alt_image_check";
      spanNbAltImageCheck.innerHTML = "Nb de Alt Images: " + object.nb_alt_img;

      const spanScoreAltImage = document.createElement("span");
      spanScoreAltImage.className = "span_score_alt_image";
      spanScoreAltImage.innerHTML = "Score Total: " + object.global_score;

      containerResumeImageAltCheck.appendChild(spanTitleResumeImageAltCheck);
      containerResumeImageAltCheck.appendChild(spanStatutImageAltCheck);
      containerResumeImageAltCheck.appendChild(spanScoreAltImage);
      containerResumeImageAltCheck.appendChild(spanNbAltImageCheck);

      containerContentCard.appendChild(containerResumeImageAltCheck);

      object.alt_img.forEach((element) => {
        console.log("alt élément forEach verificator : ", element);
        if (element.alt_img_score) {
          const containerAltImage = document.createElement("div");
          containerAltImage.className = "container_alt_image";

          const spanAltImageText = document.createElement("span");

          spanAltImageText.className = "span_alt_image_txt";

          spanAltImageText.className = "span_alt_image_txt";
          spanAltImageText.innerHTML = "Texte Alt: " + element.alt_img_text;

          const spanAltImageSrc = document.createElement("span");
          spanAltImageSrc.className = "span_alt_image_src";

          const linkAltImageSrc = document.createElement("a");
          linkAltImageSrc.href = element.alt_img_src;
          linkAltImageSrc.className = "a_link_alt_img_src target";
          linkAltImageSrc.innerHTML = "Ouvrir l'image";

          const spanAltImageScore = document.createElement("span");
          if (element.alt_img_score > 0) {
            spanAltImageScore.className = "span_alt_image_score_positif";
          } else {
            spanAltImageScore.className = "span_alt_image_score_negatif";
          }

          spanAltImageScore.innerHTML = element.alt_img_score + "/5";

          spanAltImageSrc.appendChild(linkAltImageSrc);
          containerAltImage.appendChild(spanAltImageText);
          containerAltImage.appendChild(spanAltImageSrc);
          containerAltImage.appendChild(spanAltImageScore);

          containerContentCard.appendChild(containerAltImage);
        }
      });

      return containerContentCard;
    } else if (object.check_title === "Hn") {
      console.log("in hn check object");
      containerContentCard.className = "content_hn_check";

      const containerResumeHnCheck = document.createElement("div");
      containerResumeHnCheck.className = "container_resume_hn_check";

      const spanTitleResumeHnCheck = document.createElement("span");
      spanTitleResumeHnCheck.className = "title_resume_hn_check";
      spanTitleResumeHnCheck.innerHTML = "Statut du check des Hn: ";

      const spanStatutHnCheck = document.createElement("span");
      spanStatutHnCheck.className = "span_state_hn_check";

      spanStatutHnCheck.appendChild(displayState(object.hn_check_state));

      const spanNbHnCheck = document.createElement("span");
      spanNbHnCheck.className = "span_nb_hn_check";
      spanNbHnCheck.innerHTML = "Nb de Hn: " + object.nb_hn;

      const spanScoreHn = document.createElement("span");
      spanScoreHn.className = "span_score_hn";
      spanScoreHn.innerHTML = "Score Total: " + object.global_score;

      containerResumeHnCheck.appendChild(spanTitleResumeHnCheck);
      containerResumeHnCheck.appendChild(spanStatutHnCheck);
      containerResumeHnCheck.appendChild(spanScoreHn);
      containerResumeHnCheck.appendChild(spanNbHnCheck);

      containerContentCard.appendChild(containerResumeHnCheck);

      const containerHnOutline = document.createElement("div");
      containerHnOutline.className = "container_hn_outline_check";

      const headerHnOutline = document.createElement("div");
      headerHnOutline.className = "header_hn_outline_check";

      const titleHnOutline = document.createElement("div");
      titleHnOutline.className = "title_hn_outline";
      titleHnOutline.innerHTML = object.hn_outline.check_title + ":";

      const hnOutlineNoteContainer = document.createElement("div");
      hnOutlineNoteContainer.className = "hn_outline_note_container";
      hnOutlineNoteContainer.innerHTML = object.hn_outline.global_score + "/5";

      headerHnOutline.appendChild(titleHnOutline);
      headerHnOutline.appendChild(hnOutlineNoteContainer);
      headerHnOutline.appendChild(
        createIconScore(object.hn_outline.global_score)
      );

      containerHnOutline.appendChild(headerHnOutline);
      const contentHnOutline = document.createElement("div");
      contentHnOutline.className = "content_outline_check";
      contentHnOutline.style.display = "none"; // Cacher le contenu par défaut

      const toggleDiv = document.createElement("div");
      toggleDiv.className = "toggle_button";
      toggleDiv.classList.add("reversed"); // Ajouter la classe "reversed" pour que les flèches pointent vers le bas au début

      headerHnOutline.addEventListener("click", () => {
        if (contentHnOutline.style.display === "none") {
          contentHnOutline.style.display = "block";
          toggleDiv.classList.remove("reversed"); // Retirer la classe "reversed" pour que les flèches pointent vers le bas
        } else {
          contentHnOutline.style.display = "none";
          toggleDiv.classList.add("reversed"); // Ajouter la classe "reversed" pour que les flèches pointent vers le haut
        }
      });

      object.hn_outline.hn.forEach((element) => {
        const containerHn = document.createElement("div");
        containerHn.className = "container_hn";

        const spanTypeHn = document.createElement("span");
        spanTypeHn.className = "span_type_hn";
        spanTypeHn.innerHTML = "Type: " + element.hn_type;

        const spanTexteHn = document.createElement("span");
        spanTexteHn.className = "span_Texte_hn";
        spanTexteHn.innerHTML = "Texte: " + element.hn_validity_message;

        const spanOutlineScore = document.createElement("span");
        if (element.hn_validity_score > 0) {
          spanOutlineScore.className = "span_outline_score_positif";
        } else {
          spanOutlineScore.className = "span_outline_score_negatif";
        }

        spanOutlineScore.innerHTML = element.hn_validity_score + "/5";

        containerHn.appendChild(spanTypeHn);
        containerHn.appendChild(spanTexteHn);
        containerHn.appendChild(spanOutlineScore);
        contentHnOutline.appendChild(containerHn);
      });

      headerHnOutline.appendChild(toggleDiv);
      containerHnOutline.appendChild(contentHnOutline);
      containerContentCard.appendChild(containerHnOutline);

      const containerHnReco = document.createElement("div");
      containerHnReco.className = "container_hn_reco_check";

      const headerHnReco = document.createElement("div");
      headerHnReco.className = "header_hn_reco_check";

      const titleHnReco = document.createElement("div");
      titleHnReco.className = "title_hn_reco";
      titleHnReco.innerHTML = object.hn_reco.check_title + ":";

      const hnRecoNoteContainer = document.createElement("div");
      hnRecoNoteContainer.className = "hn_reco_note_container";
      hnRecoNoteContainer.innerHTML = object.hn_reco.global_score + "/5";

      headerHnReco.appendChild(titleHnReco);
      headerHnReco.appendChild(hnRecoNoteContainer);
      headerHnReco.appendChild(createIconScore(object.hn_reco.global_score));

      containerHnReco.appendChild(headerHnReco);
      const contentHnReco = document.createElement("div");
      contentHnReco.className = "content_reco_check";
      contentHnReco.style.display = "none"; // Cacher le contenu par défaut

      const containerResumeReco = document.createElement("div");
      containerResumeReco.className = "container_resume_reco";

      const spanStatusRecoCheck = document.createElement("span");
      spanStatusRecoCheck.className = "span_status_reco_check";
      spanStatusRecoCheck.innerHTML = "Statut du check des Reco: ";

      const spanDisplayState = document.createElement("span");
      spanDisplayState.className = "span_display_state";

      spanDisplayState.appendChild(displayState(object.hn_reco.hn_check_state));

      const precoHnTexte = document.createElement("span");
      precoHnTexte.className = "span_preco_reco_texte";
      precoHnTexte.innerHTML = "Préco: " + object.hn_reco.hn_preco;

      containerResumeReco.appendChild(spanStatusRecoCheck);
      containerResumeReco.appendChild(spanDisplayState);
      containerResumeReco.appendChild(precoHnTexte);

      const toggleDivReco = document.createElement("div");
      toggleDivReco.className = "toggle_button";
      toggleDivReco.classList.add("reversed"); // Ajouter la classe "reversed" pour que les flèches pointent vers le bas au début

      headerHnReco.addEventListener("click", () => {
        if (contentHnReco.style.display === "none") {
          contentHnReco.style.display = "block";
          toggleDivReco.classList.remove("reversed"); // Retirer la classe "reversed" pour que les flèches pointent vers le bas
        } else {
          contentHnReco.style.display = "none";
          toggleDivReco.classList.add("reversed"); // Ajouter la classe "reversed" pour que les flèches pointent vers le haut
        }
      });

      headerHnReco.appendChild(toggleDivReco);
      contentHnReco.appendChild(containerResumeReco);

      object.hn_reco.hn.forEach((element) => {
        const containerReco = document.createElement("div");
        containerReco.className = "container_reco";

        const containerTypeReco = document.createElement("span");
        containerTypeReco.className = "container_type_reco";
        containerTypeReco.innerHTML = "Type: " + element.hn_type;

        const containerTextReco = document.createElement("span");
        containerTextReco.className = "container_texte_reco";
        containerTextReco.innerHTML = "Texte: " + element.hn_txt;

        const spanREcoScore = document.createElement("span");
        if (element.hn_score > 0) {
          spanREcoScore.className = "span_reco_score_positif";
        } else {
          spanREcoScore.className = "span_reco_score_negatif";
        }

        spanREcoScore.innerHTML = element.hn_score + "/5";

        const containerRecoDetails = document.createElement("div");
        containerRecoDetails.className = "container_reco_details";

        const containerNbMots = document.createElement("span");
        containerNbMots.className = "container_nb_mots";
        containerNbMots.innerHTML = "Nb de mots: " + element.hn_words_count;

        const precoHn = document.createElement("div");
        precoHn.className = "preco_hn";
        precoHn.innerHTML =
          "Préconisation: Nombre de mots comptabilisés (de 5 à 8)";

        const containerNbLetter = document.createElement("span");
        containerNbLetter.className = "container_nb_letter";
        containerNbLetter.innerHTML =
          "Nb de lettres: " + element.hn_letters_count;

        const listeMots = document.createElement("div");
        listeMots.className = "container_liste_words";

        element.hn_words_sliced.forEach((element) => {
          const pWord = document.createElement("span");
          pWord.className = "p_word";
          pWord.innerHTML = element + "  ";
          listeMots.appendChild(pWord);
        });

        containerReco.appendChild(containerTypeReco);
        containerReco.appendChild(containerTextReco);
        containerReco.appendChild(spanREcoScore);
        containerRecoDetails.appendChild(containerNbMots);
        containerRecoDetails.appendChild(precoHn);
        containerRecoDetails.appendChild(listeMots);
        containerRecoDetails.appendChild(containerNbLetter);
        containerReco.appendChild(containerRecoDetails);

        contentHnReco.appendChild(containerReco);
      });

      containerHnReco.appendChild(contentHnReco);

      containerContentCard.appendChild(containerHnReco);

      return containerContentCard;
    } else if (object.check_title === "Images check") {
      console.log("in images check object");
      containerContentCard.className = "content_img_check";

      const containerResumeImageCheck = document.createElement("div");
      containerResumeImageCheck.className = "container_resume_image_check";

      const spanTitleResumeImageCheck = document.createElement("span");
      spanTitleResumeImageCheck.className = "title_resume_image_check";
      spanTitleResumeImageCheck.innerHTML = "Statut du check des Images: ";

      const spanStatutImageCheck = document.createElement("span");
      spanStatutImageCheck.className = "span_state_image_alt_check";

      spanStatutImageCheck.appendChild(displayState(object.img_check_state));

      const spanScoreImage = document.createElement("span");
      spanScoreImage.className = "span_score_image";
      spanScoreImage.innerHTML = "Score Total: " + object.global_score;

      const spanNbImageCheck = document.createElement("span");
      spanNbImageCheck.className = "span_nb_image_check";
      spanNbImageCheck.innerHTML = "Nb de Images: " + object.nb_img;

      containerResumeImageCheck.appendChild(spanTitleResumeImageCheck);
      containerResumeImageCheck.appendChild(spanStatutImageCheck);
      containerResumeImageCheck.appendChild(spanScoreImage);
      containerResumeImageCheck.appendChild(spanNbImageCheck);

      const containerImageAlt = document.createElement("div");
      containerImageAlt.className = "container_image_alt";

      const headerImageAlt = document.createElement("div");
      headerImageAlt.className = "header_card_check";

      const titleImageAlt = document.createElement("div");
      titleImageAlt.className = "title_image_alt";
      titleImageAlt.innerHTML = "Images Alt: ";

      const imageAltNoteContainer = document.createElement("div");
      imageAltNoteContainer.className = "image_alt_note_container";
      imageAltNoteContainer.innerHTML = object.global_alt_scores + "/5";

      headerImageAlt.appendChild(titleImageAlt);
      headerImageAlt.appendChild(imageAltNoteContainer);
      headerImageAlt.appendChild(createIconScore(object.global_alt_scores));

      const contentImage = document.createElement("div");
      contentImage.className = "content_image_check";
      contentImage.style.display = "none"; // Cacher le contenu par défaut

      const toggleDivImage = document.createElement("div");
      toggleDivImage.className = "toggle_button";
      toggleDivImage.classList.add("reversed"); // Ajouter la classe "reversed" pour que les flèches pointent vers le bas au début

      headerImageAlt.addEventListener("click", () => {
        if (contentImage.style.display === "none") {
          contentImage.style.display = "block";
          toggleDivImage.classList.remove("reversed"); // Retirer la classe "reversed" pour que les flèches pointent vers le bas
        } else {
          contentImage.style.display = "none";
          toggleDivImage.classList.add("reversed"); // Ajouter la classe "reversed" pour que les flèches pointent vers le haut
        }
      });

      headerImageAlt.appendChild(toggleDivImage);

      containerImageAlt.appendChild(headerImageAlt);
      containerImageAlt.appendChild(contentImage);

      containerContentCard.appendChild(containerResumeImageCheck);
      containerContentCard.appendChild(containerImageAlt);

      return containerContentCard;
    } else if (object.check_title === "Links validities") {
      const containerLinkCheck = document.createElement("div");
      containerLinkCheck.className = "container_link_check";

      const containerResumeLinkCheck = document.createElement("div");
      containerResumeLinkCheck.className = "container_resume_link_check";

      const spanStatutTitleLinkCheck = document.createElement("div");
      spanStatutTitleLinkCheck.className = "span_statut_title_link_check";
      spanStatutTitleLinkCheck.innerHTML = "Statut du check Link: ";

      const spanStatutLinkCheck = document.createElement("span");
      spanStatutLinkCheck.className = "span_statut_link_check";
      spanStatutLinkCheck.appendChild(displayState(object.link_check_state));

      const containerNbLink = document.createElement("div");
      containerNbLink.className = "container_nb_link";
      containerNbLink.innerHTML = "Nb de link valide: " + object.nb_link;

      const containerNbLinkTotal = document.createElement("span");
      containerNbLinkTotal.className = "container_nb_link_total";
      containerNbLinkTotal.innerHTML =
        "Nb de link Total: " + object.link.length;

      const containerLinkCheckContent = document.createElement("div");
      containerLinkCheckContent.className = "container_link_check_content";

      object.link.forEach((element) => {
        const containerLink = document.createElement("div");
        containerLink.className = "container_link";

        const containerLinkResume = document.createElement("div");
        containerLinkResume.className = "container_link_resume";

        const containerMessage = document.createElement("span");
        containerMessage.className = "container_message";
        containerMessage.innerHTML = "Message: " + element.link_msg;

        const containerStateTitle = document.createElement("span");
        containerStateTitle.className = "container_state_title";
        containerStateTitle.innerHTML = "Status du check: ";

        const containerStateLink = document.createElement("span");
        containerStateLink.className = "container_state_link";
        containerStateLink.appendChild(displayState(element.link_state));

        const containerStatus = document.createElement("span");
        containerStatus.className = "container_status";
        containerStatus.innerHTML = "Status: " + element.link_status;

        const containerNoteLink = document.createElement("span");
        containerNoteLink.className = "container_note_link";

        if (element.link_score > 0) {
          containerNoteLink.className = "span_reco_score_positif";
        } else {
          containerNoteLink.className = "span_reco_score_negatif";
        }

        containerNoteLink.innerHTML = element.link_score + "/5";

        const containerLinkText = document.createElement("div");
        containerLinkText.className = "container_link_text";
        containerLinkText.innerHTML = "Texte: " + element.link_text;

        const containerLinkUrl = document.createElement("a");
        containerLinkUrl.href = element.link_url;
        containerLinkUrl.className = "a_link_url_src target";
        containerLinkUrl.innerHTML = element.link_url;

        containerLinkResume.appendChild(containerMessage);
        containerLinkResume.appendChild(containerStateTitle);
        containerLinkResume.appendChild(containerStateLink);
        containerLinkResume.appendChild(containerStatus);
        containerLinkResume.appendChild(containerNoteLink);

        containerLink.appendChild(containerLinkResume);
        containerLink.appendChild(containerLinkText);
        containerLink.appendChild(containerLinkUrl);

        containerLinkCheckContent.appendChild(containerLink);
      });

      containerResumeLinkCheck.appendChild(spanStatutTitleLinkCheck);
      containerResumeLinkCheck.appendChild(spanStatutLinkCheck);
      containerResumeLinkCheck.appendChild(containerNbLink);
      containerResumeLinkCheck.appendChild(containerNbLinkTotal);
      containerLinkCheck.appendChild(containerResumeLinkCheck);
      containerLinkCheck.appendChild(containerLinkCheckContent);
      containerContentCard.appendChild(containerLinkCheck);
      return containerContentCard;
    } else if (
      object.check_title === "validité des préco lié au bold des textes."
    ) {
      const containerResumeBoldCheck = document.createElement("div");
      containerResumeBoldCheck.className = "container_resume_bold_check";

      const spanBoldTitle = document.createElement("span");
      spanBoldTitle.className = "span_bold_title";
      spanBoldTitle.innerHTML = "Statut du check bold: ";

      const span_bold_check_state = document.createElement("span");
      span_bold_check_state.className = "span_bold_check_state";
      span_bold_check_state.appendChild(displayState(object.bold_check_state));

      const containerNbBold = document.createElement("span");
      containerNbBold.className = "container_nb_bold";
      containerNbBold.innerHTML = "Nb de bold: " + object.nb_bold;

      const containerBoldContent = document.createElement("div");
      containerBoldContent.className = "container_bold_content";

      object.bold_txt.forEach((element) => {
        const containerBold = document.createElement("div");
        containerBold.className = "container_bold";

        const bold_title_state = document.createElement("span");
        bold_title_state.className = "bold_title_state";
        bold_title_state.innerHTML = "Statut du check: ";

        const containerStateBold = document.createElement("span");
        containerStateBold.className = "container_state_bold";
        containerStateBold.appendChild(displayState(element.bold_txt_state));

        const containerBoldNbWord = document.createElement("span");
        containerBoldNbWord.className = "container_bold_nb_word";
        containerBoldNbWord.innerHTML = "Nb de mots: " + element.bold_nb_words;

        const containerBoldText = document.createElement("div");
        containerBoldText.className = "container_bold_txt";
        containerBoldText.innerHTML = "Texte: " + element.bold_txt;

        containerBold.appendChild(bold_title_state);
        containerBold.appendChild(containerStateBold);
        containerBold.appendChild(containerBoldNbWord);
        containerBold.appendChild(containerBoldText);
        containerBoldContent.appendChild(containerBold);
      });

      containerResumeBoldCheck.appendChild(spanBoldTitle);
      containerResumeBoldCheck.appendChild(span_bold_check_state);
      containerResumeBoldCheck.appendChild(containerNbBold);
      containerContentCard.appendChild(containerResumeBoldCheck);
      containerContentCard.appendChild(containerBoldContent);
      return containerContentCard;
    } else {
      return containerContentCard;
    }
  };

  const createCardCheck = (object) => {
    const containerCardCheck = document.createElement("div");
    containerCardCheck.className = "card_Check";

    const headerCardCheck = document.createElement("div");
    headerCardCheck.className = "header_card_check";
    const titleCardCheck = document.createElement("div");
    titleCardCheck.className = "title_card_check";
    titleCardCheck.innerHTML = object.check_title + ":";

    const headerNoteContainer = document.createElement("div");
    headerNoteContainer.className = "header_note_container";
    headerNoteContainer.innerHTML = object.global_score + "/5";

    const contentCardCheck = document.createElement("div");
    contentCardCheck.className = "content_card_check";
    contentCardCheck.style.display = "none"; // Cacher le contenu par défaut

    contentCardCheck.appendChild(createContentCardCheck(object));
    //contentCardCheck.innerHTML = JSON.stringify(object);

    // ... Autres configurations du contenu

    const toggleDiv = document.createElement("div");
    toggleDiv.className = "toggle_button";
    toggleDiv.classList.add("reversed"); // Ajouter la classe "reversed" pour que les flèches pointent vers le bas au début

    headerCardCheck.addEventListener("click", () => {
      if (contentCardCheck.style.display === "none") {
        contentCardCheck.style.display = "block";
        toggleDiv.classList.remove("reversed"); // Retirer la classe "reversed" pour que les flèches pointent vers le bas
      } else {
        contentCardCheck.style.display = "none";
        toggleDiv.classList.add("reversed"); // Ajouter la classe "reversed" pour que les flèches pointent vers le haut
      }
    });

    headerCardCheck.appendChild(titleCardCheck);
    headerCardCheck.appendChild(headerNoteContainer);
    headerCardCheck.appendChild(createIconScore(object.global_score));
    headerCardCheck.appendChild(toggleDiv);
    containerCardCheck.appendChild(headerCardCheck);
    containerCardCheck.appendChild(contentCardCheck);

    return containerCardCheck;
  };

  if (dataChecker.meta_check) {
    cardContainer.appendChild(createCardCheck(dataChecker.meta_check));
  }
  if (dataChecker.alt_img_check) {
    cardContainer.appendChild(createCardCheck(dataChecker.alt_img_check));
  }
  if (dataChecker.hn) {
    cardContainer.appendChild(createCardCheck(dataChecker.hn));
  }
  if (dataChecker.img_check) {
    cardContainer.appendChild(createCardCheck(dataChecker.img_check));
  }
  if (dataChecker.link_check) {
    cardContainer.appendChild(createCardCheck(dataChecker.link_check));
  }
  if (dataChecker.bold_check) {
    cardContainer.appendChild(createCardCheck(dataChecker.bold_check));
  }

  //(dataChecker.global_score === 5) && alert("Bravo tu a atteint l'excellence !!!! T'as note est de "+dataChecker.global_score + "/5")

  const CHECK = window["dataCheck"];
  const { webdesigner_global_score: WEB, cdp_global_score: CDP } = CHECK; //rename webdesigner_global_score & cdp_global_score to WEB & CDP
  console.log({ CHECK }, { WEB }, { CDP }); //CHECK global value in window scope.
};
