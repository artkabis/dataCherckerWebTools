(($) => {
  console.log("------------ in interface script -----------");
  const queryString = window.location.search;
  const params = new URLSearchParams(queryString);
  const data = params.get("data");
  const dataChecker = JSON.parse(decodeURIComponent(data));
  console.log(dataChecker);

  const mainCardContainer = document.getElementById("main_card_container");
  const cardContainer = document.getElementById('card_container');

  //function for mainCard
  const constructMainCard = () => {
    const mainCard = document.createElement("div");
    mainCard.classList.add("main_card");

    const titleMainCard = document.createElement("span");
    titleMainCard.classList.add("title_main_span");
    titleMainCard.innerHTML = "Analyse du site: ";

    const urlContainer = document.createElement("span");
    urlContainer.classList.add("url_span");
    urlContainer.innerHTML = dataChecker.url_site;

    const scoreContainer = document.createElement("span");
    scoreContainer.classList.add("score_span");
    scoreContainer.innerHTML =
      "Score Global: " + dataChecker.global_score + "/5";

    mainCard.appendChild(titleMainCard);
    mainCard.appendChild(urlContainer);
    mainCard.appendChild(scoreContainer);
    mainCard.appendChild(createIconScore(dataChecker.global_score));
    // mainCard.appendChild(displayState(monObjetJSON.state_check));

  
    mainCardContainer.appendChild(mainCard);
  };

  //function for create IconScore
  const createIconScore = (score) => {
    console.log(score);
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
      } else if (numericScore > 4.5) {
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

    const iconScoreImg = document.createElement("span");
    if (state) {
      iconStateElm.title = "Analyse ok";
      iconScoreImg.classList.add("icon_state_ok");
    } else {
      iconStateElm.title = "Analyse ko";
      iconScoreImg.classList.add("icon_state_ok");
    }
    iconStateElm.appendChild(iconScoreImg);
    return iconStateElm;
  };

  //execute main card construction
  constructMainCard();

  //construct resumeCardContainer
  const resumeCardContainer = document.getElementById("resume_card_container");

  //gesttion du toogle
  function toggle() {
    var toggleButton = document.getElementById("toggleButton");
    var toggleSlider = toggleButton.nextElementSibling;

    if (toggleButton.checked) {
      toggleSlider.style.backgroundColor = "#3f51b5";
      toggleSlider.style.transform = "translateX(24px)";
    } else {
      toggleSlider.style.backgroundColor = "#ccc";
      toggleSlider.style.transform = "translateX(0)";
    }
  }

  $("#toggleButton").on("click", toggle);

  function creerBarreNotation(note) {
    const noteMax = 5; // Note maximale
    const noteMin = 0; // Note minimale
  
    const noteClamped = Math.min(Math.max(note, noteMin), noteMax);
  
    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container';
  
    const barFill = document.createElement('div');
    barFill.className = 'bar-fill';
    barFill.style.width = ((noteClamped / (noteMax - noteMin)) * 100) + '%';
  
    barContainer.appendChild(barFill);
  
    return barContainer;
  }

  const createTotalResumeCheck = (object) =>{

      const barre = creerBarreNotation(object.global_score);

      const barCheck = document.createElement('div');
      barCheck.className = 'bar_check';

      const barTitle = document.createElement('div');
      barTitle.className = 'bar_title';
      barTitle.innerHTML = object.check_title+':';

      const barNote = document.createElement('div');
      barNote.className = 'bar_note';
      barNote.innerHTML = object.global_score+'/5';

      const barContainer = document.getElementById('container_bar_check');
      barCheck.appendChild(barTitle);
      barCheck.appendChild(barre);
      barCheck.appendChild(barNote);
      /*barCheck.appendChild(createIconScore(object.global_score));*/

      barContainer.appendChild(barCheck);
  }


  const createResumeCheck = () =>{

    if(dataChecker.meta_check){
      createTotalResumeCheck(dataChecker.meta_check);
    }

    if(dataChecker.alt_img_check){
      createTotalResumeCheck(dataChecker.alt_img_check);
    }
   
    if(dataChecker.hn){
      createTotalResumeCheck(dataChecker.hn);
    }
    if(dataChecker.img_check){
      createTotalResumeCheck(dataChecker.img_check);
    }
    if(dataChecker.link_check){
      createTotalResumeCheck(dataChecker.link_check);
    }
    if(dataChecker.bold_check){
      createTotalResumeCheck(dataChecker.bold_check);
    }

  }

  createResumeCheck();

  const createCardCheck = (object) => {

    const containerCardCheck = document.createElement('div');
    containerCardCheck.className = 'card_Check';

    const headerCardCheck = document.createElement('div');
    headerCardCheck.className = 'header_card_check';
    const titleCardCheck = document.createElement('div');
    titleCardCheck.className = 'title_card_check';
    titleCardCheck.innerHTML = object.check_title+':';

    const headerNoteContainer = document.createElement('div');
    headerNoteContainer.className = 'header_note_container';
    headerNoteContainer.innerHTML = object.global_score+'/5';

    const contentCardCheck = document.createElement('div');
    contentCardCheck.className = 'content_card_check';
    contentCardCheck.style.display = 'none'; // Cacher le contenu par défaut
// ... Autres configurations du contenu

const toggleDiv = document.createElement('div');
toggleDiv.className = 'toggle_button';
toggleDiv.classList.add('reversed'); // Ajouter la classe "reversed" pour que les flèches pointent vers le bas au début

toggleDiv.addEventListener('click', () => {
  if (contentCardCheck.style.display === 'none') {
    contentCardCheck.style.display = 'block';
    toggleDiv.classList.remove('reversed'); // Retirer la classe "reversed" pour que les flèches pointent vers le bas
  } else {
    contentCardCheck.style.display = 'none';
    toggleDiv.classList.add('reversed'); // Ajouter la classe "reversed" pour que les flèches pointent vers le haut
  }
});

    headerCardCheck.appendChild(titleCardCheck);
    headerCardCheck.appendChild(headerNoteContainer);
    headerCardCheck.appendChild(createIconScore(object.global_score));
    headerCardCheck.appendChild(toggleDiv);
    containerCardCheck.appendChild(headerCardCheck);
    containerCardCheck.appendChild(contentCardCheck);

    return containerCardCheck;

  }

 

  if(dataChecker.meta_check){

    cardContainer.appendChild(createCardCheck(dataChecker.meta_check));
   
  }
  if(dataChecker.alt_img_check){

    cardContainer.appendChild(createCardCheck(dataChecker.alt_img_check));
   
  }
  if(dataChecker.hn){

    cardContainer.appendChild(createCardCheck(dataChecker.hn));
   
  }
  if(dataChecker.img_check){

    cardContainer.appendChild(createCardCheck(dataChecker.img_check));
   
  }
  if(dataChecker.link_check){

    cardContainer.appendChild(createCardCheck(dataChecker.link_check));
   
  }
  if(dataChecker.bold_check){

    cardContainer.appendChild(createCardCheck(dataChecker.bold_check));
   
  }

})(jQuery);