// checkLinks.js - Module d'analyse des liens avec amélioration des performances
window.dataCheckerAnalysisComplete = false;

(($) => {
    // État global de l'analyse des liens
    window.linksAnalysisState = {
        inProgress: false,
        completed: false,
        results: [],
        totalLinks: 0,
        processedLinks: 0,
        startTime: null,
        endTime: null,
        duration: null
    };

    // Fonction principale exportée
    window.startLinksAnalysis = function () {
        console.log("----------------------------- Start Check validity links -----------------------------");

        // Initialiser l'état de l'analyse
        window.linksAnalysisState = {
            inProgress: true,
            completed: false,
            results: [],
            totalLinks: 0,
            processedLinks: 0,
            startTime: Date.now(),
            endTime: null,
            duration: null
        };

        let urlsDuplicate = [],
            requestInitiatedCount = 0,
            requestCompletedCount = 0,
            imagesForAnalyseImg = [],
            imagesForAnalyseBG = [];

        // Reset datachecker nodes
        if (typeof dataChecker !== 'undefined' && dataChecker.link_check) {
            dataChecker.link_check.link = [];
        } else if (typeof dataChecker === 'undefined') {
            window.dataChecker = {
                link_check: {
                    link: [],
                    link_check_state: false
                }
            };
        }

        let scoreCheckLink = [];

        const trierUrlsRepetees = (items) => {
            const occurences = {};
            items.forEach((item) => {
                const isValidUrl =
                    item.url && (item.url.includes("/uploads/") ||
                        item.url.includes("le-de.cdn-website"));
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
                url?.charAt(0) !== "?"
            );
        };

        const isElementVisible = (el) => {
            if (!el) return false;
            const rects = el.getClientRects();
            if (!rects || rects.length === 0) return false;

            for (let i = 0; i < rects.length; i++) {
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
                    ? $(this).attr("href")
                    : $(this).attr("data-actions")?.split("url:")[1]?.replaceAll(";", "");
            if (
                verifExcludesUrls(href) &&
                !href?.includes("linkedin.") &&
                (href?.includes("https:") || (href?.charAt(0) === "/" && href.length > 0)) &&
                !href?.includes("tel:")
            ) {
                linksStackFilter.push({ target: t, href: href });
            } else if (
                href?.includes("http:") ||
                href?.includes("linkedin.") ||
                href?.includes("tel:") ||
                !verifExcludesUrls(href)
            ) {
                warningLinks.push({ target: t, url: href });
            }
        });

        const nbLinks = linksStackFilter?.length;
        console.log({ linksStackFilter }, { warningLinks });

        window.linksAnalysisState.totalLinks = nbLinks;

        // Si aucun lien, terminer immédiatement
        if (nbLinks === 0) {
            finalizeAnalysis(0, [], [], []);
            return;
        }
        //Vérification des numéros de téléphone
        const checkValidityPhoneNumber = (t, url) => {
            if (!url) return;

            let checkPhoneNumber = false;
            if (url.includes("tel:")) {
                const phoneNumber = url.replaceAll(" ", "").split("tel:")[1];
                checkPhoneNumber = new RegExp(
                    /^(?:(?:\+|00)33|0)\s*[1-9](?:\d{2}){4}$/
                ).test(phoneNumber);

                console.log(
                    `%cNuméro de téléphone detécté :${url} - Validité : ${checkPhoneNumber ? "OK" : "KO"}`,
                    `color:${checkPhoneNumber ? "green" : "red"}`
                );
            }

            if (!t) return;

            const dudaPhone =
                t.getAttribute &&
                    t.getAttribute("class") &&
                    t.getAttribute("class").includes("dmCall")
                    ? t.getAttribute("phone")
                    : false;

            if (dudaPhone) {
                console.log(
                    "--------------------- Start check validity phone -----------------------------"
                );

                const checkDudaPhoneNumber = new RegExp(
                    /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/
                ).test(dudaPhone.replaceAll(" ", ""));

                console.log(
                    `%cNuméro de téléphone detécté :${dudaPhone} - Validité : ${checkDudaPhoneNumber ? "OK" : "KO"}`,
                    `color:${checkDudaPhoneNumber ? "green" : "red"}`
                );

                console.log(
                    "--------------------- End check validity phone -----------------------------"
                );
            }
        };

        warningLinks.forEach(function (t) {
            if (t && t.target && t.url) {
                checkValidityPhoneNumber(t.target, t.url);
            }
        });

        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        //Check phone number in slider rev
        const SliderRevPhone = $('rs-layer[data-actions*="url:tel:"]')[0];
        if (SliderRevPhone) {
            const phoneUrl = SliderRevPhone.getAttribute("data-actions")
                ?.split("url:")[1]
                ?.split(" ;")[0];
            checkValidityPhoneNumber(SliderRevPhone, phoneUrl);
        }

        let iterationsLinks = 0;
        let maillageInterne = 0;
        const liensInternes = [],
            liensExternes = [];
        const styleLinkError =
            "border: 3px double red!important;outline: 5px solid #bb0000!important;outline-offset: 5px;!important";

        const check = (_url, _txt, _node) => {
            if (!_url || !_node) {
                console.error("Erreur: URL ou nœud manquant dans check()");
                return Promise.resolve({ status: null, document: null });
            }

            cmp_url++;
            _txt = _txt ? _txt.trim() : "";
            const response = {
                status: null,
                document: null,
            };

            return new Promise((resolve) => {
                let fetchTimeout = null;
                const startDoubleSlash = /^\/\//;
                _url = _url.match(startDoubleSlash) !== null ? "https:" + _url : _url;

                fetch(_url, {
                    method: "GET",
                    headers: {
                        'User-Agent': 'User - Agent: Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 123.0.0.0 Safari / 537.36'
                    }
                })
                    .then(async (res) => {
                        if (iterationsLinks === 0) {
                            console.log(
                                "--------------------- Start check validity links -----------------------------"
                            );

                            //Message d'alerte pour les liens http: et linkedin et tel: qui ne peuvent être envoyé dans la requête
                            warningLinks.forEach((t) => {
                                if (!t || !t.url || !t.target) return;

                                const url = t.url;
                                const target = t.target;
                                let isLinkedin = url.includes("linkedin") ? "Linkedin" : "";
                                const isNotSecure = url.includes("http:");
                                let isNotsecureMsg = isNotSecure
                                    ? "ATTENTION VOTRE LIEN EST EN HTTP ET DONC NON SECURISE : AJOUTER HTTPS"
                                    : "";

                                if (verifExcludesUrls(url) && (!url.includes("tel:") && isLinkedin && !isNotSecure)) {
                                    console.log(
                                        `%c Vérifier le lien  ${isLinkedin}: ${url} manuellement >>>`,
                                        `color:${isNotSecure ? "red" : "orange"}`
                                    );
                                }

                                if (isNotSecure) {
                                    target.style.cssText = styleLinkError;
                                    target.setAttribute("title", isNotsecureMsg);
                                }
                            });
                        }

                        clearTimeout(fetchTimeout);
                        response.status = res.status;
                        response.document = res.responseText;
                        let isLinkedin = res.status === 999;
                        let txtLinkedin = isLinkedin ? "Lien Linkedin : " : "";

                        const isCTA =
                            (_node &&
                                ((_node.style && _node.style.padding && parseInt(_node.style.padding) >= 5) ||
                                    (_node.style && _node.style.width && parseInt(_node.style.width) >= 15) ||
                                    (_node.style && _node.style.height &&
                                        parseInt(_node.style.height) >= 15))) ||
                            _node.clientHeight >= 10 ||
                            _node.clientWidth >= 10 ||
                            (_node.getAttribute && _node.getAttribute("class")
                                ? (_node.getAttribute("class").includes("dmButtonLink") ||
                                    _node.getAttribute("class").includes("vc_btn3") ||
                                    _node.getAttribute("class").toLowerCase().includes("button") ||
                                    _node.getAttribute("class").toLowerCase().includes("boutton"))
                                : false);

                        const inContent =
                            _node.closest && (_node.closest("#Content") || _node.closest(".dmContent"))
                                ? true
                                : false;

                        const imageWidget = (inContent) => {
                            if (inContent && !isCTA && _node.closest && _node.closest(".dmRespCol")) {
                                const respCol = _node.closest(".dmRespCol");
                                if (respCol && respCol.children) {
                                    for (let i = 0; i < respCol.children.length; i++) {
                                        const childElement = respCol.children[i];
                                        if (childElement && childElement.classList &&
                                            childElement.classList.contains("imageWidget")) {
                                            return true;
                                        }
                                    }
                                }
                            }
                            return false;
                        };

                        const isImageWidget = imageWidget(inContent);
                        const isImageProductShop = _node.closest && _node.closest(".ec-store") ? true : false;

                        let isExternalLink = false;
                        try {
                            isExternalLink = _url.includes("http") &&
                                !new URL(_url).href.includes(window.location.origin);
                        } catch (e) {
                            console.error("Erreur lors de la création de l'URL:", e);
                        }

                        const isImageLink =
                            _node &&
                                (_node.closest && _node.closest(".image-container") ||
                                    isImageWidget === true ||
                                    (_node.getAttribute && _node.getAttribute("class") &&
                                        _node.getAttribute("class").includes("caption-button")) ||
                                    _node.querySelector && _node.querySelector("img") ||
                                    (_node.style && _node.style.backgroundImage && !isImageProductShop))
                                ? true
                                : false;

                        const isMenuLink =
                            _node && _node.closest &&
                                (_node.closest(".main-navigation") || _node.closest("#menu"))
                                ? true
                                : false;

                        const isMedia = _url
                            .split(".")
                            .pop()
                            .toLowerCase()
                            .match(/png|jpe?g|jpg|mp3|mp4|gif|pdf|mov|webp/);

                        const underForm = _node && _node.closest && _node.closest("form");

                        const isDudaPrepub =
                            window.location.origin && window.location.origin.includes("solocaldudaadmin");

                        let dudaPrepub = "/";
                        if (isDudaPrepub &&
                            typeof window.location.pathname === "string" &&
                            window.location.pathname.split("/")[3]) {
                            dudaPrepub = window.location.pathname.split("/")[3].replaceAll("/", "");
                        }

                        let underPathLink = false;
                        try {
                            if (isDudaPrepub) {
                                underPathLink =
                                    typeof new URL(_url).pathname === "string" &&
                                    new URL(_url).pathname.split("/")[3] === dudaPrepub;
                            } else {
                                underPathLink = window.location.pathname &&
                                    _url.includes(window.location.pathname) &&
                                    _url.includes(window.location.pathname.replaceAll("/", ""));
                            }
                        } catch (e) {
                            console.error("Erreur lors de la vérification underPathLink:", e);
                        }
                        const isSamePageLink = (link) => {
                            try {
                                const currentPageUrl = window.location.href;
                                const linkUrl = new URL(link, window.location.origin).href;

                                if (linkUrl === currentPageUrl) {
                                    return true;
                                }

                                if (linkUrl.startsWith(currentPageUrl + "#")) {
                                    return true;
                                }

                                return false;
                            } catch (e) {
                                console.error("Erreur dans isSamePageLink:", e);
                                return false;
                            }
                        };

                        // Vérification des liens qui pointent vers la même page
                        if ((_node.closest && (_node.closest("#dm_content") || _node.closest("#Content"))) &&
                            !isExternalLink &&
                            !isMenuLink &&
                            _url && isSamePageLink(_url) &&
                            !_url.includes("#")) {

                            console.log(
                                `%cAttention, vous utilisez un lien qui redirige vers la même page : ${_url} - ${underPathLink}`,
                                "color:red"
                            );
                            console.log(_node);

                            if (_node.setAttribute) {
                                _node.setAttribute(
                                    "title",
                                    "Votre lien redirige vers la page en cours"
                                );
                            }

                            if (_node.style) {
                                _node.style.cssText = styleLinkError;
                            }
                        }

                        const permalien =
                            !isExternalLink &&
                            !isMenuLink &&
                            !isCTA &&
                            !isImageLink &&
                            !isImageProductShop &&
                            inContent &&
                            !(_url.includes("openstreetmap") || _url.includes("mapbox"));

                        let cleanUrl = _url;
                        try {
                            if (_url.includes("solocaldudaadmin") || _url.includes("pagesjaune.fr")) {
                                cleanUrl = new URL(_url).pathname;
                            }
                        } catch (e) {
                            console.error("Erreur lors du nettoyage de l'URL:", e);
                        }

                        if (!underForm && !isMedia && !isImageProductShop && permalien) {
                            liensInternes.push(cleanUrl);
                            maillageInterne++;
                        }

                        if (isExternalLink) {
                            liensExternes.push(_url);
                        }

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

                            if (_node.setAttribute) {
                                _node.setAttribute("title", "Erreur : " + response.status);
                            }

                            if (_node.style) {
                                _node.style.cssText = styleLinkError;
                            }

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

                            if (_node.setAttribute) {
                                _node.setAttribute("title", "Erreur : " + response.status);
                            }

                            if (_node.style) {
                                _node.style.cssText = styleLinkError;
                            }

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

                        // Vérifications supplémentaires pour les sites Duda
                        if (_node.closest && _node.closest("#dm") && _url.includes("site-privilege.pagesjaunes")) {
                            console.log(
                                "%cAttention lien prépup WP présent dans Duda : " +
                                _url +
                                " - élément : " +
                                _node,
                                "color:red;"
                            );
                        }

                        if (_node && _node.closest && _node.closest("#dm") &&
                            window.location.href && !window.location.href.includes("solocaldudaadmin.eu-responsivesiteeditor") &&
                            _url && _url.includes("eu-responsivesiteeditor.com")) {
                            console.log(
                                "%cAttention lien prépup Duda présent dans le site en ligne : " +
                                _url +
                                " - élément : " +
                                _node,
                                "color:red;"
                            );
                        }

                        // Ajout des données au dataChecker
                        if (typeof dataChecker !== 'undefined' && dataChecker.link_check) {
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
                        }

                        iterationsLinks++;
                        window.linksAnalysisState.processedLinks = iterationsLinks;

                        console.log("Link checked : ", iterationsLinks + "/" + nbLinks);

                        // Vérifier si c'était le dernier lien
                        if (window.linksAnalysisState.processedLinks >= window.linksAnalysisState.totalLinks) {
                            finalizeAnalysis(maillageInterne, liensInternes, liensExternes, scoreCheckLink);
                        }
                    })
                    .catch((error) => {
                        iterationsLinks++;
                        window.linksAnalysisState.processedLinks = iterationsLinks;

                        if (_node && _node.style) {
                            _node.style.cssText = styleLinkError;
                        }

                        if (_node && _node.setAttribute) {
                            _node.setAttribute("title", "Erreur : " + error);
                        }

                        if (typeof dataChecker !== 'undefined' && dataChecker.link_check) {
                            dataChecker.link_check.link_check_state = true;
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
                        }

                        resolve(response);
                        console.log(
                            "Lien analysés : ",
                            _url,
                            " - iteration : ",
                            iterationsLinks + "/" + nbLinks,
                            "   en erreur : ",
                            error
                        );

                        // Vérifier si c'était le dernier lien même en cas d'erreur
                        if (window.linksAnalysisState.processedLinks >= window.linksAnalysisState.totalLinks) {
                            finalizeAnalysis(maillageInterne, liensInternes, liensExternes, scoreCheckLink);
                        }
                    });

                fetchTimeout = setTimeout(() => {
                    response.status = 408;
                    resolve(response);
                }, (timeout += 1000));
            });
        };

        if (dataChecker && dataChecker.link_check) {
            dataChecker.link_check.nb_link = linksStack.length;
        }

        const checkLinksDuplicate = () => {
            let linksAnalyse = [];
            let linksCounts = {};

            linksStack.each(function () {
                const href = $(this).attr("href");
                if (href &&
                    href.length > 1 &&
                    !href.includes("bloctel.gouv.fr") &&
                    !href.includes("client.adhslx.com") &&
                    href.charAt(0) !== "#") {
                    linksAnalyse.push(href);
                }
            });

            linksAnalyse.forEach((element) => {
                linksCounts[element] = (linksCounts[element] || 0) + 1;
            });

            console.log("All links : ", linksAnalyse);

            const entries = Object.entries(linksCounts);
            const sortedEntries = entries.sort((a, b) => a[1] - b[1]);

            sortedEntries.forEach(([link, count]) => {
                const relativLink =
                    link.charAt(0) === "/" ? window.location.origin + link : link;

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

        // Fonction pour finaliser l'analyse (nouvelle fonction)
        function finalizeAnalysis(maillageInterne, liensInternes, liensExternes, scoreCheckLink) {
            if (!window.linksAnalysisState.completed) {
                const linksNumberPreco =
                    maillageInterne >= 1 && maillageInterne < 4
                        ? "color:green"
                        : "color:red";

                console.log(
                    `%cVous avez ${maillageInterne} lien(s) interne(s) sur cette page (préco de 1 à 3 ) >>> `,
                    `${linksNumberPreco}`
                );

                if (liensInternes && liensInternes.length) {
                    console.log(liensInternes);
                }

                if (liensExternes && liensExternes.length) {
                    console.log("Lien(s) externe(s) : ", liensExternes);
                }

                console.log(
                    "--------------------- END check validity links -----------------------------"
                );

                // Mettre à jour l'état de l'analyse
                window.linksAnalysisState.inProgress = false;
                window.linksAnalysisState.completed = true;

                if (typeof dataChecker !== 'undefined' && dataChecker.link_check) {
                    window.linksAnalysisState.results = dataChecker.link_check;
                }

                window.linksAnalysisState.endTime = Date.now();
                window.linksAnalysisState.duration = window.linksAnalysisState.endTime - window.linksAnalysisState.startTime;

                console.log(`✅ Analyse des liens terminée en ${window.linksAnalysisState.duration / 1000}s`);

                // Déclencher les événements de fin
                window.dataCheckerAnalysisComplete = true;

                const detailObj = {
                    maillageInterne: maillageInterne || 0,
                    liensInternes: liensInternes || [],
                    liensExternes: liensExternes || [],
                    scoreCheckLink: scoreCheckLink || []
                };

                try {
                    window.dispatchEvent(new CustomEvent('linksAnalysisComplete', {
                        detail: detailObj
                    }));

                    window.dispatchEvent(new CustomEvent('dataCheckerAnalysisComplete'));
                } catch (e) {
                    console.error("Erreur lors du déclenchement des événements:", e);
                }

                // Vérifier si toutes les analyses sont terminées
                if (typeof window.checkAllAnalysesComplete === 'function') {
                    try {
                        window.checkAllAnalysesComplete();
                    } catch (e) {
                        console.error("Erreur lors de checkAllAnalysesComplete:", e);
                    }
                }
            }
        }

        // Fonctions pour le traitement par lots (nouvelles fonctions)
        async function processLinksInBatches(links, batchSize = 5) {
            const totalBatches = Math.ceil(links.length / batchSize);

            for (let i = 0; i < totalBatches; i++) {
                const batch = links.slice(i * batchSize, (i + 1) * batchSize);

                // Traiter ce lot en parallèle
                await Promise.all(batch.map(link => processLink(link)));

                // Mettre à jour la progression
                console.log(`Progression: Lot ${i + 1}/${totalBatches} (${window.linksAnalysisState.processedLinks}/${window.linksAnalysisState.totalLinks} liens)`);

                // Vérifier si nous avons terminé
                if (window.linksAnalysisState.processedLinks >= window.linksAnalysisState.totalLinks) {
                    break;
                }

                // Pause entre les lots pour ne pas surcharger
                await new Promise(r => setTimeout(r, 100));
            }
        }

        // Fonction pour traiter un seul lien
        async function processLink(linkObj) {
            if (!linkObj || !linkObj.href || !linkObj.target) {
                console.error("Objet lien invalide:", linkObj);

                // Incrémenter quand même pour ne pas bloquer l'analyse
                iterationsLinks++;
                window.linksAnalysisState.processedLinks = iterationsLinks;

                if (window.linksAnalysisState.processedLinks >= window.linksAnalysisState.totalLinks) {
                    finalizeAnalysis(maillageInterne, liensInternes, liensExternes, scoreCheckLink);
                }

                return;
            }

            let url = linkObj.href;
            const _this = linkObj.target;
            const $this = $(linkObj.target);

            if (url && !url.includes("tel:")) {
                url = url.charAt(0) === "/" || (url.charAt(0) === "?" && !url.includes("tel:"))
                    ? window.location.origin + url
                    : url;

                let txtContent = "";

                try {
                    if (url &&
                        url.charAt(url.length - 4) &&
                        !url.charAt(url.length - 4).includes(".") &&
                        linkObj.target.textContent &&
                        linkObj.target.textContent.length > 1) {
                        txtContent = ",  text : " +
                            linkObj.target.textContent
                                .replace(/(\r\n|\n|\r)/gm, "")
                                ?.replace("!!! ALT MANQUANT !!!", "");
                    } else if ($this.find("svg").length &&
                        $this.find("svg").attr("alt") &&
                        $this.find("svg").attr("alt").replace) {
                        txtContent = ",  text : " +
                            $this.find("svg").attr("alt").replace("!!! ALT MANQUANT !!!", "");
                    }
                } catch (e) {
                    console.error("Erreur lors de l'extraction du texte:", e);
                }

                if (url && verifExcludesUrls(url)) {
                    const delayTime = ($this.closest("dmRoot").length && linksStackFilter.length > 99) ? 50 : 0;

                    if (delayTime > 0) {
                        await delay(delayTime);
                    }

                    try {
                        await check(url, txtContent, linkObj.target);
                    } catch (e) {
                        console.error("Erreur lors de la vérification du lien:", e);
                    }

                    if (url.includes("linkedin")) {
                        console.log(
                            `%c Vérifier le lien "Linkedin" : ${txtContent} manuellement >>>`,
                            "color:orange"
                        );

                        try {
                            console.log(new URL(url).href, linkObj.target);

                            if (delayTime > 0) {
                                await delay(delayTime);
                            }

                            await check(new URL(url).href, txtContent, linkObj.target);
                        } catch (e) {
                            console.error("Erreur lors de la vérification du lien LinkedIn:", e);
                        }
                    } else if (url.includes("http:")) {
                        console.log(
                            `%c Vérifier le lien ${txtContent} manuellement et SECURISEZ LE via "https" si ceci est possible >>>`,
                            "color:red"
                        );

                        try {
                            console.log(new URL(url).href, linkObj.target);

                            if (delayTime > 0) {
                                await delay(delayTime);
                            }

                            await check(new URL(url).href, txtContent, linkObj.target);
                        } catch (e) {
                            console.error("Erreur lors de la vérification du lien HTTP:", e);
                        }
                    }
                }
            }
        }

        // Traiter les liens par lots
        checkLinksDuplicate();
        processLinksInBatches(linksStackFilter);
    };

    // Exposer une fonction pour vérifier l'état
    window.isLinksAnalysisComplete = function () {
        window.dataCheckerAnalysisComplete = true;
        // Déclencher un événement pour signaler l'achèvement
        try {
            window.dispatchEvent(new CustomEvent('dataCheckerAnalysisComplete'));
        } catch (e) {
            console.error("Erreur lors du déclenchement de dataCheckerAnalysisComplete:", e);
        }

        return window.linksAnalysisState.completed;
    };

    // Exposer une fonction pour obtenir les résultats
    window.getLinksAnalysisResults = function () {
        try {
            return {
                ...window.linksAnalysisState,
                scoreCheckLink: dataChecker?.link_check?.link?.map(l => l.link_score) || []
            };
        } catch (e) {
            console.error("Erreur lors de la récupération des résultats:", e);
            return window.linksAnalysisState;
        }
    };

})(jQuery);