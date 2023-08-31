(()=>{
const colorService = function() {
    const largeFontSize = 24;
    const normalFontSize = 18.6667;
    const highThreshold = 7;
    const midThreshold = 4.5;
    const lowThreshold = 3;
    const defaultView = document.defaultView;
    const element = document.querySelectorAll('body *');

    const  isElementVisible=(element) => {
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
        //element._wcc._target = element;

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
    function singleEvaluation(foregroundColor, backgroundColor) {
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
    function getContrastRatio(foreground, background) {
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
    function getLuminosity(RGBAColor) {
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
    function linearisedColorComponent(colorSegment) {
        let linearised;
        if (colorSegment <= 0.03928) {
            linearised = colorSegment / 12.92;
        } else {
            linearised = Math.pow(((colorSegment + 0.055) / 1.055), 2.4);
        }
        return linearised;
    }
    function evaluateColorContrastFromElement(element, colorMatrix) {
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
    function getForegroundColor(element, stack) {
        const bgColor = RGBStringToObject(getElementComputedStyle(element, 'color'));
        const opacity = parseFloat(getElementComputedStyle(element, 'opacity'));
        return getColorFromStack([{
            bgColor,
            opacity
        }].concat(stack))
    }
    function applyMatrixToColor(color, matrix) {
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
    function getElementComputedStyle(element, propertyName) {
        const getComputedStyle = defaultView.getComputedStyle(element, null);
        return getComputedStyle.getPropertyValue(propertyName);
    }
    function getBodyBackgroundColor() {
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
    function getAncestorsStackInfo(element) {
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
    function getColorFromStack(ancestors) {
        let updated = ancestors[0].bgColor;
        updated.o = updated.o * ancestors[0].opacity
        for (let i = 1; i < ancestors.length; i++) {
            updated = flattenColors(updated, ancestors[i].bgColor);
            updated.o = ancestors[i].opacity;
        }
        return updated
    }
    function getOpacityFromStack(stack) {
        let opacity = 1;
        stack.forEach(element => {
            opacity = opacity * element.opacity;
        });
        return opacity;
    }
    function flattenColors(fgColor, bgColor) {
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
    function isValidHex(hexToCheck) {
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
    function hexShorthandToExtended(shorthandHex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        return shorthandHex.replace(shorthandRegex, function(m, r, g, b) {
            return '#' + r + r + g + g + b + b;
        });
    }
    function RGBStringToObject(color) {
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
    function decToHex(positionInDecimalBase) {
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
    function rgbObjectToString(rgbObject) {
        return 'rgb(' + rgbObject.r + ',' + rgbObject.g + ',' + rgbObject.b + ')';
    }
    function hexToRGB(hex) {
        hex = hexShorthandToExtended(hex);
        const rgbValue = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return rgbValue ? {
            r: parseInt(rgbValue[1], 16),
            g: parseInt(rgbValue[2], 16),
            b: parseInt(rgbValue[3], 16)
        } : null;
    }
    function rgbStringToHex(RGBColorString) {
        const RGBColor = RGBStringToObject(RGBColorString);
        return rgbToHex(RGBColor);
    }
    function rgbToHex(RGBColor) {
        return '#' + decToHex(RGBColor.r) + decToHex(RGBColor.g) + decToHex(RGBColor.b);
    }
};

let results = {},elementsReferences = {};
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
function getCurrentColorMatrix() {
    const currentColorMatrix = (currentBlindnessSimulation && currentBlindnessSimulation !== 'none') ? colorMatrix[currentBlindnessSimulation] : undefined;
    return currentColorMatrix;
}
function getInputValue(input) {
    return input.value;
}

function hasText(element) {
    return getChildText(element).trim().length > 0;
}

function getTextFromNode(element) {
    if (isTextNode(element)) {
        return element.nodeValue.replace("\"", "'").replace("\"", "'").replace("<", "&lt;").replace(">", "&gt;");
    }

    if (isElementWithAltText(element)) {
        return element.getAttribute('alt') || '';
    }

    return '';
}

function isTextNode(node) {
    return node.nodeType === 3;
}

function isCommentNode(node) {
    return node.nodeType === 8;
}

function isElementWithAltText(element) {
    if (isCommentNode(element)) {
        return false;
    }

    const tagName = element.tagName.toLowerCase();

    return ((tagName === 'img' || tagName === 'area') && element.getAttribute('alt')) || (tagName === 'input' && element.getAttribute('type') && element.getAttribute('type').toLowerCase() === 'image');
}

function getChildText(element) {
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
function isVisibleByPosition(getComputedStyle) {
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
    '[type=hidden]', '[type=color]'
];
let targets = [];
function checkAllElementsInDocument() {
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
        bodyBackgroundColor = {r: 255, g: 255, b: 255, o: 1}
    }

    let visibleCount = 0;
    let hiddenCount = 0;
    let currentColorMatrix;
    // elementsToCheck.forEach((element) => {
    //     element._wcc = {};
    // });
   
    elementsToCheck.forEach((element,i) => {
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
            results[identifier] = {target:{}, elements: {}, validation: {}, colors: {}};
        }

        const tagName = element.tagName.toLowerCase() + (isVisible ? '.visible' : '.hidden');
        if (!results[identifier].elements[tagName]) {
            results[identifier].elements[tagName] = 0;
        }
        // if(element){
        //     results[identifier].target = {target:this};
        // }

        if (!elementsReferences[identifier]) {
            elementsReferences[identifier] = {[tagName]: []}
        } else if (!elementsReferences[identifier][tagName]) {
            elementsReferences[identifier][tagName] = [];
        }

        if (elementsReferences[identifier][tagName].indexOf(element) === -1) {
            elementsReferences[identifier][tagName].push(element);
        }
        targets.push({id:i,target:element,infos:identifier});
        //results[identifier].elements.target = this
        results[identifier].elements.id = i;
        results[identifier].elements[tagName]++;
        results[identifier].validation.isValidAA = isValidAA;
        results[identifier].validation.isValidAAA = isValidAAA;
        if(isVisible) {
            visibleCount++;
        }else{
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
function verifierValidation(elementValidation) {
  // Vérifiez si isValidAA et isValidAAA sont à false
  if (elementValidation.isValidAA === false && elementValidation.isValidAAA === false) {
    return false;
  } else {
    return true;
  }
}
function filtrerParContraste(objet, seuil) {
  // Créez un tableau pour stocker les éléments filtrés
  const elementsFiltres = [];

  // Parcourez chaque clé de l'objet
  for (const cle in objet) {
      console.log({cle});
      // const parseKey = JSON.parse(cle);
      // console.log({parseKey});
      const keyClean = JSON.parse(JSON.stringify(cle).replace(/'/g,''));
     
      let arrayKey = [];
      arrayKey.push(keyClean);
       console.log(keyClean);
    if (objet.hasOwnProperty(keyClean)) {
      const element = objet[cle];
        const elementValidation = element.validation;
        if(!verifierValidation(elementValidation)){
            elementsFiltres.push({ cle: cle, valeur: element });
        }
        console.log({element},{elementValidation});
        const cleanElem = JSON.parse(JSON.stringify(element).replace(/`/g,''));
        console.log(cleanElem);
    }
  }

  return elementsFiltres;
}
console.log(resultContrast);
console.log({targets})
const elementsFiltres = filtrerParContraste(resultContrast.results, seuilContraste);

console.log({elementsFiltres});
// Créez un tableau pour stocker les éléments filtrés

// Associez les données de resultContrast et targets en utilisant leurs ID correspondants
function parseInfos(infos) {
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

// ...

// Associez les données de resultContrast et targets en utilisant leurs ID correspondants
function associerDonnees(resultContrast, targets) {
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

// Utilisez la fonction pour associer les données
const elementsAssocies = associerDonnees(resultContrast, targets);

console.log(
    "----------------------------- Start Check contrast valitidy --------------------------------------------"
  );
  elementsAssocies.length && console.log('%c Attention vous avez des problèmes liésau contrast de vos textes','color:red');
console.log({elementsAssocies});
 // const lowContrast = resultContrast.results.forEach((c)=>console.log({c}));
 // console.log({resultContrast});
 console.log(
    "----------------------------- End Check contrast valitidy --------------------------------------------"
  );
 })()