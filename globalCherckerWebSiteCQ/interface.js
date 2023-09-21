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
  var objectStoreRequest = objectStore.get('dcw');
  objectStoreRequest.onsuccess = function (event) {
    // On indique la réussite de l'insertion
    const datasCheckerDB = objectStoreRequest.result.data;
    userName = objectStoreRequest.result.user;
    
    console.log('11111111111111111111& interface username : ',{userName});
    // console.log('datasCheckerDB datas : ',{datasCheckerDB});
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
    initInterface(userName,datasCheckerDB);
  };
};
DBOpenRequest.onupgradeneeded = (event) => {
  mydb = event.target.result;
  console.log('db opened : onupgradeneeded :', {mydb});

  mydb.onerror = (event) => {
    console.log("Error loading database.", event);
  };

  mydb.onsuccess = (event) => {
    console.log("upgrade successful", event);

  };
};


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('interface.js received message request: ' + request);
  if (request.action === 'send_data_interface'){
    const dataChecker = JSON.parse(request.data)
    console.log('-------------------------------- send_data_interface message.data: ', {dataChecker});
  }
});


const initInterface = (userName, datas) =>{
const dataChecker = datas;
window["dataCheck"] = dataChecker;
document.querySelector('header .user-name .name').textContent = userName;

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
  console.log('__________________________________ datachecker in interface  : ',{dataChecker});
  urlContainer.innerHTML = (dataChecker.url_site.includes('?')) ? dataChecker.url_site.split('?')[0] : dataChecker.url_site;

  const scoreContainer = document.createElement("span");
  scoreContainer.classList.add("score_span");
  scoreContainer.innerHTML = "Score Global: " + dataChecker.global_score + "/5";

  //Envoi de confétis si la note globale est au-dessus de 4.8/5
  let myCanvas = document.createElement("canvas");
  myCanvas.classList.add("score_canvas");
  const initCanvas = (particleCount) =>{

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
  }
  const removeCanevas = (canvas) =>{
        //Suppression du canvas après 3 secondes.
        console.log({canvas});
        setTimeout(() => {
          (canvas) && canvas.remove();
        }, 3000);
  }
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

$('.target').click(function (event) {
  event.preventDefault(); 
  
  var url = $(this).attr("href");
  chrome.windows.create({
    url: url,
    type: "popup",
    width: 600,
    height: 400
  });
});

const createContentCardCheck = (object) =>{
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
    spanNbMetaCheck.innerHTML = "Nb de Meta: "+object.nb_meta;

    containerResumeMetaCheck.appendChild(spanTitleResumeMetaCheck);
    containerResumeMetaCheck.appendChild(spanStatutMetaCheck);
    containerResumeMetaCheck.appendChild(spanNbMetaCheck);

    containerContentCard.appendChild(containerResumeMetaCheck);

    object.meta.forEach(element => {

      const cardMeta = document.createElement("div");
      cardMeta.className = "meta_card meta_card_"+element.meta_type+"";

      const spanMetaTitle = document.createElement("span");
      spanMetaTitle.className = "card_meta_title";
      spanMetaTitle.innerHTML = element.check_title;

      const spanMetaReco =  document.createElement("span");
      spanMetaReco.className ="span_meta_reco";
      spanMetaReco.innerHTML = "Reco: "+element.meta_reco;

      const spanMetaSize = document.createElement("span");
      spanMetaSize.className = "span_meta_size";
      spanMetaSize.innerHTML = "Taille: "+element.meta_size;

      const spanMetaState = document.createElement("span");
      spanMetaState.className = "span_meta_state";
      spanMetaState.appendChild(displayState(element.meta_state));

      const spanMetaTxt = document.createElement("span");
      spanMetaTxt.className = "span_meta_txt";
      spanMetaTxt.innerHTML = "Texte: "+element.meta_txt;

      const spanscoreMeta = document.createElement("span");
      spanscoreMeta.className = "span_score_meta";
      spanscoreMeta.innerHTML = "Score: "+element.meta_score;

      cardMeta.appendChild(spanMetaTitle);
      cardMeta.appendChild(spanMetaState);
      cardMeta.appendChild(spanscoreMeta);
      cardMeta.appendChild(spanMetaReco);
      cardMeta.appendChild(spanMetaSize);
      cardMeta.appendChild(spanMetaTxt);

      containerContentCard.appendChild(cardMeta);
    });


    return containerContentCard;
  }else if(object.check_title === "Images alt"){

    console.log("in alt image");
    containerContentCard.className = "content_image_alt_check";

    const containerResumeImageAltCheck = document.createElement("div");
    containerResumeImageAltCheck.className = "container_resume_image_alt_check";

    const spanTitleResumeImageAltCheck = document.createElement("span");
    spanTitleResumeImageAltCheck.className = "title_resume_image_alt_check";
    spanTitleResumeImageAltCheck.innerHTML = "Statut du check des Alt Images: ";

    const spanStatutImageAltCheck = document.createElement("span");
    spanStatutImageAltCheck.className = "span_state_image_alt_check";

    spanStatutImageAltCheck.appendChild(displayState(object.alt_img_check_state));

    const spanNbAltImageCheck = document.createElement("span");
    spanNbAltImageCheck.className = "span_nb_alt_image_check";
    spanNbAltImageCheck.innerHTML = "Nb de Alt Images: "+object.nb_alt_img;

    const spanScoreAltImage = document.createElement("span");
    spanScoreAltImage.className = "span_score_alt_image";
    spanScoreAltImage.innerHTML = "Score Total: "+object.global_score;

    containerResumeImageAltCheck.appendChild(spanTitleResumeImageAltCheck);
    containerResumeImageAltCheck.appendChild(spanStatutImageAltCheck);
    containerResumeImageAltCheck.appendChild(spanScoreAltImage);
    containerResumeImageAltCheck.appendChild(spanNbAltImageCheck);

    containerContentCard.appendChild(containerResumeImageAltCheck);

    object.alt_img.forEach(element => {

      const containerAltImage = document.createElement("div");
      containerAltImage.className = "container_alt_image";

      const spanAltImageScore = document.createElement("span");
      spanAltImageScore.className = "span_alt_image_score";
      spanAltImageScore.innerHTML = "Score du Alt: "+element.alt_img_score+"/5";

      const spanAltImageState = document.createElement("span");
      spanAltImageState.className = "span_alt_image_state";
      spanAltImageState.appendChild(displayState(element.alt_img_state));

      const spanAltImageText = document.createElement("span");
      spanAltImageText.className = "span_alt_image_txt";
      spanAltImageText.innerHTML = "Texte Alt: "+element.alt_img_text;

      const spanAltImageSrc = document.createElement("span");
      spanAltImageSrc.className = "span_alt_image_src";
      
      const linkAltImageSrc = document.createElement("a");
      linkAltImageSrc.href = element.alt_img_src;
      linkAltImageSrc.className ="a_link_alt_img_src target";
      linkAltImageSrc.innerHTML = "Ouvrir l'image";

      spanAltImageSrc.appendChild(linkAltImageSrc);

      containerAltImage.appendChild(spanAltImageScore);
      containerAltImage.appendChild(spanAltImageState);
      containerAltImage.appendChild(spanAltImageText);
      containerAltImage.appendChild(spanAltImageSrc);


      containerContentCard.appendChild(containerAltImage);
    });

    return containerContentCard;

  }else{
    return containerContentCard;
  }

}

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
}