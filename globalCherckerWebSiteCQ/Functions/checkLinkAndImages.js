MAX_SIZE_BYTES_IMAGE = currentSettings.MAX_SIZE_BYTES_IMAGE || 317435;
MAX_RATIO_IMAGE = currentSettings.MAX_RATIO_IMAGE || 3;
window.dataCheckerAnalysisComplete = false;

function initcheckerLinksAndImages() {
  let urlsDuplicate = [],
    requestInitiatedCount = 0,
    requestCompletedCount = 0,
    imagesForAnalyseImg = [],
    imagesForAnalyseBG = [];

  //reset datachecker nodes
  dataChecker.img_check.alt_img = [];
  dataChecker.img_check.size_img = [];
  dataChecker.img_check.ratio_img = [];
  let ratio_scores = [],
    alt_scores = [],
    size_scores = [],
    ratioScoreImg;

  let scoreCheckLink = [],
    isLinkedin,
    txtLinkedin;
  dataChecker.link_check.link = [];

  formatBytes = (bytes) => {
    return bytes < 1024
      ? bytes + " Bytes"
      : bytes < 1048576
        ? (bytes / 1024).toFixed(2) + " KB"
        : bytes < 1073741824
          ? (bytes / 1048576).toFixed(2) + " MB"
          : (bytes / 1073741824).toFixed(2) + " GB";
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

  let cmpBgImg = 0;
  let allUrlsImages = [];
  const checkUrlImg = async (args) => {
    let redirectCount = 0;
    let result = false;
    requestInitiatedCount++;
    let response;
    const isBas64Img = args[1].includes("data:image");
    const isBgImage = args[4].includes("bg");
    let bgImg = new Image();
    let fsize = "0";

    // Fonction pour finaliser le traitement dans tous les cas (succès ou erreur)
    const finalizeImgCheck = () => {
      requestCompletedCount++;
      dataChecker.img_check.nb_img = requestCompletedCount;
      console.log('Image check : ', requestCompletedCount, ' / ', allUrlsImages.length);

      if (requestCompletedCount >= allUrlsImages.length) {
        ratio_scores.push(ratioScoreImg);
        console.log("Fin du traitement du check des images size and alt");
        checkUrlImgDuplicate();
        const titleTxt = $('meta[property="og:title"]').attr("content") || $(' head title').text();
        $('meta[property="og:title"], head title').text(titleTxt.replace('⟳ ', ''));
      }
    };

    if (args[1] !== !!0 && !isBas64Img) {
      args[1] = args[1].includes("?") ? args[1].split("?")[0] : args[1];

      try {
        // Ajouter un timeout à la requête fetch
        const fetchPromise = fetch(args[1], {
          method: "GET",
          redirect: "manual",
          mode: "cors",
        });

        // Créer un timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timeout dépassé")), 10000); // Timeout de 10 secondes
        });

        // Race entre fetch et timeout
        response = await Promise.race([fetchPromise, timeoutPromise]);

        if (response.redirected) {
          if (redirectCount >= 2) {
            throw new Error("Trop de redirections");
          }

          const redirectUrl = response.headers.get("Location");
          if (redirectUrl) {
            console.log("image avec redirection");
            redirectCount++;
          }
        }

        if (isBgImage) {
          await Promise.race([
            new Promise((resolve) => {
              bgImg.src = args[1];
              bgImg.onload = function () {
                args[5] = this.naturalWidth;
                args[6] = this.naturalHeight;
                resolve();
              };
              bgImg.onerror = function () {
                console.log("Erreur de chargement de l'image bg:", args[1]);
                resolve(); // Résoudre quand même pour continuer le processus
              };
            }),
            new Promise((resolve) => setTimeout(resolve, 5000)) // Timeout de 5s pour le chargement de l'image
          ]);
        }

        fsize = response.headers.get("content-length");

        if (fsize) {
          const ratio = Number(
            ((args[5] / args[7] + args[6] / args[8]) / 2).toFixed(2)
          );
          let sizeInKb = (fsize / 1024).toFixed(2);
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
            ratio: String(ratio) === ("Infinity" || 0) ? "image cachée" : ratio,
            status: response.status,
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
          } else if (
            ratio > MAX_RATIO_IMAGE &&
            String(ratio) !== "Infinity" &&
            sizeInKb > 70
          ) {
            console.log(
              `%c Warning : ratio supérieur à ${MAX_RATIO_IMAGE} : " ${ratio}`,
              "color: orange"
            );
          } else if (
            ratio > 2 &&
            String(ratio) !== "Infinity" &&
            (args[5] >= 900 || (args[6] >= 900 && sizeInKb > 70))
          ) {
            console.log(
              `%c Warning : ratio supérieur à 2 : ${ratio}  pour une image dépassant les 900px`,
              "color: orange"
            );
          }
          /*256000 Bytes = 250 KB*/
          if (fsize > 256000 && fsize < MAX_SIZE_BYTES_IMAGE) {
            console.log(
              `%c Warning - la taille de l'image dépasse 250 KB : ${formatBytes(
                fsize
              )}  url : ${result.url}`,
              "color: orange"
            );
          } /*317435 Bytes = 310 KB*/ else if (fsize > MAX_SIZE_BYTES_IMAGE) {
            console.log(
              `%c Warning - la taille de l'image dépasse 310 KB : ${formatBytes(
                fsize
              )}  url : ${result.url}`,
              "color: red"
            );
          }
          result.target.parents(".owl-item.cloned").length === 0 &&
            result.target.parents("#logo").length !== 1 &&
            !result.target.hasClass("vc_parallax-inner") &&
            urlsDuplicate.push({ url: result.url, target: result.target });

          size_scores.push(
            fsize > MAX_SIZE_BYTES_IMAGE
              ? 0
              : fsize > 256000 && fsize < MAX_SIZE_BYTES_IMAGE
                ? 2.5
                : 5
          );
          alt_scores.push(result.alt[2] !== false ? 5 : 0);
          dataChecker.img_check.alt_img.push({
            alt_img_state: true,
            alt_img_src: result.url ? result.url : args[1],
            alt_img_value: result.alt,
            alt_img_score: result.alt !== false ? 5 : 0,
          }),
            dataChecker.img_check.size_img.push({
              size_img_state: "true",
              size_img_src: result.url,
              size_img: result.size,
              size_img_score:
                fsize > 317435
                  ? 0
                  : fsize > 256000 && fsize < MAX_SIZE_BYTES_IMAGE
                    ? 2.5
                    : 5,
              check_title: "Images size",
              image_status: response.status,
            });
          const imgcheckRatio =
            (result.ratio < 2 &&
              result.Imgheight < 150 &&
              result.Imgwidth < 150) ||
            result.ratio == "image cachée";

          if (imgcheckRatio || result.ratio === 1) {
            ratioScoreImg = 5;
          } else if (
            result.ratio >= 2 &&
            (result.Imgheight >= 500 || result.Imgwidth >= 500) &&
            sizeInKb > 70
          ) {
            ratioScoreImg = 2.5;
          } else if (result.ratio > 4 && sizeInKb > 70) {
            ratioScoreImg = 0;
          } else {
            ratioScoreImg = 5;
          }

          dataChecker.img_check.ratio_img.push({
            ratio_img_state: true,
            ratio_img_src: result.url,
            type_img: result.type,
            img_height: result.Imgheight,
            img_width: result.Imgwidth,
            parent_img_height: result.parentwidth,
            parent_img_width: result.parentheight,
            ratio_parent_img_height: result.ratioHeight,
            ratio_parent_img_width: result.ratioWidth,
            ratio_img: result.ratio,
            ratio_img_score: ratioScoreImg,
          });
        } else {
          console.log("Taille d'image non disponible pour:", args[1]);
          // Ajouter une entrée par défaut pour cette image
          dataChecker.img_check.ratio_img.push({
            ratio_img_state: true,
            ratio_img_src: args[1],
            type_img: "image sans taille",
            img_height: 0,
            img_width: 0,
            parent_img_height: 0,
            parent_img_width: 0,
            ratio_parent_img_height: 0,
            ratio_parent_img_width: 0,
            ratio_img: "N/A",
            ratio_img_score: 0,
          });
        }
      } catch (error) {
        console.log("Error with image:", args[1], error);

        // Ajouter l'image en erreur aux tableaux de données
        dataChecker.img_check.ratio_img.push({
          ratio_img_state: true,
          ratio_img_src: args[1],
          type_img: "image non disponible : " + (error.message || "Error"),
          img_height: 0,
          img_width: 0,
          parent_img_height: 0,
          parent_img_width: 0,
          ratio_parent_img_height: 0,
          ratio_parent_img_width: 0,
          ratio_img: "N/A",
          ratio_img_score: 0,
        });

        dataChecker.img_check.alt_img.push({
          alt_img_state: true,
          alt_img_src: args[1],
          alt_img_value: "image en erreur",
          alt_img_score: 0,
        });

        dataChecker.img_check.size_img.push({
          size_img_state: "false",
          size_img_src: args[1],
          size_img: "N/A",
          size_img_score: 0,
          check_title: "Images size",
          image_status: 404,
        });
      } finally {
        // Assurez-vous que le finalizeImgCheck est appelé dans tous les cas
        finalizeImgCheck();
      }
    } else {
      console.log("URL non valide ou image base64 :", args[1]);
      // Même pour les URL non valides, nous devons incrémenter le compteur
      finalizeImgCheck();
    }
  };
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
    dataChecker.img_check.nb_img_duplicate.push(
      trierUrlsRepetees(urlsDuplicate).length
        ? trierUrlsRepetees(urlsDuplicate)
        : "OK"
    );
    initDataChecker(size_scores, ratio_scores, alt_scores, scoreCheckLink);
  };

  const checkerImageWP = () => {
    console.log(
      "----------------------------- Check validity global image --------------------------------------------"
    );

    $("img").each(function (i, t) {
      const src = $(this).attr("src");
      let srcV = src ? src : $(this).attr("data-src");
      const altValid =
        $(this).attr("alt") &&
        $(this).attr("alt").length > 0 &&
        $(this).attr("alt") !== "";
      const isDudaImage = srcV && srcV.includes("cdn-website");
      const isBas64Img = srcV && srcV.includes("data:image");

      srcV =
        !isDudaImage &&
          !isBas64Img &&
          srcV &&
          srcV.at(0).includes("/") &&
          srcV.includes("/wp-content/")
          ? window.location.origin +
          "/wp-content/" +
          srcV.split("/wp-content/")[1]
          : src && !srcV.includes("http") && !srcV.at(0).includes("/")
            ? window.location.origin + "/" + srcV
            : srcV;
      srcV =
        srcV && srcV.includes("data:image") && srcV.includes("http")
          ? "data:image" + srcV.split("data:image")[1]
          : srcV;
      if (srcV) {
        $(this) && srcV;
        !srcV.includes("mappy") &&
          !srcV.includes("cdn.manager.solocal.com") &&
          !srcV.includes("gravityforms") &&
          !srcV.includes("static.cdn-website") &&
          !$(this).hasClass("leaflet-marker-icon") &&
          !srcV.includes("5+star.svg") &&
          !srcV.includes("sominfraprdstb001.blob.core.windows.net") &&
          imagesForAnalyseImg.push({
            key: "src-img-" + i,
            value: [
              $(this),
              srcV,
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
          bgimg.includes("http") || bgimg.includes("data:image")
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
          !bgimg.includes("data:") &&
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
              : console
                .log
                /*
                "base64 img detected : ",
                bgimg.includes("data:image/"),
                " width : ",
                customImg.width,
                " height : ",
                customImg.height,
                " url : ",
                bgimg
                */
                ();
          }
        }
      }
    });

    let uniqueAltValues = new Set();
    let altOccurrences = {};
    let hasDuplicates = false;
    imagesForAnalyseImg.forEach(function (image) {
      const altValue = image.value[2];
      const targetAltImage = image.value[0];
      if (altValue !== false) {
        if (uniqueAltValues.has(altValue)) {
          altOccurrences[altValue] = (altOccurrences[altValue] || 1) + 1;
          console.log(
            `%cDuplication détectée pour les alt : ${altValue}. Nombre d'itérations : ${altOccurrences[altValue]}`,
            "color:orange"
          );
          console.log("Image ayant un alt en doublon : ", targetAltImage);
          hasDuplicates = true;
        } else {
          uniqueAltValues.add(altValue);
        }
      }
    });
    if (hasDuplicates) {
      console.log(
        "%cIl y a des duplicatas dans les valeurs des alt de cette page.",
        "color:orange"
      );
    } else {
      console.log(
        "%cAucun duplicata trouvé dans les valeurs de alt.",
        "color:green"
      );
    }

    //Lancement du check global des images
    const allImg = [...imagesForAnalyseBG, ...imagesForAnalyseImg];
    console.log({ allImg });
    let cmpImages = 0;
    for (const item of allImg) {
      const content = item?.value;
      cmpImages++;
      checkUrlImg(content);
      allUrlsImages.push(item.value[1]);
    }
  };

  let sliderButtonValidity = false;
  if ($(".dmImageSlider .slide-button-visible")?.length) {
    sliderButtonValidity =
      $(".dmImageSlider a") &&
      $(".dmImageSlider a")?.attr("href") &&
      $(".dmImageSlider a")?.attr("href")?.includes("/");
    if (sliderButtonValidity === !!0 || sliderButtonValidity === "") {
      console.log(
        "%c \n !!! ATTENTION !!! Votre slider comporte un bouton mais aucun lien n'a été paramètré.\n",
        "color:red"
      );
      console.log($(".dmImageSlider .slide-button"));
    }
  }
  let timeout = 30000;
  let cmp_url = 0;
  let urlsScanned = [];
  const verifExcludesUrls = (url) => {
    return (
      url !== undefined &&
      url.length > 0 &&
      !url?.includes("mailto:") &&
      !url?.includes("javascript:") &&
      !url?.includes("logflare") &&
      !url?.includes("solocal.com") &&
      !url?.includes("sp.report-uri") &&
      !url?.includes("chrome-extension") &&
      !url?.includes("mappy") &&
      !url?.includes("bloctel.gouv.fr") &&
      !url?.includes("sominfraprdstb001.blob.core.windows.net") &&
      url?.at(0) !== "?"
    );
  };

  const isElementVisible = (el) => {
    const rects = el?.getClientRects();
    for (let i = 0; i < rects?.length; i++) {
      const rect = rects[i];
      if (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <=
        (window.innerWidth || document.documentElement.clientWidth)
      ) {
        return true;
      }
    }
    return false;
  };

  let warningLinks = [];
  let linksStack = document.querySelector("#Wrapper")
    ? $(
      '#Wrapper a[href], #Wrapper rs-layer[data-actions*="o:click;a:simplelink"]'
    )
    : $("#dm a[href]");
  linksStack = linksStack?.length ? linksStack : $("body a");
  let linksStackFilter = [];
  linksStack.each(function (i, t) {
    const href =
      t.nodeName !== "RS-LAYER"
        ? $(this)?.attr("href")
        : $(this)?.attr("data-actions")?.split("url:")[1]?.replaceAll(";", "");
    verifExcludesUrls(href) &&
      !href?.includes("linkedin.") &&
      (href?.includes("https:") || (href.at(0) === "/" && href.length > 0)) &&
      !href?.includes("tel:") &&
      linksStackFilter.push({ target: t, href: href });
    (href?.includes("http:") ||
      href?.includes("linkedin.") ||
      href?.includes("tel:") ||
      !verifExcludesUrls(href)) &&
      warningLinks.push({ target: t, url: href });
  });

  const nbLinks = linksStackFilter?.length;
  console.log({ linksStackFilter }, { warningLinks });

  //Vérification des numéros de téléphone
  const checkValidityPhoneNumber = (t, url) => {
    checkPhoneNumber = new RegExp(
      /^(?:(?:\+|00)33|0)\s*[1-9](?:\d{2}){4}$/
    )?.test(url?.replaceAll(" ", "")?.split("tel:")[1]);

    url?.includes("tel:") &&
      (checkPhoneNumber
        ? console.log(
          `%cNuméro de téléphone detécté :${url} - Validité : OK`,
          "color:green"
        )
        : console.log(
          `%cNuméro de téléphone detécté :${url} - Validité : KO`,
          "color:red"
        ));

    const dudaPhone =
      t &&
        t?.getAttribute("class") &&
        t?.getAttribute("class")?.includes("dmCall")
        ? t?.getAttribute("phone")
        : false;
    checkDudaPhoneNumber =
      dudaPhone &&
      new RegExp(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/)?.test(
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
  };
  warningLinks.forEach(function (t, i) {
    checkValidityPhoneNumber(t.target, t.url);
  });
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  //Check phone number in slider rev
  const SliderRevPhone =
    $('rs-layer[data-actions*="url:tel:"]') &&
    $('rs-layer[data-actions*="url:tel:"]')[0];
  SliderRevPhone &&
    checkValidityPhoneNumber(
      SliderRevPhone,
      SliderRevPhone?.getAttribute("data-actions")
        ?.split("url:")[1]
        ?.split(" ;")[0]
    );

  nbLinks === 0 && checkerImageWP();


  function encodeURLSimple(url, charMap = null) {
    // Dictionnaire par défaut des caractères spéciaux
    const defaultCharMap = {
      // Caractères accentués français
      'é': '%C3%A9', 'è': '%C3%A8', 'ê': '%C3%AA', 'ë': '%C3%AB',
      'à': '%C3%A0', 'â': '%C3%A2', 'ä': '%C3%A4', 'ô': '%C3%B4',
      'ö': '%C3%B6', 'ù': '%C3%B9', 'û': '%C3%BB', 'ü': '%C3%BC',
      'ÿ': '%C3%BF', 'ç': '%C3%A7', 'É': '%C3%89', 'È': '%C3%88',
      'Ê': '%C3%8A', 'Ë': '%C3%8B', 'À': '%C3%80', 'Â': '%C3%82',
      'Ä': '%C3%84', 'Ô': '%C3%94', 'Ö': '%C3%96', 'Ù': '%C3%99',
      'Û': '%C3%9B', 'Ü': '%C3%9C', 'Ÿ': '%C3%9F', 'Ç': '%C3%87',


      // Caractères corrompus
      '�': '%C3%A9', // Remplace � par é encodé
      '%EF%BF%BD': '%C3%A9', // Version encodée de �
    };

    // Utiliser la carte fournie ou celle par défaut
    const mappings = charMap || defaultCharMap;

    // Version avec replaceAll (plus simple)
    let encodedUrl = url;
    for (const [char, encoded] of Object.entries(mappings)) {
      // Échapper les caractères spéciaux pour le replaceAll
      if (char.match(/[.*+?^${}()|[\]\\]/)) {
        // Pour ces caractères, nous devons utiliser une regex avec échappement
        const regex = new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        encodedUrl = encodedUrl.replace(regex, encoded);
      } else {
        // Pour les caractères normaux, replaceAll est suffisant
        encodedUrl = encodedUrl.replaceAll(char, encoded);
      }
    }

    return encodedUrl;
  }


  let iterationsLinks = 0;
  let maillageInterne = 0;
  const liensInternes = [],
    liensExternes = [];
  const styleLinkError =
    "border: 3px double red!important;outline: 5px solid #bb0000!important;outline-offset: 5px;!important";
  const check = (_url, _txt, _node) => {
    cmp_url++;
    _txt = _txt.trim();
    const response = {
      status: null,
      document: null,
    };
    return new Promise((resolve, reject) => {

      let fetchTimeout = null;
      const startDoubleSlash = /^\/\//;
      _url = _url?.match(startDoubleSlash) !== null ? "https:" + _url : _url;
      _url = _url.includes('http:') ? _url.replace('http:', 'https:') : _url;
      _url = encodeURLSimple(_url);
      // .replace(/�/g, 'é')
      // .replace(/%EF%BF%BD/g, '%C3%A9'); // Remplace le � encodé (EF BF BD) par é encodé
      fetch(_url, {
        method: "GET",
        //redirect: "manual", // Permet de suivre les redirections explicitement
        //mode: "cors",
        headers: {
          'User-Agent': 'User - Agent: Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 123.0.0.0 Safari / 537.36'
        }
      })
        .then(async (res) => {
          iterationsLinks === 0 &&
            (console.log(
              "--------------------- Start check validity links -----------------------------"
            ),
              //Message d'alerte pour les liens http: et linkedin et tel: qui ne peuvent être envoyé dans la requête

              warningLinks.forEach((t, i) => {
                const url = t.url;
                const target = t.target;
                let isLinkedin = url.includes("linkedin") ? "Linkedin" : "";
                const isNotSecure = url.includes("http:");
                let isNotsecureMsg = isNotSecure
                  ? "ATTENTION VOTRE LIEN EST EN HTTP ET DONC NON SECURISE : AJOUTER HTTPS"
                  : "";

                verifExcludesUrls(url) &&
                  (!url.includes("tel:") && isLinkedin && !isNotSecure) &&
                  console.log(
                    `%c Vérifier le lien  ${isLinkedin}: 
            ${url} manuellement >>>`,
                    `color:${isNotSecure ? "red" : "orange"}`
                  );
                (isNotSecure) &&
                  (target.style.cssText = styleLinkError),
                  target.setAttribute(
                    "title",
                    isNotsecureMsg
                  );
              }));
          clearTimeout(fetchTimeout);
          response.status = res.status;
          response.document = res.responseText;
          isLinkedin = res.status === 999;
          txtLinkedin = isLinkedin ? "Lien Linkedin : " : "";

          const isCTA =
            (_node &&
              ((_node.style.padding && parseInt(_node?.style?.padding) >= 5) ||
                (_node.style.width && parseInt(_node?.style?.width) >= 15) ||
                (_node.style.height &&
                  parseInt(_node?.style?.height) >= 15))) ||
            _node.clientHeight >= 10 ||
            _node.clientWidth >= 10 ||
            (_node.getAttribute("class")
              ? (_node.getAttribute("class").includes("dmButtonLink") ||
                _node.getAttribute("class").includes("vc_btn3") || _node.getAttribute("class").toLowerCase().includes("button") || _node.getAttribute("class").toLowerCase().includes("boutton"))
              : false);
          const inContent =
            _node.closest("#Content") || _node.closest(".dmContent")
              ? true
              : false;
          const imageWidget = (inContent) => {
            if (inContent && !isCTA) {
              for (
                let i = 0;
                i < _node.closest(".dmRespCol")?.children?.length;
                i++
              ) {
                const childElement = _node.closest(".dmRespCol")?.children[i];
                return childElement?.classList?.contains("imageWidget")
                  ? true
                  : false;
              }
            }
          };

          //console.log(window.location.origin, ' duda prepub : ', dudaPrepub, "  check Duda prepub interne : ", _url.includes(window.location.pathname.split('/')[3]), 'si non Duda prepub : ', _url.includes(window.location.pathname));
          const isImageWidget = imageWidget(inContent);
          const isImageProductShop = _node.closest(".ec-store") ? true : false;
          const isExternalLink =
            _url.includes("http") &&
              !new URL(_url).href.includes(window.location.origin)
              ? true
              : false;
          const isImageLink =
            _node &&
              (_node.closest(".image-container") ||
                isImageWidget === true ||
                _node?.getAttribute("class")?.includes("caption-button") ||
                _node.querySelector("img") ||
                (_node?.style?.backgroundImage && !isImageProductShop))
              ? true
              : false;

          const isMenuLink = (_node?.closest('ul[role="menubar"]') || _node?.closest("#menu")) ? true : false;
          const isMedia = _url
            .split(".")
            .at(-1)
            .toLowerCase()
            .match(/png|jpe?g|jpg|mp3|mp4|gif|pdf|mov|webp/);
          const underForm = _node && _node.closest("form");

          const isDudaPrepub =
            window.location.origin.includes("solocaldudaadmin");
          const dudaPrepub =
            isDudaPrepub &&
              typeof window.location.pathname === "string" &&
              window.location.pathname.split("/")[3]
              ? window.location.pathname.split("/")[3].replaceAll("/", "")
              : "/";

          let underPathLink;
          if (isDudaPrepub) {
            underPathLink =
              typeof new URL(_url).pathname === "string" &&
              new URL(_url).pathname.split("/")[3] === dudaPrepub;
          } else {
            underPathLink =
              _url?.includes(window.location.pathname).length > 0
                ? _url?.includes(window.location.pathname?.replaceAll("/", ""))
                : "/";
          }
          const isSamePageLink = (link) => {
            const currentPageUrl = window.location.href;
            const linkUrl = new URL(link, window.location.origin).href;
            if (linkUrl === currentPageUrl) {
              return true;
            }
            if (linkUrl.startsWith(currentPageUrl + "#")) {
              return true;
            }
            return false;
          };
          (_node.closest("#dm_content") || _node.closest("#Content")) &&
            !isExternalLink &&
            !isMenuLink &&
            isSamePageLink(_url) &&
            !_url.includes("#") &&
            (console.log(
              `%cAttention, vous utilisez un lien qui redirige vers la même page : ${_url} - ${underPathLink}`,
              "color:red"
            ),
              console.log(_node),
              _node.setAttribute(
                "title",
                "Votre lien redirige vers la page en cours"
              ),
              (_node.style.cssText = styleLinkError));

          const permalien =
            /*(_url.startsWith('/') || _url.includes(window.location.origin)) &&*/ !isExternalLink &&
              !isMenuLink &&
              !isCTA &&
              !isImageLink &&
              !isImageProductShop &&
              inContent &&
              !(_url.includes("openstreetmap") || _url.includes("mapbox"))
              ? true
              : false; //(!_node?.closest('#Footer') || !_node?.closest('.dmFooterContainer') || _node?.closest('footer'))
          const cleanUrl =
            _url.includes("solocaldudaadmin") || _url.includes("pagesjaune.fr")
              ? new URL(_url).pathname
              : _url;
          !underForm &&
            !isMedia &&
            !isImageProductShop &&
            permalien &&
            (liensInternes.push(cleanUrl), maillageInterne++);
          isExternalLink && liensExternes.push(_url);
          const txtMediaLog = " --_ 🖼️ CTA avec image _--";
          const isImageLinkLog =
            !isMedia && isImageLink && !isImageProductShop
              ? txtMediaLog
              : isMedia
                ? txtMediaLog + " Au format >> " + isMedia[0]
                : "";
          const isImageProductShopLog = isImageProductShop
            ? "--__  🤑 CTA product shop__--"
            : "";
          const isMenuLinkLog = isMenuLink ? " >> 🎫 Interne au menu << " : "";
          const isCTALog =
            isCTA && !isImageProductShop ? "__ 🆙 CTA detecté __" : "";

          const permalienLog =
            !underForm && !isMedia && !isImageProductShop && permalien
              ? " ---> 🔗 Maillage interne"
              : "";

          resolve(response);
          if (res.ok || isLinkedin) {
            console.log(
              `url: ${txtLinkedin} ${_url} %c${_txt} -> %cstatus: %c${response.status
              } %c ${!isMenuLink ? isCTALog : ""} %c${isMenuLinkLog} %c${!isImageLink ? permalienLog : ""
              } %c${isImageLinkLog} %c${isImageProductShopLog} %c${isElementVisible(_node) ? "Visible" : "Non visible"
              }`,
              "color:cornflowerblue;",
              "color:white;",
              "color:green",
              "color:mediumpurple;",
              "color:powderblue;",
              "color:greenyellow;",
              "color: chartreuse",
              "color:mediumpurple;",
              `color: ${isElementVisible(_node) ? "green" : "orange"}`
            );
            scoreCheckLink.push(5);
          } else if (!isLinkedin && !res.ok && (res.status !== 403 && res.status !== 400)) {
            console.log(
              `url: ${_url} %c${_txt} -> %cstatus: %c${response.status} %c ${!isMenuLink ? isCTALog : ""
              } %c${isMenuLinkLog} %c${!isImageLink ? permalienLog : ""
              } %c${isImageLinkLog}  %c${isImageLinkLog}  %c${isImageProductShopLog}
              %c${isElementVisible(_node) ? "Visible" : "Non visible"}`,
              "color:cornflowerblue;",
              "color:white;",
              "color:red",
              "color:mediumpurple;",
              "color:powderblue;",
              "color:greenyellow;",
              "color:mediumpurple;",
              `color: ${isElementVisible(_node) ? "green" : "orange"}`
            );
            console.log(_node);
            _node.setAttribute("title", "Erreur : " + response.status);
            _node.style.cssText = styleLinkError;
            scoreCheckLink.push(0);
          } else if (!isLinkedin && !res.ok && res.status === 400 && _url.includes('facebook')) {
            console.log(
              `Lien Facebook à vérifier manuellement >>> url: ${_url} %c${_txt} -> %cstatus: %c${response.status} %c ${!isMenuLink ? isCTALog : ""
              } %c${isMenuLinkLog} %c${!isImageLink ? permalienLog : ""
              } %c${isImageLinkLog}  %c${isImageLinkLog}  %c${isImageProductShopLog}
              %c${isElementVisible(_node) ? "Visible" : "Non visible"}`,
              "color:cornflowerblue;",
              "color:white;",
              "color:orange",
              "color:mediumpurple;",
              "color:powderblue;",
              "color:greenyellow;",
              "color:mediumpurple;",
              `color: ${isElementVisible(_node) ? "green" : "orange"}`
            );
            console.log(_node);
            _node.setAttribute("title", "Erreur : " + response.status);
            _node.style.cssText = styleLinkError;
            scoreCheckLink.push(5);
          } else if (res.status === 301 || res.type === "opaqueredirect") {
            console.log(
              `!!!! ATENTION REDIRECTION 301 -> url: ${_url} %c${_txt} -> %cstatus: %c${response.status
              } %c${!isMenuLink ? isCTALog : ""} %c${isMenuLinkLog} %c${!isImageLink ? permalienLog : ""
              } %c${isImageLinkLog}  %c${isImageLinkLog} %c${isElementVisible(_node) ? "Visible" : "Non visible"
              }`,
              "color:cornflowerblue;",
              "color:white;",
              "color:orange",
              "color:mediumpurple;",
              "color:powderblue;",
              "color:greenyellow;",
              "color:mediumpurple;",
              `color: ${isElementVisible(_node) ? "green" : "orange"}`
            );
            scoreCheckLink.push(5);
          } else if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After") || 200;
            scoreCheckLink.push(5);
            console.log(`429 reçu, attente de ${retryAfter} ms.`);
            await delay(retryAfter * 200);
            return fetch(_url);
          } else if (res.status === 403) {
            console.log(
              `%c!!!! ATENTION LIEN EN STATUS 403, VUEILLEZ LES VERIFIER MANUELLEMENT-> url: ${_url} %c${_txt} -> %cstatus: %c${response.status
              } %c ${!isMenuLink ? isCTALog : ""} %c${isMenuLinkLog} %c${!isImageLink ? permalienLog : ""
              } %c${isImageLinkLog} %c${isImageLinkLog} %c${isElementVisible(_node) ? "Visible" : "Non visible"
              }`,
              "color:orange",
              "color:cornflowerblue;",
              "color:white;",
              "color:orange",
              "color:mediumpurple;",
              "color:powderblue;",
              "color:greenyellow;",
              "color:mediumpurple;",
              `color: ${isElementVisible(_node) ? "green" : "orange"}`
            );
          }
          _node.closest("#dm") &&
            _url.includes("site-privilege.pagesjaunes") &&
            console.log(
              "%cAttention lien prépup WP présent dans Duda : " +
              _url +
              " - élément : " +
              _node,
              "color:red;"
            );
          _node?.closest("#dm") &&
            !window.location.href.includes(
              "solocaldudaadmin.eu-responsivesiteeditor"
            ) &&
            _url?.includes("eu-responsivesiteeditor.com") &&
            console.log(
              "%cAttention lien prépup Duda présent dans le site en ligne : " +
              _url +
              " - élément : " +
              _node,
              "color:red;"
            );
          dataChecker.link_check.link.push({
            link_state: true,
            link_status: response.status,
            link_url: _url,
            link_text: _txt
              .replace(",  text : ", "")
              .trim()
              .replace("!!! ALT MANQUANT !!!", ""),
            link_score: response.status === 200 ? 5 : 0,
            link_msg: response.status === 200 ? "Lien valide." : "Lien non valide.",
            link_type: {
              isMenuLink,
              permalien,
              isImageLink,
              isCTA,
              isExternalLink
            }
          });

          dataChecker.link_check.link_check_state = true;
          iterationsLinks++;
          console.log("Link checked : ", iterationsLinks + "/" + nbLinks);
          const linksNumberPreco =
            maillageInterne >= 1 && maillageInterne < 4
              ? "color:green"
              : "color:red";
          if (iterationsLinks === nbLinks) {
            console.log(
              `%cVous avez ${maillageInterne} lien(s) interne(s) sur cette page (préco de 1 à 3 ) >>> `,
              `${linksNumberPreco}`);

            console.log(liensInternes);
            console.log("Lien(s) externe(s) : ", liensExternes);
            console.log(
              "--------------------- END check validity links -----------------------------"
            );
            // Signaler que l'analyse est terminée
            window.dataCheckerAnalysisComplete = true;
            // Déclencher un événement pour signaler l'achèvement
            window.dispatchEvent(new CustomEvent('dataCheckerAnalysisComplete'));
            checkerImageWP();
          }
        })
        .catch((error) => {
          iterationsLinks++;
          _node.style.cssText = styleLinkError;
          // const msgStatus =
          //   response.status === null ? "insecure resource" : response.status;
          dataChecker.link_check.link_check_state = true;
          _node.setAttribute("title", "Erreur : " + error);
          dataChecker.link_check.link.push({
            link_state: true,
            link_status: response.status,
            link_url: _url,
            link_text: _txt
              .replace(",  text : ", "")
              .trim()
              ?.replace("!!! ALT MANQUANT !!!", ""),
            link_score: 0,
            link_msg:
              "Imposssible de traiter le lien, veillez vérifier celui-ci manuellement.",
          });

          resolve(response);
          console.log(
            "Lien analysés : ",
            _url,
            " - iteration : ",
            iterationsLinks + "/" + nbLinks,
            "   en erreur : ",
            error
          );
          iterationsLinks === nbLinks &&
            (console.log(
              "Vous avez ",
              maillageInterne,
              "lien(s) interne(s) sur cette page >>>  "
            ),
              console.log({ liensInternes }),
              console.log(
                "--------------------- END check validity links -----------------------------"
              ),
              checkerImageWP(),
              checkLinksDuplicate());
        });

      fetchTimeout = setTimeout(() => {
        response.status = 408;
        resolve(response);
      }, (timeout += 1000));
    });
  };
  dataChecker.link_check.nb_link = linksStack.length;
  // console.log(
  //   "--------------------- Start check validity links -----------------------------"
  // );

  console.log({ linksStackFilter });

  const processLinks = async (linksStackFilter) => {
    for (const t of linksStackFilter) {
      let url = t.href;
      const _this = t.target;
      const $this = $(t.target);

      if (url && !url.includes("tel:")) {
        url =
          url.at(0) === "/" || (url.at(0) === "?" && !url.includes("tel:"))
            ? window.location.origin + url
            : url;

        let txtContent =
          url &&
            url.at(-4) &&
            !url.at(-4).includes(".") &&
            t.target.textContent.length > 1
            ? ",  text : " +
            t.target.textContent
              .replace(/(\r\n|\n|\r)/gm, "")
              ?.replace("!!! ALT MANQUANT !!!", "")
            : $this.find("svg") &&
              $this.find("svg").attr("alt")?.replace("!!! ALT MANQUANT !!!", "")
              ? ",  text : " +
              $this.find("svg").attr("alt")?.replace("!!! ALT MANQUANT !!!", "")
              : "";

        if (url && verifExcludesUrls(url)) {
          const delayTime = ($this.closest("dmRoot") && linksStackFilter.length > 99) ? 35 : 0;
          await delay(delayTime);

          check(url, txtContent, t.target);

          if (url.includes("linkedin")) {
            console.log(
              `%c Vérifier le lien "Linkedin" : ${txtContent} manuellement >>>`,
              "color:orange"
            );
            console.log(new URL(url).href, t.target);
            await delay(delayTime);
            check(new URL(url).href, txtContent, t.target);
          } else if (url.includes("http:")) {
            console.log(
              `%c Vérifier le lien ${txtContent} manuellement et SECURISEZ LE via "https" si ceci est possible >>>`,
              "color:red"
            );
            console.log(new URL(url).href, t.target);
            await delay(delayTime);
            check(new URL(url).href, txtContent, t.target);
          }
        }
      }
    }
  };

  processLinks(linksStackFilter);

  const checkLinksDuplicate = () => {
    let linksAnalyse = [];
    let linksCounts = {};
    linksStack.each(function (t, i) {
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
    console.log("All links : ", linksAnalyse);

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
  };
}
initcheckerLinksAndImages();