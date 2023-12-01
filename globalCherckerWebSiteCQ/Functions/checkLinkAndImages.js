    
function initcheckerLinksAndImages(){
  let urlsDuplicate = [],
  requestInitiatedCount = 0,
  requestCompletedCount = 0,
  imagesForAnalyseImg = [],
  imagesForAnalyseBG = [],
  cmpFinal = 0;

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


    let redirectCount=0;
    let result = false;
    requestInitiatedCount++;
    let response;
    const isBas64Img = (args[1].includes('data:image'))
    const isBgImage = args[4].includes("bg");
    let bgImg = new Image();
    let fsize = "0";
    if (args[1] !== !!0 && !isBas64Img) {
      
      args[1] = args[1].includes("?") ? args[1].split("?")[0] : args[1];
      try {
        response = (!args[1].includes('data:image')) && await fetch(args[1], {
          method: "GET",
          //redirect: "manual", // Permet de suivre les redirections explicitement
          mode: "cors",
        });//.then(response=>requestCompletedCount++);
        
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
        //requestCompletedCount++;
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
            status:response.status
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
            ratio > 3 &&
            String(ratio) !== "Infinity" &&
            sizeInKb > 70
          ) {
            console.log(
              "%c Warning : ratio supérieur à 3 : " + ratio,
              "color: orange"
            );
          } else if (
            ratio > 2 &&
            String(ratio) !== "Infinity" &&
            (args[5] >= 900 || (args[6] >= 900 && sizeInKb > 70))
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
              `%c Warning - la taille de l'image dépasse 250 KB : ${formatBytes(
                fsize
              )}  url : ${result.url}`,
              "color: orange"
            );
          } /*317435 Bytes = 310 KB*/ else if (fsize > 317435) {
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
            fsize > 317435 ? 0 : fsize > 256000 && fsize < 317435 ? 2.5 : 5
          );
          alt_scores.push(result.alt[2] !== false ? 5 : 0);
          dataChecker.img_check.alt_img.push({
            alt_img_state: true,
            alt_img_src: result.url ? result.url : args[1],
            alt_img_value: result.alt,
            alt_img_score: (result.alt !== false) ? 5 : 0,
          }),
            dataChecker.img_check.size_img.push({
              size_img_state: "true",
              size_img_src: result.url,
              size_img: result.size,
              size_img_score:
                (fsize > 317435 ? 0 : fsize > 256000 && fsize < 317435 ? 2.5 : 5 ? response.status === '404' : 0) ,
              check_title: "Images size",
              image_status: response.status
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
          //let statusScoreImg = (response.status =='404') ? 0 : 5;
          

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
        }
      } catch (error) {
        console.log('link : ',args[1], error);
        dataChecker.img_check.ratio_img.push({
          ratio_img_state: true,
          ratio_img_src: result.url,
          type_img: 'image non disponible : 404',
          img_height: result.Imgheight,
          img_width: result.Imgwidth,
          parent_img_height: result.parentwidth,
          parent_img_width: result.parentheight,
          ratio_parent_img_height: result.ratioHeight,
          ratio_parent_img_width: result.ratioWidth,
          ratio_img: result.ratio,
          ratio_img_score: ratioScoreImg,
        });
        
        console.log("%cNot available", "color:yellow");
        console.log(error, error.message, '  url : ' + args[1]);
        result && console.log({ result }, result.target);
        
      }
    } else {
      console.log("url not valid : ", result.url, args[1]);
   
    }
    requestCompletedCount++;
    dataChecker.img_check.nb_img = requestCompletedCount;
    
    if (requestCompletedCount === allUrlsImages.length) {
      ratio_scores.push(ratioScoreImg);
      console.log(" Fin du traitement du check des images size and alt")
      checkUrlImgDuplicate();
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
    initDataChecker(size_scores,ratio_scores, alt_scores, scoreCheckLink);

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
      const isBas64Img = srcV && srcV.includes("data:image")
      //const checkStackMedias = (srcV.includes('/uploads/') || srcV.includes('/images/'));

      srcV =
        !isDudaImage &&
        !isBas64Img &&
        srcV &&
        srcV.at(0).includes("/") &&
        srcV.includes("/wp-content/")
          ? window.location.origin +
            "/wp-content/" +
            srcV.split("/wp-content/")[1]
          : (src && !srcV.includes("http") && !srcV.at(0).includes('/')) ? window.location.origin +'/'+srcV : srcV;
      srcV = (srcV && srcV.includes('data:image') && srcV.includes('http'))  ? 'data:image'+srcV.split('data:image')[1] : srcV;
      if (srcV) {
        $(this) && srcV;
        !srcV.includes("mappy") &&
          !srcV.includes("cdn.manager.solocal.com") &&
          !srcV.includes("gravityforms") &&
          !srcV.includes("static.cdn-website") &&
          !$(this).hasClass('leaflet-marker-icon') &&
          !srcV.includes("5+star.svg") &&
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
          bgimg.includes("http") || bgimg.includes('data:image')
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
    console.log({ allImg });
    let cmpImages = 0;
    for (const item of allImg) {
      const content = item.value;
      cmpImages++;
      checkUrlImg(content);
      allUrlsImages.push(item.value[1]);
    }
  };


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
  let cmp_url = 0;
  let urlsScanned = [];
  const verifExcludesUrls = (url) =>{
    return url!==undefined &&
    url.length>1&&
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
    url.at(0) !=='?' &&
    !(url.length === 1 && url.includes('#'));
  }
  let warningLinks = [];
  let linksStack = document.querySelector("#Wrapper")
    ? $('#Wrapper a[href]')
    : $('#dm a[href]');
    linksStack = linksStack.length ? linksStack : $("body a");
    let linksStackFilter = [];
    linksStack.each(function(i,t){
      const href = $(this).attr("href");
      (verifExcludesUrls(href) &&  !t.getAttribute("href").includes('linkedin.') && !t.getAttribute("href").includes('http:')) &&  linksStackFilter.push(t);
      (t.getAttribute("href").includes('http:') || t.getAttribute("href").includes('linkedin.')) && warningLinks.push({target:t, url:t.getAttribute("href")})
    });

  //console.log('liens à analyser : ',urlsScanned);
  const nbLinks = linksStackFilter.length;
  //console.log('liens à check : ',{linksStackFilter}, '   url : ', linksStack.href, ' nombre de liens : ',linksStackFilter.length);


  (nbLinks === 0) && checkerImageWP();
  let iterationsLinks = 0;
  const check = (_url, _txt, _node) =>{
    cmp_url++;
    _txt = _txt.trim();
    const response = {
      status: null,
      document: null,
    };
    //_url = (_url.includes('solocaldudaadmin.eu-responsivesiteeditor.com'))? window.location.href.split('?')[0]+_url.split('solocaldudaadmin.eu-responsivesiteeditor.com')[1] : _url
    //dataChecker.link_check.nb_link = nbLinks;
    return new Promise(function (resolve, reject) {
      let fetchTimeout = null;
      const startDoubleSlash  = /^\/\//;
      _url = _url.match(startDoubleSlash) !==null ? 'https:'+_url : _url;
      //(!_url.includes('http:') )&& !_url.includes('.linkedin.com') && 
      fetch(_url, {
        method: "GET",
        //redirect: "manual", // Permet de suivre les redirections explicitement
        mode: "cors",
      })
        .then((res) => {
          (iterationsLinks === 0)&&  (console.log(
            "--------------------- Start check validity links -----------------------------"
          ),  console.log({nbLinks}),  //Message d'alerte pour les liens http: et lindein qui ne peuvent être envoyé dans la requête
          warningLinks.forEach((t,i) =>{
            const url = t.url;
            const target = t.target;
            let isLinkedin = (url.includes('linkedin')) ? "Linkedin" : "";
            let isNosecure = (url.includes('http:')) ? "ATTENTION VOTRE LE EST EN HTTP ET DONC NON SECURISE : AJOUTER HTTPS" : "";
            console.log(
            `%c ${isNosecure} - Vérifier le lien  ${isLinkedin}: 
            ${new URL(url).href} manuellement >>>`,
            `color:${isNosecure ? 'red' : 'orange'}`);
            target.style.border = isNosecure ?  'solid 3px red' : '';
            target.setAttribute('title', isNosecure ?  'HTTP - No secure' : '');
            }));
          clearTimeout(fetchTimeout);
          response.status = res.status;
          response.document = res.responseText;
          isLinkedin = res.status === 999;
          txtLinkedin = isLinkedin ? "Lien Linkedin : " : "";
          const isButton = ((_node &&_node.style.padding && parseInt(_node.style.padding)>=5) ||  
                            (_node.getAttribute('class') ? (_node.getAttribute('class').includes('dmButtonLink') ||
                             _node.getAttribute('class').includes('vc_btn3')) : false
                            ));
          console.log('__ Is a button ? ',{isButton});
          resolve(response);
          if (res.ok || isLinkedin) {
            console.log(
              `url: ${txtLinkedin} ${_url} %c${_txt} -> %cstatus: %c${response.status}`,
              "color:cornflowerblue;",
              "color:white;",
              "color:green"
            );
            scoreCheckLink.push(5);
          } else if (!isLinkedin && !res.ok) {
            console.log(
              `url: ${_url} %c${_txt} -> %cstatus: %c${response.status}`,
              "color:cornflowerblue;",
              "color:white;",
              "color:red"
            );
            _node.setAttribute('title','Erreur : '+ response.status);
            _node.style.border = 'solid 3px red';
            scoreCheckLink.push(0);
          }else if(res.status === 301){
            console.log(
              `!!!! ATENTION REDIRECTION 301 -> url: ${_url} %c${_txt} -> %cstatus: %c${response.status}`,
              "color:cornflowerblue;",
              "color:white;",
              "color:orange"
            );
            scoreCheckLink.push(5);
          }
          (_node.closest('#dm') && _url.includes('site-privilege.pagesjaunes')) && console.log("%cAttention lien prépup WP présent dans Duda : "+_url+ ' - élément : '+_node,'color:red;');

          dataChecker.link_check.link.push({
            link_state: true,
            link_status: response.status,
            link_url: _url,
            link_text: _txt.replace(",  text : ", "").trim(),
            link_score: res.ok ? 5 : 0,
            link_msg: res.ok ? "Lien valide." : "Lien non valide.",
          });

          dataChecker.link_check.link_check_state = true;
          iterationsLinks ++;
          console.log('Link checked : ',iterationsLinks +'/'+ nbLinks);
          (iterationsLinks === nbLinks) && (console.log(
            "--------------------- END check validity links -----------------------------"
          ),checkerImageWP());
        })
        .catch((error) => {
          iterationsLinks ++;
          _node.style.border = 'solid 3px red';
            const msgStatus = response.status === null ? 'insecure resource' : response.status;
          _node.setAttribute('title','Erreur : '+ msgStatus);

          resolve(response);
          console.log('Lien analysés : ',iterationsLinks +'/'+ nbLinks, '   en erreur : ',error);
          (iterationsLinks === nbLinks) && (console.log(
            "--------------------- END check validity links -----------------------------"
          ),checkerImageWP(),checkLinksDuplicate());
        });

      fetchTimeout = setTimeout(() => {
        response.status = 408;
        resolve(response);
      }, (timeout += 1000));
    });

  }
  

  dataChecker.link_check.nb_link = linksStack.length;
  // console.log(
  //   "--------------------- Start check validity links -----------------------------"
  // );
  
  $.each(linksStackFilter, function (i, t) {
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
      
      const externalLink = !url.includes(window.location.origin);
      let txtContent =
        url &&
        url.at(-4) &&
        !url.at(-4).includes(".") &&
        t.textContent.length > 1
          ? ",  text : " + t.textContent.replace(/(\r\n|\n|\r)/gm, "")
          : "";
          txtContent = ($(this).find('svg') && $(this).find('svg').attr('alt')) ? ",  text : "+$(this).find('svg').attr('alt')  : txtContent;
          verifExcludesUrls(url) &&
        check(new URL(url).href, txtContent, t, externalLink);

      if (
        verifExcludesUrls(url) &&
        externalLink &&
        !url.includes("de.cdn-website.com") &&
        url.includes("https") &&
        url.includes('linkedin')
      ) {
        console.log(
          `%c Vérifier le lien "Linkedin" : 
          ${txtContent} manuellement >>>`,
          "color:orange"
        ),
          console.log(new URL(url).href, t);
          check(new URL(url).href, txtContent, t, externalLink);
      } else if (
        verifExcludesUrls(url) &&
        externalLink &&
        !url.includes("de.cdn-website.com") &&
        url.includes("http:")
      ) {
        console.log(
          `%c Vérifier le lien ${txtContent} manuellement et SECURISEZ LE via "https" si ceci est possible >>>`,
          "color:orange"
        ),
          console.log(new URL(url).href, t);
          check(new URL(url).href, txtContent, t, externalLink);
      }

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
          )
      );
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
  const checkLinksDuplicate = () =>{
    let linksCounts = {};
    linksStack.each(function (t,i) {
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
    console.log('All links : ',linksAnalyse);

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
  }
}
initcheckerLinksAndImages();