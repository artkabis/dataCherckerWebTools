
console.log('CheckerImg loaded successfully');
export const CheckerImg = () =>{
    console.log('import CheckerImg successfully');

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
      const checkUrlImg = async (args) => {
        let result = false;
        requestInitiatedCount++;
        let response;
        const isBgImage = args[4].includes("bg");
        let bgImg = new Image();
        if(args[1] !== !!0){
          args[1] = (args[1].includes('?')) ?args[1].split('?')[0] : args[1];
        try {
          response = await fetch(args[1], {
            method: "GET",
            redirect: "follow", // Permet de suivre les redirections explicitement
          });
  
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
  
          const fsize = response.headers.get("content-length");
          if (fsize ) {
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
              ratio: String(ratio) === ("Infinity" || 0) ? "image cachée" : ratio,
            };
            console.log(result, "");
            
             if (
              (result.type === "srcImage" && (args[2] === null || args[2] === false))
            ) {
              console.log(
                "%c Warning SRC ALT not working : " + new URL(args[1]).href,
                "color: red"
              );
            }
  
             else if (ratio > 3 && String(ratio) !== "Infinity") {
              console.log(
                "%c Warning : ratio supérieur à 3 : " + ratio,
                "color: orange"
              );
            } 
            else if  (ratio > 2 && String(ratio) !== "Infinity" && (args[5] > 900 || args[6]  > 900)) {
              console.log(
                "%c Warning : ratio supérieur à 2 : " + ratio+ '  pour une image dépassant les 900px',
                "color: orange"
              );
            }
            /*256000 Bytes = 250 KB*/
            if (fsize > 256000 && fsize < 317435) {
              console.log(
                `%c Warning File size exceeds 250 KB : ${formatBytes(fsize)}  url : ${result.url}`,
                "color: orange"
              );
            } /*317435 Bytes = 310 KB*/
            
            else if(fsize > 317435){
              console.log(
                `%c Warning File size exceeds 310 KB : ${formatBytes(fsize)}  url : ${result.url}`,
                "color: red"
              );
            }
            result.target.parents(".owl-item.cloned").length === 0 &&
              result.target.parents("#logo").length !== 1 &&
              !result.target.hasClass("vc_parallax-inner") &&
              (urlsDuplicate.push({ url: result.url, target: result.target }),
              requestCompletedCount++);
          }
        } catch (error) {
          console.log("%cNot available", "color:yellow");
          (result) && console.log({result},result.target);
        }
        requestInitiatedCount === requestCompletedCount &&
          (console.log(" Fin du traitement du check des images size and alt"),
          checkUrlImgDuplicate());
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
      };
  
      const checkerImageWP = () => {
        console.log(
          "----------------------------- Check validity global image --------------------------------------------"
        );
        //https://cors-anywhere.herokuapp.com/https://le-de.cdn-website.com/7d23ec407cca4ee3b3dea0e5f5797ac6/dms3rep/multi/opt/08033404-40-1920w.jpg
      
        $("img").each(function (i, t) {
          const src = $(this).attr("src");
          let srcV = src ? src : $(this).attr("data-src");
          const altValid = ($(this).attr("alt") && $(this).attr("alt").length>0 && $(this).attr("alt") !=="");
          const isDudaImage = srcV && (srcV.includes('https://le-de.cdn-website.com/') || srcV.includes('https://de.cdn-website.com'));
  
          srcV =  ( srcV.at(0).includes('/') && srcV.includes('/wp-content/')) ? window.location.origin +
                  "/wp-content/" +
                  srcV.split("/wp-content/")[1]
                : srcV;
          $(this) &&
            srcV
            !srcV.includes("mappy") &&
            !srcV.includes("cdn.manager.solocal.com") &&
            !srcV.includes("gravityforms") &&
            imagesForAnalyseImg.push({
              key: "src-img-" + i,
              value: [
                $(this),
                srcV,// ? 'https://reverse-proxy-cors.herokuapp.com/'+$(this)[0].src : $(this)[0].src,
                (altValid) ? $(this).attr('alt') : false,
                $(this)[0].getAttribute("title"),
                "srcImage",
                $(this)[0].naturalWidth,
                $(this)[0].naturalHeight,
                $(this)[0].parentNode.offsetWidth,
                $(this)[0].parentNode.offsetHeight,
              ],
            });
        });
  
        let cmpBgImg = 0;
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
              const isDudaImage = (bgimg.includes('https://le-de.cdn-website.com/') || bgimg.includes('https://de.cdn-website.com')) ? true : false;
              const detectAnotherOrigin = !bgimg.includes(window.location.origin);
              
              
  
            (detectAnotherOrigin && !isDudaImage || detectAnotherOrigin && bgimg.includes('/wp-content/')) &&
              console.log(
                "%cImage url not current domain origin :" + bgimg,
                "color:yellow;"
              );
            bgimg =
              (detectAnotherOrigin && !isDudaImage && bgimg.includes('/wp-content/')) && bgimg.split("/wp-content/")[1]
                ? window.location.origin +
                  "/wp-content/" +
                  bgimg.split("/wp-content/")[1]
                : bgimg;
                //bgimg = (isDudaImage) && bgimg;//? 'https://reverse-proxy-cors.herokuapp.com/'+bgimg : bgimg;
  
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
        for (const item of allImg) {
          const content = item.value;
          checkUrlImg(content);
        }
      };
      setTimeout(function () {
        //console.log("--------------------- END check validity links -----------------------------");
        //$("#Wrapper").length && 
        checkerImageWP();
      }, document.querySelectorAll("a").length * 210);

}
console.log({CheckerImg})