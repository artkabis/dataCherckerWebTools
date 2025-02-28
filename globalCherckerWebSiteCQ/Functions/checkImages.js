// checkImages.js - Module d'analyse des images
(($) => {
    // État global de l'analyse des images
    window.imagesAnalysisState = {
        inProgress: false,
        completed: false,
        results: [],
        totalImages: 0,
        processedImages: 0
    };

    // Fonction principale exportée
    window.startImagesAnalysis = function () {
        console.log("----------------------------- Check validity global image --------------------------------------------");
        window.imagesAnalysisState.inProgress = true;
        window.imagesAnalysisState.completed = false;

        // Variables globales pour l'analyse des images
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

        MAX_SIZE_BYTES_IMAGE = currentSettings.MAX_SIZE_BYTES_IMAGE || 317435;
        MAX_RATIO_IMAGE = currentSettings.MAX_RATIO_IMAGE || 3;

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
                window.imagesAnalysisState.processedImages = requestCompletedCount;
                dataChecker.img_check.nb_img = requestCompletedCount;
                console.log('Image check : ', requestCompletedCount, ' / ', allUrlsImages.length);

                if (requestCompletedCount >= allUrlsImages.length) {
                    ratio_scores.push(ratioScoreImg);
                    console.log("Fin du traitement du check des images size and alt");
                    checkUrlImgDuplicate();
                    const titleTxt = $('meta[property="og:title"]').attr("content") || $(' head title').text();
                    $('meta[property="og:title"], head title').text(titleTxt.replace('⟳ ', ''));

                    // Signaler la fin de l'analyse des images
                    window.imagesAnalysisState.inProgress = false;
                    window.imagesAnalysisState.completed = true;
                    window.imagesAnalysisState.results = {
                        alt_img: dataChecker.img_check.alt_img,
                        size_img: dataChecker.img_check.size_img,
                        ratio_img: dataChecker.img_check.ratio_img
                    };

                    // Déclencher l'événement de fin d'analyse des images
                    window.dispatchEvent(new CustomEvent('imagesAnalysisComplete', {
                        detail: {
                            requestCompletedCount,
                            allUrlsImages,
                            ratioScoreImg,
                            ratio_scores,
                            size_scores,
                            alt_scores
                        }
                    }));

                    // Vérifier si toutes les analyses sont terminées
                    if (typeof window.checkAllAnalysesComplete === 'function') {
                        window.checkAllAnalysesComplete();
                    }
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
            initDataChecker(size_scores, ratio_scores, alt_scores);
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
                                : console.log();
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
            window.imagesAnalysisState.totalImages = allImg.length;

            let cmpImages = 0;
            for (const item of allImg) {
                const content = item?.value;
                cmpImages++;
                checkUrlImg(content);
                allUrlsImages.push(item.value[1]);
            }
        };

        // Démarrer l'analyse des images
        checkerImageWP();
    };

    // Exposer une fonction pour vérifier l'état
    window.isImagesAnalysisComplete = function () {
        return window.imagesAnalysisState.completed;
    };

    // Exposer une fonction pour obtenir les résultats
    window.getImagesAnalysisResults = function () {
        return window.imagesAnalysisState;
    };

})(jQuery);