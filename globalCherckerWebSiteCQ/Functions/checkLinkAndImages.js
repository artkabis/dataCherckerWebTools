(($) => {
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
          //redirect: "manual", // Permet de suivre les redirections explicitement
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

          dataChecker.img_check.nb_img = requestCompletedCount;
          size_scores.push(
            fsize > 317435 ? 0 : fsize > 256000 && fsize < 317435 ? 2.5 : 5
          );
          alt_scores.push(result.alt[2] !== false ? 5 : 0);

          dataChecker.img_check.alt_img.push({
            alt_img_state: true,
            alt_img_src: result.url ? result.url : args[1],
            alt_img_score: result.alt[2] !== false ? 5 : 0,
          }),
            dataChecker.img_check.size_img.push({
              size_img_state: "true",
              size_img_src: result.url,
              size_img: result.size,
              size_img_score:
                fsize > 317435 ? 0 : fsize > 256000 && fsize < 317435 ? 2.5 : 5,
              check_title: "Images size",
            });
          const imgcheckRatio =
            (result.ratio < 2 &&
              result.Imgheight < 150 &&
              result.Imgwidth < 150) ||
            result.ratio == "image cachée";
          let ratioScoreImg;

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
          ratio_scores.push(ratioScoreImg);

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
    let cmpAllImg = 0;
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

  let scoreCheckLink = [],
    isLinkedin,
    txtLinkedin;
  dataChecker.link_check.link = [];
  function check(_url, _txt, _node) {
    const response = {
      status: null,
      document: null,
    };
    //_url = (_url.includes('solocaldudaadmin.eu-responsivesiteeditor.com'))? window.location.href.split('?')[0]+_url.split('solocaldudaadmin.eu-responsivesiteeditor.com')[1] : _url
    //dataChecker.link_check.nb_link = nbLinks;
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
          isLinkedin = res.status === 999;
          txtLinkedin = isLinkedin ? "Lien Linkedin : " : "";
          resolve(response);
          if (res.ok || isLinkedin) {
            console.log(
              `url: ${txtLinkedin} ${_url} %c${_txt} -> %cstatus: %c${response.status}`,
              "color:cornflowerblue;",
              "color:white;",
              "color:green"
            );
            scoreCheckLink.push(5);
          } else if (!isLinkedin) {
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
    : document.querySelectorAll("#dm_content a, .dmCall, .dmFooterContainer a");
  dataChecker.link_check.nb_link = linksStack.length;
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
          `%c Vérifier le lien ${
            url.includes("linkedin.com") ? "Linkedin" : ""
          }${t.textContent.replace(/(\r\n|\n|\r)/gm, "")} manuellement >>>`,
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
          `%c Vérifier le lien ${
            url.includes("linkedin.com") ? "Linkedin" : ""
          } ${t.textContent.replace(
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
  let linksCounts = {};
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
})(jQuery);