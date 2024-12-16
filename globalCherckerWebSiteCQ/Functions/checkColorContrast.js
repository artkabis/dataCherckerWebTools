(() => {
    const colorService = function () {
        const largeFontSize = 24;
        const normalFontSize = 18.6667;
        const highThreshold = 7;
        const midThreshold = 4.5;
        const lowThreshold = 3;
        const defaultView = document.defaultView;

        const singleEvaluation = (foregroundColor, backgroundColor) => {
            if (!isValidHex(foregroundColor) || !isValidHex(backgroundColor)) {
                return false;
            }
            const contrast = getContrastRatio(hexToRGB(foregroundColor), hexToRGB(backgroundColor));
            const validation = {
                contrast,
                smallAA: true,
                smallAAA: true,
                largeAA: true,
                largeAAA: true
            };
            if (contrast < highThreshold && contrast >= midThreshold) {
                validation.smallAAA = false;
            } else if (contrast < midThreshold && contrast >= lowThreshold) {
                validation.smallAA = false;
                validation.smallAAA = false;
                validation.largeAAA = false;
            } else if (contrast < lowThreshold) {
                validation.smallAA = false;
                validation.smallAAA = false;
                validation.largeAA = false;
                validation.largeAAA = false;
            }
            return validation;
        }
        const getContrastRatio = (foreground, background) => {
            const foregroundLuminosity = getLuminosity(foreground);
            const backgroundLuminosity = getLuminosity(background);
            let higherValue;
            let lowerValue;
            if (foregroundLuminosity > backgroundLuminosity) {
                higherValue = foregroundLuminosity;
                lowerValue = backgroundLuminosity;
            } else {
                higherValue = backgroundLuminosity;
                lowerValue = foregroundLuminosity;
            }
            let contrastDiff = (higherValue + 0.05) / (lowerValue + 0.05);
            return Math.round(contrastDiff * 100) / 100; // round to two decimals
        }


        const getLuminosity = (RGBAColor) => {
            const {
                r,
                g,
                b
            } = RGBAColor;
            const fLinearisedRed = linearisedColorComponent(r / 255);
            const fLinearisedGreen = linearisedColorComponent(g / 255);
            const fLinearisedBlue = linearisedColorComponent(b / 255);
            return (0.2126 * fLinearisedRed + 0.7152 * fLinearisedGreen + 0.0722 * fLinearisedBlue);
        }
        const linearisedColorComponent = (colorSegment) => {
            let linearised;
            if (colorSegment <= 0.03928) {
                linearised = colorSegment / 12.92;
            } else {
                linearised = Math.pow(((colorSegment + 0.055) / 1.055), 2.4);
            }
            return linearised;
        }
        const evaluateColorContrastFromElement = (element, colorMatrix) => {
            const getComputedStyle = defaultView.getComputedStyle(element, null);
            const ancestorsStack = getAncestorsStackInfo(element);
            let backgroundColor = getColorFromStack(ancestorsStack);
            const hasOpacity = getOpacityFromStack(ancestorsStack) > 0;
            const isVisible = hasOpacity && isElementVisible(element);
            const fontSize = parseInt(getComputedStyle.getPropertyValue('font-size')
                .replace('px', ''));
            const fontWeight = getComputedStyle.getPropertyValue('font-weight');
            const isBold = parseInt(fontWeight) >= 700 || fontWeight === 'bold' || fontWeight === 'bolder';
            const size = (fontSize >= largeFontSize || (fontSize >= normalFontSize && isBold)) ? 'large' : 'small';
            let foregroundColor = getForegroundColor(element, ancestorsStack);
            if (colorMatrix) {
                foregroundColor = applyMatrixToColor(foregroundColor, colorMatrix);
                backgroundColor = applyMatrixToColor(backgroundColor, colorMatrix);
            }
            const contrast = getContrastRatio(foregroundColor, backgroundColor);
            const evaluation = {
                element,
                fontSize,
                fontWeight,
                size,
                foregroundColor,
                backgroundColor,
                contrast,
                isVisible
            };
            if (size === 'small') {
                evaluation.isValidAA = contrast >= midThreshold;
                evaluation.isValidAAA = contrast >= highThreshold;
            } else {
                evaluation.isValidAA = contrast >= lowThreshold;
                evaluation.isValidAAA = contrast >= midThreshold;
            }
            return evaluation;
        }
        const getForegroundColor = (element, stack) => {
            const bgColor = RGBStringToObject(getElementComputedStyle(element, 'color'));
            const opacity = parseFloat(getElementComputedStyle(element, 'opacity'));
            return getColorFromStack([{
                bgColor,
                opacity
            }].concat(stack))
        }
        const applyMatrixToColor = (color, matrix) => {
            const {
                r,
                g,
                b,
                o
            } = color;
            const rUpdated = r * matrix[0] + g * matrix[1] + b * matrix[2] + o * matrix[3] + matrix[4];
            const gUpdated = r * matrix[5] + g * matrix[6] + b * matrix[7] + o * matrix[8] + matrix[9];
            const bUpdated = r * matrix[10] + g * matrix[11] + b * matrix[12] + o * matrix[13] + matrix[14];
            const oUpdated = r * matrix[15] + g * matrix[16] + b * matrix[17] + o * matrix[18] + matrix[19];
            return {
                r: rUpdated,
                g: gUpdated,
                b: bUpdated,
                o: oUpdated
            };
        }
        const getElementComputedStyle = (element, propertyName) => {
            const getComputedStyle = defaultView.getComputedStyle(element, null);
            return getComputedStyle.getPropertyValue(propertyName);
        }
        const getBodyBackgroundColor = () => {
            const body = document.querySelector('body');
            const bodyBackgroundColor = getElementComputedStyle(body, 'background-color');
            let RGBBodyBackgroundColorObject = RGBStringToObject(bodyBackgroundColor);
            if (!RGBBodyBackgroundColorObject.o) {
                return {
                    r: 255,
                    g: 255,
                    b: 255,
                    o: 1
                };
            }
            return RGBBodyBackgroundColorObject;
        }
        const getAncestorsStackInfo = (element) => {
            const ancestors = [];
            for (; element && element.tagName.toLowerCase() !== 'body'; element = element.parentNode) {
                let elementInfoObject = element._wcc?._info;
                if (!elementInfoObject) {
                    const bgColor = RGBStringToObject(getElementComputedStyle(element, 'background-color'));
                    const opacity = parseFloat(getElementComputedStyle(element, 'opacity'));
                    elementInfoObject = {
                        bgColor,
                        opacity
                    };
                    element._wcc = {
                        '_info': elementInfoObject
                    };
                }
                const opacity = elementInfoObject.opacity;
                const alpha = elementInfoObject.bgColor.o * opacity;
                if (alpha > 0 || opacity < 1) {
                    ancestors.push(elementInfoObject);
                }
            }
            const bgColor = getBodyBackgroundColor();
            ancestors.push({
                bgColor,
                opacity: 1
            });
            return ancestors;
        }
        const getColorFromStack = (ancestors) => {
            let updated = ancestors[0].bgColor;
            updated.o = updated.o * ancestors[0].opacity
            for (let i = 1; i < ancestors.length; i++) {
                updated = flattenColors(updated, ancestors[i].bgColor);
                updated.o = ancestors[i].opacity;
            }
            return updated
        }
        const getOpacityFromStack = (stack) => {
            let opacity = 1;
            stack.forEach(element => {
                opacity = opacity * element.opacity;
            });
            return opacity;
        }
        const flattenColors = (fgColor, bgColor) => {
            const alpha = fgColor.o;
            if (alpha === 1) {
                return fgColor;
            }
            const r = (1 - alpha) * bgColor.r + alpha * fgColor.r;
            const g = (1 - alpha) * bgColor.g + alpha * fgColor.g;
            const b = (1 - alpha) * bgColor.b + alpha * fgColor.b;
            const o = fgColor.o + bgColor.o * (1 - fgColor.o);
            return {
                r,
                g,
                b,
                o
            };
        }
        const isValidHex = (hexToCheck) => {
            if (!hexToCheck || typeof hexToCheck !== 'string' || hexToCheck.indexOf('#') > 0) {
                return false;
            }
            hexToCheck = hexToCheck.replace('#', '');
            switch (hexToCheck.length) {
                case 3:
                    return /^[0-9A-F]{3}$/i.test(hexToCheck);
                case 6:
                    return /^[0-9A-F]{6}$/i.test(hexToCheck);
                case 8:
                    return /^[0-9A-F]{8}$/i.test(hexToCheck);
                default:
                    return false;
            }
        }
        const hexShorthandToExtended = (shorthandHex) => {
            const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            return shorthandHex.replace(shorthandRegex, function (m, r, g, b) {
                return '#' + r + r + g + g + b + b;
            });
        }
        const RGBStringToObject = (color) => {
            let separator;
            const plainParameters = color.replace('rgb(', '')
                .replace('rgba(', '')
                .replace('(', '')
                .replace(')', '')
                .replace(/ /g, '');
            if (plainParameters.indexOf(',') > -1) {
                separator = ',';
            } else if (plainParameters.indexOf(':') > -1) {
                separator = ':';
            } else if (plainParameters.indexOf('/') > -1) {
                separator = '/';
            } else if (plainParameters.indexOf('.') > -1) {
                separator = '.';
            }
            const rgbValues = plainParameters.split(separator);
            return {
                r: parseInt(rgbValues[0]),
                g: parseInt(rgbValues[1]),
                b: parseInt(rgbValues[2]),
                o: rgbValues[3] === undefined ? 1 : parseFloat(rgbValues[3])
            }
        }
        const decToHex = (positionInDecimalBase) => {
            if (positionInDecimalBase == null) {
                return '00';
            }
            let positionAsNumber = parseInt(positionInDecimalBase);
            if (isNaN(positionAsNumber)) {
                return '00';
            } else if (positionAsNumber <= 0) {
                return '00';
            } else if (positionAsNumber > 255) {
                return 'FF';
            }
            positionAsNumber = Math.round(positionAsNumber);
            const baseString = '0123456789ABCDEF';
            return baseString.charAt((positionAsNumber - positionAsNumber % 16) / 16) + baseString.charAt(positionAsNumber % 16);
        }
        const rgbObjectToString = (rgbObject) => {
            return 'rgb(' + rgbObject.r + ',' + rgbObject.g + ',' + rgbObject.b + ')';
        }
        const hexToRGB = (hex) => {
            hex = hexShorthandToExtended(hex);
            const rgbValue = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return rgbValue ? {
                r: parseInt(rgbValue[1], 16),
                g: parseInt(rgbValue[2], 16),
                b: parseInt(rgbValue[3], 16)
            } : null;
        }
        const rgbStringToHex = (RGBColorString) => {
            const RGBColor = RGBStringToObject(RGBColorString);
            return rgbToHex(RGBColor);
        }
        const rgbToHex = (RGBColor) => {
            return '#' + decToHex(RGBColor.r) + decToHex(RGBColor.g) + decToHex(RGBColor.b);
        }
        const element = document.querySelectorAll('body *');

        const isElementVisible = (element) => {
            if (!element._wcc) {
                element._wcc = {};
            }
            let isVisible = element._wcc._isVisible;
            if (isVisible === false) {
                return isVisible;
            }
            if (element.tagName.toLowerCase() === 'body') {
                return true;
            }
            const parentNode = element.parentNode;
            if (!parentNode._wcc) {
                parentNode._wcc = {};
            }
            const isParentVisible = parentNode._wcc._isVisible;
            if (isParentVisible === false) {
                element._wcc._isVisible = false;
                return isParentVisible;
            }
            const getComputedStyle = document.defaultView.getComputedStyle(element, null);
            isVisible = getComputedStyle.getPropertyValue('display') !== 'none' &&
                getComputedStyle.getPropertyValue('visibility') !== 'hidden' &&
                isVisibleByPosition(getComputedStyle);
            if (isVisible && isParentVisible) {
                element._wcc._isVisible = isVisible;
                return isVisible;
            }
            if (isVisible && parentNode.tagName.toLowerCase() !== 'body') {
                isVisible = isElementVisible(parentNode);
            }
            element._wcc._isVisible = isVisible;
            return isVisible;
        }
        return {
            singleEvaluation,
            getBodyBackgroundColor,
            evaluateColorContrastFromElement,
            isValidHex,
            hexShorthandToExtended,
            rgbToHex
        };

    };

    let results = {}, elementsReferences = {};
    const colorMatrix = {};
    const elementsToCheck = window.document.querySelectorAll('body *');
    const {
        getBodyBackgroundColor,
        evaluateColorContrastFromElement,
        rgbToHex
    } = colorService();
    elementsToCheck.forEach((element) => {
        element._wcc = {};
    });
    const getCurrentColorMatrix = () => {
        const currentColorMatrix = (currentBlindnessSimulation && currentBlindnessSimulation !== 'none') ? colorMatrix[currentBlindnessSimulation] : undefined;
        return currentColorMatrix;
    }
    const getInputValue = (input) => {
        return input.value;
    }

    const hasText = (element) => {
        return getChildText(element).trim().length > 0;
    }

    const getTextFromNode = (element) => {
        if (isTextNode(element)) {
            return element.nodeValue.replace("\"", "'").replace("\"", "'").replace("<", "&lt;").replace(">", "&gt;");
        }

        if (isElementWithAltText(element)) {
            return element.getAttribute('alt') || '';
        }

        return '';
    }

    const isTextNode = (node) => {
        return node.nodeType === 3;
    }

    const isCommentNode = (node) => {
        return node.nodeType === 8;
    }

    const isElementWithAltText = (element) => {
        if (isCommentNode(element)) {
            return false;
        }

        const tagName = element.tagName.toLowerCase();

        return ((tagName === 'img' || tagName === 'area') && element.getAttribute('alt')) || (tagName === 'input' && element.getAttribute('type') && element.getAttribute('type').toLowerCase() === 'image');
    }

    const getChildText = (element) => {
        if (isTextNode(element)) {
            return element.nodeValue.replace("\"", "'").replace("\"", "'").replace("<", "&lt;").replace(">", "&gt;");
        }

        if (isElementWithAltText(element)) {
            return element.getAttribute('alt') || '';
        }

        const childNodes = element.childNodes;
        let childNodesLength = childNodes.length;
        let text = '';
        for (let i = 0; i < childNodesLength; i++) {
            text += getTextFromNode(childNodes[i]);
        }

        return text.replace(/\n/g, ' ').replace(/\t/g, ' ').replace(/\s+/gi, ' ');
    }
    const isVisibleByPosition = (getComputedStyle) => {
        const position = getComputedStyle.getPropertyValue('position');
        const isPositioned = position === 'relative' || position === 'absolute';
        const top = getComputedStyle.getPropertyValue('top').replace('px', '');
        const left = getComputedStyle.getPropertyValue('left').replace('px', '');
        const zIndex = getComputedStyle.getPropertyValue('z-index');

        return !(isPositioned && ((top.indexOf('-') === 0 && parseInt(top) < -1000) || (left.indexOf('-') === 0 && parseInt(left) < -1000) || zIndex.indexOf('-') === 0));
    }
    const elementsToExclude = [
        'script', 'noscript', 'hr', 'br', 'table', 'tbody', 'thead', 'tfoot', 'tr',
        'option', 'ul', 'ol', 'dl', 'style', 'link', 'iframe', 'frameset', 'frame', 'object', 'meta', 'area', 'img',
        '[type=hidden]', '[type=color], .vc_single_image-wrapper'
    ];
    let targets = [];
    const checkAllElementsInDocument = () => {
        let results = {};
        let query = 'body *';

        elementsToExclude.forEach((element) => {
            query += ':not(' + element + ')';
        });

        const elementsToCheck = window.document.querySelectorAll(query);
        //sendMessageToBackgroundScript('getCurrentColorMatrix');

        let bodyBackgroundColor;

        // it can happen that there is no body (for instance, when there is frameset)
        try {
            bodyBackgroundColor = getBodyBackgroundColor();
        } catch (err) {
            bodyBackgroundColor = { r: 255, g: 255, b: 255, o: 1 }
        }

        let visibleCount = 0;
        let hiddenCount = 0;
        let currentColorMatrix;
        // elementsToCheck.forEach((element) => {
        //     element._wcc = {};
        // });

        elementsToCheck.forEach((element, i) => {
            if (!hasText(element) || getInputValue(element)) {
                return;
            }
            const {
                size,
                foregroundColor,
                backgroundColor,
                contrast,
                isVisible,
                isValidAA,
                isValidAAA
            } = evaluateColorContrastFromElement(element, currentColorMatrix, bodyBackgroundColor);
            const identifier = `"contrast":${contrast},"size":"${size}","foregroundColor":"${rgbToHex(foregroundColor)}","backgroundColor":"${rgbToHex(backgroundColor)}"`;
            //console.log(element,{identifier})

            if (!results[identifier]) {
                results[identifier] = { target: {}, elements: {}, validation: {}, colors: {} };
            }

            const tagName = element.tagName.toLowerCase() + (isVisible ? '.visible' : '.hidden');
            if (!results[identifier].elements[tagName]) {
                results[identifier].elements[tagName] = 0;
            }
            // if(element){
            //     results[identifier].target = {target:this};
            // }

            if (!elementsReferences[identifier]) {
                elementsReferences[identifier] = { [tagName]: [] }
            } else if (!elementsReferences[identifier][tagName]) {
                elementsReferences[identifier][tagName] = [];
            }

            if (elementsReferences[identifier][tagName].indexOf(element) === -1) {
                elementsReferences[identifier][tagName].push(element);
            }
            targets.push({ id: i, target: element, infos: identifier, visible: isVisible });
            //results[identifier].elements.target = this
            results[identifier].elements.id = i;
            results[identifier].elements[tagName]++;
            results[identifier].validation.isValidAA = isValidAA;
            results[identifier].validation.isValidAAA = isValidAAA;
            if (isVisible) {
                visibleCount++;
            } else {
                hiddenCount++;
            }
        });

        return {
            results: JSON.parse(JSON.stringify(results)),
            visibleCount,
            hiddenCount
        };
    }
    const seuilContraste = 4.5;
    const resultContrast = checkAllElementsInDocument();
    const verifierValidation = (elementValidation) => {
        // Vérifiez si isValidAA et isValidAAA sont à false
        if (elementValidation.isValidAA === false && elementValidation.isValidAAA === false) {
            return false;
        } else {
            return true;
        }
    }
    const filtrerParContraste = (objet, seuil) => {
        // Créez un tableau pour stocker les éléments filtrés
        const elementsFiltres = [];

        // Parcourez chaque clé de l'objet
        for (const cle in objet) {
            //console.log({cle});
            // const parseKey = JSON.parse(cle);
            // console.log({parseKey});
            const keyClean = JSON.parse(JSON.stringify(cle).replace(/'/g, ''));

            let arrayKey = [];
            arrayKey.push(keyClean);
            //console.log(keyClean);
            if (objet.hasOwnProperty(keyClean)) {
                const element = objet[cle];
                const elementValidation = element.validation;
                if (!verifierValidation(elementValidation)) {
                    elementsFiltres.push({ cle: cle, valeur: element });
                }
                //console.log({element},{elementValidation});
                const cleanElem = JSON.parse(JSON.stringify(element).replace(/`/g, ''));
                //console.log(cleanElem);
            }
        }

        return elementsFiltres;
    }
    // console.log(resultContrast);
    // console.log({targets})
    const elementsFiltres = filtrerParContraste(resultContrast.results, seuilContraste);

    // console.log({elementsFiltres});
    // Créez un tableau pour stocker les éléments filtrés

    // Associez les données de resultContrast et targets en utilisant leurs ID correspondants
    const parseInfos = (infos) => {
        const keyValuePairs = infos.split(',');

        const parsedInfos = {};

        keyValuePairs.forEach((keyValue) => {
            const [key, value] = keyValue.split(':');
            // Supprimez les guillemets et les espaces autour des clés et des valeurs
            const cleanedKey = key.trim().replace(/"/g, '');
            const cleanedValue = value.trim().replace(/"/g, '');

            // Ajoutez la paire clé-valeur à l'objet parsé
            parsedInfos[cleanedKey] = cleanedValue;
        });

        return parsedInfos;
    }

    // Associez les données de resultContrast et targets en utilisant leurs ID correspondants
    const associerDonnees = (resultContrast, targets) => {
        const elementsAssocies = [];

        // Parcourez les éléments de elementsFiltres
        elementsFiltres.forEach((elementFiltre) => {
            const cle = elementFiltre.cle;

            // Recherchez l'élément correspondant dans targets en utilisant l'ID
            const targetCorrespondant = targets.find((target) => {
                return target.infos === cle;
            });

            // Si un élément correspondant est trouvé, ajoutez-le à elementsAssocies
            if (targetCorrespondant) {
                const infosObjet = parseInfos(targetCorrespondant.infos);

                const elementAssocie = {
                    id: targetCorrespondant.id,
                    infos: infosObjet, // Utilisez l'objet analysé
                    target: targetCorrespondant.target,
                    validation: elementFiltre.valeur.validation
                };
                elementsAssocies.push(elementAssocie);
            }
        });

        return elementsAssocies;
    }

    const contrastWarning = associerDonnees(resultContrast, targets);

    const formatContrastWarningsForTable = (warnings) => {
        return warnings.map(warning => {
            const { id, infos, target, validation } = warning;

            return {
                'ID': id,
                'Taille': infos.size,
                'Contraste': infos.contrast,
                'Couleur Texte': infos.foregroundColor,
                'Couleur Fond': infos.backgroundColor,
                'Validité AA': validation.isValidAA ? '✓' : '✗',
                'Validité AAA': validation.isValidAAA ? '✓' : '✗',
                'Node': target
            };
        });
    };

    // Fonction principale d'affichage
    const displayContrastWarnings = (contrastWarning) => {
        console.group('Analyse de contraste des textes');
        if (contrastWarning.length === 0) {
            console.log('%c✓ Aucun problème de contraste détecté', 'color:green');
        } else {
            console.log(`%c⚠️⚠️⚠️ ${contrastWarning.length} problème(s) de contraste détecté(s)`, 'color: #FFA500; font-weight: bold;');

            // Affichage du tableau formaté
            const formattedWarnings = formatContrastWarningsForTable(contrastWarning);
            console.table(formattedWarnings);

            // Application des bordures
            formattedWarnings.forEach(warning => {
                if (warning.Node && warning.Node instanceof Element) {
                    warning.Node.style.border = 'dashed  1px red';
                }
            });

            // Affichage des recommandations
            console.log('\n%cRecommandations :', 'color:orange');
            console.log('%c- Le ratio de contraste minimum recommandé est de 4.5:1 pour le texte normal', 'color:orange');
            console.log('%c- Pour le texte large (>= 24px), le ratio minimum est de 3:1', 'color:orange');
        }
        console.groupEnd();
    };


    console.log(
        "----------------------------- Start Check contrast valitidy --------------------------------------------"
    );
    //contrastWarning.length && console.log('%c Attention vous avez des problèmes liés au contrast de vos textes', 'color:red');
    console.log({ contrastWarning });
    displayContrastWarnings(contrastWarning);


    // const lowContrast = resultContrast.results.forEach((c)=>console.log({c}));
    // console.log({resultContrast});
    console.log(
        "----------------------------- End Check contrast valitidy --------------------------------------------"
    );
})()