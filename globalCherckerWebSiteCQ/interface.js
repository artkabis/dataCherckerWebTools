console.log("------------ in interface script -----------");
const queryString = window.location.search;
const params = new URLSearchParams(queryString);
const data = params.get("data");
const dataChecker = JSON.parse(decodeURIComponent(data));
console.log(dataChecker);

const mainCardContainer = document.getElementById('main_card_container');

//function for mainCard
const constructMainCard = () => {
    
    const mainCard = document.createElement('div');
    mainCard.classList.add('main_card');

    const titleMainCard = document.createElement('span');
    titleMainCard.classList.add('title_main_span');
    titleMainCard.innerHTML = 'Analyse du site: ';

    const urlContainer = document.createElement('span');
    urlContainer.classList.add('url_span');
    urlContainer.innerHTML = dataChecker.url_site;

    const scoreContainer = document.createElement('span');
    scoreContainer.classList.add('score_span');
    scoreContainer.innerHTML = 'Score Global: '+dataChecker.global_score+'/5';

    mainCard.appendChild(titleMainCard);
    mainCard.appendChild(urlContainer);
    mainCard.appendChild(createIconScore(dataChecker.global_score));
    // mainCard.appendChild(displayState(monObjetJSON.state_check));

    mainCard.appendChild(scoreContainer)
    mainCardContainer.appendChild(mainCard);
}

//function for create IconScore
const createIconScore = (score) => {
    console.log(score);
    let iconSrc = '';
    let tooltipText = '';
  
    const numericScore = parseFloat(score);

  if (!isNaN(numericScore)) {
    if (numericScore >= 1 && numericScore < 2) {
      iconSrc = 'interface_icons/note_1.png';
      tooltipText = 'Très Mauvais '+score+'/5';
    } else if (numericScore >= 2 && numericScore < 3) {
      iconSrc = 'interface_icons/note_2.png';
      tooltipText = 'Mauvais '+score+'/5';
    } else if (numericScore >= 3 && numericScore < 4) {
      iconSrc = 'interface_icons/note_3.png';
      tooltipText = 'Moyen '+score+'/5';
    } else if (numericScore >= 4 && numericScore < 5) {
      iconSrc = 'interface_icons/note_4.png';
      tooltipText = 'Bon '+score+'/5';
    } else if (numericScore >= 5) {
      iconSrc = 'interface_icons/note_5.png';
      tooltipText = 'Excellent '+score+'/5';
    } else {
      iconSrc = 'interface_icons/note_1.png';
      tooltipText = 'Unknown Score';
    }
  } else {
    iconSrc = 'interface_icons/note_1.png';
    tooltipText = 'Invalid Score';
  }
    const iconScoreElm = document.createElement('span');
    iconScoreElm.classList.add('icon_score');
    iconScoreElm.title = tooltipText;

    const iconScoreImg = document.createElement('img');
    iconScoreImg.src = iconSrc;
    iconScoreElm.appendChild(iconScoreImg);

    return iconScoreElm;
  };

  const displayState = (state) =>{
    const iconStateElm = document.createElement('span');
    iconStateElm.classList.add('icon_state');

    const iconScoreImg = document.createElement('span');
      if(state){
      
      iconStateElm.title = "Analyse ok";
      iconScoreImg.classList.add('icon_state_ok');
      
      }else{
        iconStateElm.title = "Analyse ko";
        iconScoreImg.classList.add('icon_state_ok');
      }
      iconStateElm.appendChild(iconScoreImg);
  return iconStateElm;
}

  //execute main card construction
  constructMainCard();

  //construct resumeCardContainer
  const resumeCardContainer = document.getElementById('resume_card_container');

  //gesttion du toogle
  function toggle() {
    var toggleButton = document.getElementById('toggleButton');
    var toggleSlider = toggleButton.nextElementSibling;
  
    if (toggleButton.checked) {
      toggleSlider.style.backgroundColor = "#3f51b5";
      toggleSlider.style.transform = "translateX(24px)";
    } else {
      toggleSlider.style.backgroundColor = "#ccc";
      toggleSlider.style.transform = "translateX(0)";
    }
  }