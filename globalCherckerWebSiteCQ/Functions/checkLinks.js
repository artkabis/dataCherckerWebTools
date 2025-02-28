// checkLinks.js - Module d'analyse des liens
(($) => {
    // État global de l'analyse des liens
    window.linksAnalysisState = {
        inProgress: false,
        completed: false,
        results: [],
        totalLinks: 0,
        processedLinks: 0
    };

    // Fonction principale exportée
    window.startLinksAnalysis = function () {
        console.log("----------------------------- Start Check validity links -----------------------------");
        window.linksAnalysisState.inProgress = true;
        window.linksAnalysisState.completed = false;

        let urlsDuplicate = [],
            requestInitiatedCount = 0,
            requestCompletedCount = 0,
            imagesForAnalyseImg = [],
            imagesForAnalyseBG = [];

        //reset datachecker nodes
        dataChecker.link_check.link = [];
        let scoreCheckLink = [];

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

        window.linksAnalysisState.totalLinks = nbLinks;

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

                fetch(_url, {
                    method: "GET",
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

                        const isMenuLink =
                            _node &&
                                (_node?.closest(".main-navigation") || _node?.closest("#menu"))
                                ? true
                                : false;
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
                            !isExternalLink &&
                                !isMenuLink &&
                                !isCTA &&
                                !isImageLink &&
                                !isImageProductShop &&
                                inContent &&
                                !(_url.includes("openstreetmap") || _url.includes("mapbox"))
                                ? true
                                : false;
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
                        window.linksAnalysisState.processedLinks = iterationsLinks;

                        console.log("Link checked : ", iterationsLinks + "/" + nbLinks);
                        const linksNumberPreco =
                            maillageInterne >= 1 && maillageInterne < 4
                                ? "color:green"
                                : "color:red";

                        if (iterationsLinks === nbLinks) {
                            console.log(
                                `%cVous avez ${maillageInterne} lien(s) interne(s) sur cette page (préco de 1 à 3 ) >>> `,
                                `${linksNumberPreco}`
                            );
                            console.log(liensInternes);
                            console.log("Lien(s) externe(s) : ", liensExternes);
                            console.log(
                                "--------------------- END check validity links -----------------------------"
                            );

                            // Signaler la fin de l'analyse des liens
                            window.linksAnalysisState.inProgress = false;
                            window.linksAnalysisState.completed = true;
                            window.linksAnalysisState.results = dataChecker.link_check;

                            // Déclencher l'événement de fin d'analyse des liens
                            window.dispatchEvent(new CustomEvent('linksAnalysisComplete', {
                                detail: {
                                    maillageInterne,
                                    liensInternes,
                                    liensExternes,
                                    scoreCheckLink
                                }
                            }));

                            // Vérifier si toutes les analyses sont terminées
                            if (typeof window.checkAllAnalysesComplete === 'function') {
                                window.checkAllAnalysesComplete();
                            }
                        }
                    })
                    .catch((error) => {
                        iterationsLinks++;
                        window.linksAnalysisState.processedLinks = iterationsLinks;

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

                        if (iterationsLinks === nbLinks) {
                            console.log(
                                "Vous avez ",
                                maillageInterne,
                                "lien(s) interne(s) sur cette page >>>  "
                            );
                            console.log({ liensInternes });
                            console.log(
                                "--------------------- END check validity links -----------------------------"
                            );

                            // Signaler la fin de l'analyse des liens
                            window.linksAnalysisState.inProgress = false;
                            window.linksAnalysisState.completed = true;
                            window.linksAnalysisState.results = dataChecker.link_check;

                            // Déclencher l'événement de fin d'analyse des liens
                            window.dispatchEvent(new CustomEvent('linksAnalysisComplete', {
                                detail: {
                                    maillageInterne,
                                    liensInternes,
                                    liensExternes,
                                    scoreCheckLink
                                }
                            }));

                            // Vérifier si toutes les analyses sont terminées
                            if (typeof window.checkAllAnalysesComplete === 'function') {
                                window.checkAllAnalysesComplete();
                            }
                        }
                    });

                fetchTimeout = setTimeout(() => {
                    response.status = 408;
                    resolve(response);
                }, (timeout += 1000));
            });
        };
        dataChecker.link_check.nb_link = linksStack.length;

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

        // Démarrer l'analyse des liens
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
                        const delayTime = ($this.closest("dmRoot") && linksStackFilter.length > 99) ? 50 : 0;
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

        // Lancer l'analyse des liens
        processLinks(linksStackFilter);
    };

    // Exposer une fonction pour vérifier l'état
    window.isLinksAnalysisComplete = function () {
        return window.linksAnalysisState.completed;
    };

    // Exposer une fonction pour obtenir les résultats
    window.getLinksAnalysisResults = function () {
        return {
            ...window.linksAnalysisState,
            scoreCheckLink: dataChecker?.link_check?.link?.map(l => l.link_score) || []
        };
    };

})(jQuery);