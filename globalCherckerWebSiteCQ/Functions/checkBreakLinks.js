/**
 * CheckBrokenLinks - Détection complète des problèmes de liens
 * Combine la détection des liens coupés ET des liens consécutifs identiques
 * Version unifiée - Février 2026
 */

(function () {
    'use strict';

    // Configuration globale
    const CONFIG = {
        checkOnLoad: true,
        autoHighlight: true,
        showFixedMessage: true,
        messagePosition: 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
        highlightColor: {
            brokenLink: '#ff0000',      // Rouge pour liens coupés
            duplicateLink: '#ff6600'     // Orange pour liens consécutifs
        },
        containers: ['div.dmNewParagraph', '.wpb_text_column', 'p', 'div'], // Conteneurs à analyser
        debugMode: false // Activer pour voir les logs détaillés
    };

    let allProblems = {
        brokenLinks: [],
        duplicateLinks: [],
        total: 0
    };

    // ============================================
    // PARTIE 1 : DÉTECTION DES LIENS COUPÉS
    // ============================================

    /**
     * Détecte les liens qui pourraient être "coupés"
     * (ex: "grande" + lien "hauteur" au lieu de "grande hauteur")
     */
    function detectBrokenLinks() {
        if (CONFIG.debugMode) console.log("%c[Broken Links] Début de la vérification...", "color:blue; font-weight:bold");

        const problems = [];
        const processedLinks = new Set();

        const containers = document.querySelectorAll(CONFIG.containers.join(', '));

        containers.forEach((container) => {
            const links = container.querySelectorAll('a');
            if (links.length === 0) return;

            links.forEach((link) => {
                if (processedLinks.has(link)) return;
                processedLinks.add(link);

                // Vérifier que le lien est dans un conteneur valide
                if (!isInValidContainer(link)) {
                    return;
                }

                const linkText = link.textContent.trim();
                if (!linkText || link.querySelector('img')) return;

                let previousTextContent = "";
                let previousNode = link.previousSibling;

                if (previousNode) {
                    if (previousNode.nodeType === Node.TEXT_NODE) {
                        previousTextContent = previousNode.textContent;
                    } else if (previousNode.nodeType === Node.ELEMENT_NODE) {
                        previousTextContent = previousNode.textContent;
                    }
                }

                if (!previousTextContent) return;

                const lastCharBefore = previousTextContent.slice(-1);
                const noSpaceBefore = previousTextContent.length > 0 && !/\s$/.test(previousTextContent);

                const isPotentiallyBrokenChar = /[a-zàáâäãåçèéêëìíîïñòóôöõùúûüÿA-ZÀÁÂÄÃÅÇÈÉÊËÌÍÎÏÑÒÓÔÖÕÙÚÛÜŸ0-9]/.test(lastCharBefore);
                const firstCharLink = linkText.charAt(0);
                const firstCharIsAlphanum = /[a-zàáâäãåçèéêëìíîïñòóôöõùúûüÿA-ZÀÁÂÄÃÅÇÈÉÊËÌÍÎÏÑÒÓÔÖÕÙÚÛÜŸ0-9]/.test(firstCharLink);

                const allowedPunctuation = ['"', "'", '(', '[', '{', '«', '.', ':', ';', ',', '/', '\\'];
                const ignoredPrefixes = new Set(['m', 'km', 'cm', 'mm', 'kg', 'g', 'l', 'ml', 'h', 'min', 'sec', 'no', 'n°']);

                if (noSpaceBefore && isPotentiallyBrokenChar && firstCharIsAlphanum) {
                    if (!allowedPunctuation.includes(lastCharBefore)) {
                        const wordsBefore = previousTextContent.trimRight().split(/\s+/);
                        const lastWordBefore = wordsBefore.length > 0 ? wordsBefore[wordsBefore.length - 1] : '';

                        let ignorePrefix = false;
                        if (ignoredPrefixes.has(lastWordBefore.toLowerCase())) {
                            if (lastWordBefore.length > 1) {
                                ignorePrefix = true;
                            } else if (lastWordBefore.length === 1 && lastCharBefore.toLowerCase() === lastWordBefore.toLowerCase()) {
                                ignorePrefix = true;
                            }
                        }

                        if (!ignorePrefix) {
                            const containerText = container.textContent.substring(0, 200);
                            const linkPosInContainer = container.textContent.indexOf(linkText);
                            const contextBefore = linkPosInContainer > 0
                                ? container.textContent.substring(Math.max(0, linkPosInContainer - 30), linkPosInContainer)
                                : previousTextContent.slice(-30);

                            problems.push({
                                type: 'broken_link',
                                link: link,
                                linkText: linkText,
                                previousText: previousTextContent,
                                missingChar: lastCharBefore,
                                suggestedText: lastCharBefore + linkText,
                                contextBefore: contextBefore,
                                container: container,
                                containerPath: getElementPath(container)
                            });

                            if (CONFIG.debugMode) {
                                console.log("%c[Broken Link] Détecté:", "color:red; font-weight:bold");
                                console.log(`  Texte: "${linkText}"`);
                                console.log(`  Précédent: "${previousTextContent.slice(-20)}"`);
                                console.log(`  Suggestion: "${lastCharBefore + linkText}"`);
                            }
                        }
                    }
                }
            });
        });

        return problems;
    }

    // ============================================
    // PARTIE 2 : DÉTECTION DES LIENS CONSÉCUTIFS IDENTIQUES
    // ============================================

    /**
     * Vérifie si un élément est contenu dans un conteneur valide
     * (.wpb_text_column ou .dmNewParagraph)
     */
    function isInValidContainer(element) {
        let current = element;
        while (current && current !== document.body) {
            if (current.classList &&
                (current.classList.contains('wpb_text_column') ||
                    current.classList.contains('dmNewParagraph'))) {
                return true;
            }
            current = current.parentElement;
        }
        return false;
    }

    /**
     * Détecte les liens consécutifs avec le même href
     */
    function detectDuplicateConsecutiveLinks() {
        if (CONFIG.debugMode) console.log("%c[Duplicate Links] Début de la vérification...", "color:blue; font-weight:bold");

        const allLinks = Array.from(document.querySelectorAll('a[href]'));

        // D'ABORD filtrer pour ne garder que les liens dans des conteneurs valides
        const validLinks = allLinks.filter(link => isInValidContainer(link));

        if (CONFIG.debugMode) {
            console.log(`  Total de liens: ${allLinks.length}`);
            console.log(`  Liens valides (dans .wpb_text_column ou .dmNewParagraph): ${validLinks.length}`);
        }

        const problems = [];

        for (let i = 0; i < validLinks.length - 1; i++) {
            const currentLink = validLinks[i];
            const nextLink = validLinks[i + 1];

            if (areConsecutiveInDOM(currentLink, nextLink)) {
                const currentHref = normalizeUrl(currentLink.getAttribute('href'));
                const nextHref = normalizeUrl(nextLink.getAttribute('href'));

                if (currentHref && nextHref && currentHref === nextHref) {
                    const existingProblem = problems.find(p =>
                        p.links.includes(currentLink) || p.links.includes(nextLink)
                    );

                    if (existingProblem) {
                        if (!existingProblem.links.includes(nextLink)) {
                            existingProblem.links.push(nextLink);
                        }
                    } else {
                        problems.push({
                            type: 'duplicate_consecutive',
                            href: currentHref,
                            links: [currentLink, nextLink],
                            container: findCommonAncestor(currentLink, nextLink)
                        });

                        if (CONFIG.debugMode) {
                            console.log("%c[Duplicate Links] Détecté:", "color:orange; font-weight:bold");
                            console.log(`  Href: "${currentHref}"`);
                            console.log(`  Nombre: 2 liens consécutifs`);
                        }
                    }
                }
            }
        }

        return problems;
    }

    /**
     * Vérifie si deux éléments sont consécutifs dans le DOM
     * Traverse les nœuds en profondeur pour détecter les liens séparés par des balises vides
     */
    function areConsecutiveInDOM(elem1, elem2) {
        // Trouver un conteneur commun (paragraphe, div, etc.)
        const commonAncestor = findCommonAncestor(elem1, elem2);
        if (!commonAncestor) {
            if (CONFIG.debugMode) console.log('  ❌ Pas d\'ancêtre commun');
            return false;
        }

        if (CONFIG.debugMode) {
            console.log(`  Ancêtre commun: ${commonAncestor.tagName}.${Array.from(commonAncestor.classList || []).join('.')}`);
        }

        // Fonction récursive pour obtenir le prochain nœud en parcourant l'arbre DOM
        function getNextNode(node, root) {
            // D'abord chercher le frère suivant
            if (node.nextSibling) {
                return node.nextSibling;
            }

            // Sinon remonter et chercher le frère du parent
            let current = node.parentNode;
            while (current && current !== root) {
                if (current.nextSibling) {
                    return current.nextSibling;
                }
                current = current.parentNode;
            }

            return null;
        }

        // Parcourir depuis elem1 jusqu'à trouver elem2
        let currentNode = getNextNode(elem1, commonAncestor);
        let stepCount = 0;

        while (currentNode && currentNode !== elem2 && stepCount < 100) {
            stepCount++;

            if (CONFIG.debugMode) {
                const nodeDesc = currentNode.nodeType === Node.TEXT_NODE
                    ? `TEXT: "${currentNode.textContent.substring(0, 30)}"`
                    : `${currentNode.tagName || 'NODE'}`;
                console.log(`    Step ${stepCount}: ${nodeDesc}`);
            }

            // Si on trouve un élément, vérifier s'il contient elem2
            if (currentNode.nodeType === Node.ELEMENT_NODE) {
                if (currentNode === elem2) {
                    break;
                }
                if (currentNode.contains(elem2)) {
                    // elem2 est à l'intérieur, descendre
                    currentNode = currentNode.firstChild || getNextNode(currentNode, commonAncestor);
                    continue;
                }
                // Si c'est un autre élément avec du contenu textuel, ils ne sont pas consécutifs
                if (currentNode.textContent.trim().length > 0) {
                    if (CONFIG.debugMode) console.log('  ❌ Élément avec contenu entre les deux');
                    return false;
                }
            }

            // Si on trouve du texte non-blanc entre les deux liens, ils ne sont pas consécutifs
            if (currentNode.nodeType === Node.TEXT_NODE && currentNode.textContent.trim().length > 0) {
                if (CONFIG.debugMode) console.log(`  ❌ Texte non vide entre: "${currentNode.textContent.trim()}"`);
                return false;
            }

            currentNode = getNextNode(currentNode, commonAncestor);
        }

        const result = currentNode === elem2;
        if (CONFIG.debugMode) {
            console.log(`  ${result ? '✅' : '❌'} Consécutifs: ${result}`);
        }
        return result;
    }

    /**
     * Trouve l'ancêtre commun le plus proche de deux éléments
     */
    function findCommonAncestor(elem1, elem2) {
        const parents1 = [];
        let current = elem1;
        while (current) {
            parents1.push(current);
            current = current.parentNode;
        }

        current = elem2;
        while (current) {
            if (parents1.includes(current)) {
                return current;
            }
            current = current.parentNode;
        }

        return null;
    }

    /**
     * Normalise une URL pour la comparaison
     */
    function normalizeUrl(url) {
        if (!url) return '';
        let normalized = url.split('?')[0];
        return normalized.trim().toLowerCase();
    }

    // ============================================
    // PARTIE 3 : AFFICHAGE ET SURLIGNAGE
    // ============================================

    /**
     * Applique le surlignage visuel à tous les problèmes
     */
    function highlightAllProblems() {
        // Nettoyer les anciens surlignages
        clearHighlights();

        // Surligner les liens coupés
        allProblems.brokenLinks.forEach((problem, index) => {
            highlightBrokenLink(problem, index);
        });

        // Surligner les liens consécutifs
        allProblems.duplicateLinks.forEach((problem, index) => {
            highlightDuplicateLinks(problem, index);
        });

        // Afficher le message récapitulatif
        if (CONFIG.showFixedMessage && allProblems.total > 0) {
            showSummaryMessage();
        }
    }

    /**
     * Surligne un lien coupé
     */
    function highlightBrokenLink(problem, index) {
        const link = problem.link;

        // Appliquer les styles inline directement
        link.style.cssText += `
            background-color: rgba(255, 0, 0, 0.15) !important;
            outline: 2px solid ${CONFIG.highlightColor.brokenLink} !important;
            outline-offset: 2px !important;
            padding: 2px 4px !important;
            border-radius: 3px !important;
        `;

        link.classList.add('broken-link-highlight');
        link.setAttribute('data-problem-type', 'broken');
        link.setAttribute('data-problem-index', index);

        // Créer l'infobulle avec styles inline
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            background: white;
            border: 2px solid #ddd;
            border-radius: 6px;
            padding: 0;
            margin-top: 8px;
            font-size: 12px;
            z-index: 10000;
            min-width: 300px;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            display: none;
            color: #333;
            text-align: left;
            line-height: 1.5;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;

        const tooltipHeader = document.createElement('div');
        tooltipHeader.style.cssText = `
            padding: 10px 12px;
            font-weight: bold;
            border-bottom: 2px solid #cc4a4a;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
            color: white;
            display: flex;
            align-items: center;
            gap: 6px;
            border-radius: 4px 4px 0 0;
        `;
        tooltipHeader.textContent = `⚠️ Lien coupé #${index + 1}`;

        const tooltipBody = document.createElement('div');
        tooltipBody.style.cssText = `
            padding: 12px;
            line-height: 1.8;
        `;
        tooltipBody.innerHTML = `
            <strong style="color: #555;">Texte actuel:</strong> "${escapeHtml(problem.linkText)}"<br>
            <strong style="color: #555;">Précédent:</strong> "${escapeHtml(problem.previousText.slice(-20))}"<br>
            <strong style="color: #555;">Caractère manquant:</strong> "<span style="background: #ffeb3b; padding: 2px 4px; border-radius: 2px; font-weight: bold; color: #d32f2f;">${escapeHtml(problem.missingChar)}</span>"<br>
            <strong style="color: #555;">✓ Suggestion:</strong> "<span style="color: #2e7d32; font-weight: 600;">${escapeHtml(problem.suggestedText)}</span>"
        `;

        tooltip.appendChild(tooltipHeader);
        tooltip.appendChild(tooltipBody);

        // Gérer l'affichage au survol
        link.addEventListener('mouseenter', () => {
            tooltip.style.display = 'block';
        });
        link.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });

        const currentPosition = window.getComputedStyle(link).position;
        if (currentPosition === 'static') {
            link.dataset.originalPosition = 'static';
            link.style.position = 'relative';
        }

        link.appendChild(tooltip);
    }

    /**
     * Surligne des liens consécutifs identiques
     */
    function highlightDuplicateLinks(problem, index) {
        problem.links.forEach((link, linkIndex) => {
            // Appliquer les styles inline directement
            link.style.cssText += `
                background-color: rgba(255, 102, 0, 0.15) !important;
                outline: 2px solid ${CONFIG.highlightColor.duplicateLink} !important;
                outline-offset: 2px !important;
                padding: 2px 4px !important;
                border-radius: 3px !important;
            `;

            link.classList.add('duplicate-link-highlight');
            link.setAttribute('data-problem-type', 'duplicate');
            link.setAttribute('data-problem-index', index);
            link.setAttribute('data-link-index', linkIndex);

            // Créer l'infobulle avec styles inline
            const tooltip = document.createElement('div');
            tooltip.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                background: white;
                border: 2px solid #ddd;
                border-radius: 6px;
                padding: 0;
                margin-top: 8px;
                font-size: 12px;
                z-index: 10000;
                min-width: 300px;
                max-width: 400px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                display: none;
                color: #333;
                text-align: left;
                line-height: 1.5;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            `;

            const tooltipHeader = document.createElement('div');
            tooltipHeader.style.cssText = `
                padding: 10px 12px;
                font-weight: bold;
                border-bottom: 2px solid #cc5200;
                background: linear-gradient(135deg, #ff9966 0%, #ff6600 100%);
                color: white;
                display: flex;
                align-items: center;
                gap: 6px;
                border-radius: 4px 4px 0 0;
            `;
            tooltipHeader.textContent = `🔗 Liens consécutifs #${index + 1}`;

            const tooltipBody = document.createElement('div');
            tooltipBody.style.cssText = `
                padding: 12px;
                line-height: 1.8;
            `;
            tooltipBody.innerHTML = `
                <strong style="color: #555;">Lien ${linkIndex + 1}/${problem.links.length}</strong><br>
                <strong style="color: #555;">URL:</strong> <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 11px; color: #666;">${escapeHtml(problem.href)}</code><br>
                <strong style="color: #555;">⚠️ Problème:</strong> ${problem.links.length} liens identiques consécutifs<br>
                <strong style="color: #555;">✓ Solution:</strong> Fusionner en un seul lien
            `;

            tooltip.appendChild(tooltipHeader);
            tooltip.appendChild(tooltipBody);

            // Gérer l'affichage au survol
            link.addEventListener('mouseenter', () => {
                tooltip.style.display = 'block';
            });
            link.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });

            const currentPosition = window.getComputedStyle(link).position;
            if (currentPosition === 'static') {
                link.dataset.originalPosition = 'static';
                link.style.position = 'relative';
            }

            link.appendChild(tooltip);
        });
    }

    /**
     * Affiche le message récapitulatif fixe avec styles inline
     */
    function showSummaryMessage() {
        const existingMessage = document.getElementById('link-problems-summary');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageBox = document.createElement('div');
        messageBox.id = 'link-problems-summary';
        messageBox.style.cssText = getMessageBoxStyle();

        // En-tête
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 20px;
            font-weight: bold;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        header.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <span>Problèmes de liens détectés</span>
        `;
        messageBox.appendChild(header);

        // Compteurs
        const counters = document.createElement('div');
        counters.style.cssText = `
            display: flex;
            gap: 15px;
            padding: 15px 20px;
            background: #f8f9fa;
            border-bottom: 2px solid #e9ecef;
        `;

        const brokenCounter = document.createElement('div');
        brokenCounter.style.cssText = `
            flex: 1;
            text-align: center;
            padding: 12px;
            border-radius: 8px;
            background: white;
            border: 2px solid ${CONFIG.highlightColor.brokenLink};
        `;
        brokenCounter.innerHTML = `
            <span style="display: block; font-size: 28px; font-weight: bold; line-height: 1; margin-bottom: 5px; color: ${CONFIG.highlightColor.brokenLink};">${allProblems.brokenLinks.length}</span>
            <span style="display: block; font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Liens coupés</span>
        `;

        const duplicateCounter = document.createElement('div');
        duplicateCounter.style.cssText = `
            flex: 1;
            text-align: center;
            padding: 12px;
            border-radius: 8px;
            background: white;
            border: 2px solid ${CONFIG.highlightColor.duplicateLink};
        `;
        duplicateCounter.innerHTML = `
            <span style="display: block; font-size: 28px; font-weight: bold; line-height: 1; margin-bottom: 5px; color: ${CONFIG.highlightColor.duplicateLink};">${allProblems.duplicateLinks.length}</span>
            <span style="display: block; font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Groupes consécutifs</span>
        `;

        counters.appendChild(brokenCounter);
        counters.appendChild(duplicateCounter);
        messageBox.appendChild(counters);

        // Liste des problèmes
        const problemsList = document.createElement('div');
        problemsList.style.cssText = `
            padding: 15px 20px;
            overflow-y: auto;
            max-height: 50vh;
        `;

        // Liens coupés
        if (allProblems.brokenLinks.length > 0) {
            const brokenSection = document.createElement('div');
            brokenSection.style.cssText = 'margin-bottom: 20px;';

            const brokenTitle = document.createElement('div');
            brokenTitle.style.cssText = `
                font-weight: bold;
                font-size: 13px;
                margin-bottom: 10px;
                padding: 8px 10px;
                border-radius: 5px;
                display: flex;
                align-items: center;
                gap: 6px;
                background: rgba(255, 0, 0, 0.1);
                color: ${CONFIG.highlightColor.brokenLink};
            `;
            brokenTitle.textContent = '⚠️ Liens coupés:';
            brokenSection.appendChild(brokenTitle);

            const brokenList = document.createElement('ul');
            brokenList.style.cssText = 'list-style: none; margin: 0; padding: 0;';

            allProblems.brokenLinks.forEach((problem, index) => {
                const item = document.createElement('li');
                item.style.cssText = `
                    padding: 10px 12px;
                    margin-bottom: 6px;
                    background: #f8f9fa;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 12px;
                    border-left: 3px solid transparent;
                `;
                item.innerHTML = `
                    <span style="display: inline-block; background: #667eea; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; margin-right: 8px;">#${index + 1}</span>
                    "<strong>${escapeHtml(problem.linkText)}</strong>"
                    <span style="color: #667eea; font-weight: bold; margin: 0 5px;">→</span>
                    "<span style="color: #2e7d32; font-weight: 600;">${escapeHtml(problem.suggestedText)}</span>"
                `;

                item.addEventListener('click', () => scrollToElement(problem.link));
                item.addEventListener('mouseenter', () => {
                    item.style.background = '#e9ecef';
                    item.style.borderLeftColor = '#667eea';
                    item.style.transform = 'translateX(3px)';
                });
                item.addEventListener('mouseleave', () => {
                    item.style.background = '#f8f9fa';
                    item.style.borderLeftColor = 'transparent';
                    item.style.transform = '';
                });

                brokenList.appendChild(item);
            });

            brokenSection.appendChild(brokenList);
            problemsList.appendChild(brokenSection);
        }

        // Liens consécutifs
        if (allProblems.duplicateLinks.length > 0) {
            const duplicateSection = document.createElement('div');
            duplicateSection.style.cssText = 'margin-bottom: 0;';

            const duplicateTitle = document.createElement('div');
            duplicateTitle.style.cssText = `
                font-weight: bold;
                font-size: 13px;
                margin-bottom: 10px;
                padding: 8px 10px;
                border-radius: 5px;
                display: flex;
                align-items: center;
                gap: 6px;
                background: rgba(255, 102, 0, 0.1);
                color: ${CONFIG.highlightColor.duplicateLink};
            `;
            duplicateTitle.textContent = '🔗 Liens consécutifs:';
            duplicateSection.appendChild(duplicateTitle);

            const duplicateList = document.createElement('ul');
            duplicateList.style.cssText = 'list-style: none; margin: 0; padding: 0;';

            allProblems.duplicateLinks.forEach((problem, index) => {
                const item = document.createElement('li');
                item.style.cssText = `
                    padding: 10px 12px;
                    margin-bottom: 6px;
                    background: #f8f9fa;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 12px;
                    border-left: 3px solid transparent;
                `;
                item.innerHTML = `
                    <span style="display: inline-block; background: #667eea; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; margin-right: 8px;">#${index + 1}</span>
                    <strong>${problem.links.length} liens</strong> vers
                    <code style="background: #dee2e6; padding: 2px 6px; border-radius: 3px; font-size: 11px; color: #495057;">${escapeHtml(problem.href.substring(0, 40))}${problem.href.length > 40 ? '...' : ''}</code>
                `;

                item.addEventListener('click', () => scrollToElement(problem.links[0]));
                item.addEventListener('mouseenter', () => {
                    item.style.background = '#e9ecef';
                    item.style.borderLeftColor = '#667eea';
                    item.style.transform = 'translateX(3px)';
                });
                item.addEventListener('mouseleave', () => {
                    item.style.background = '#f8f9fa';
                    item.style.borderLeftColor = 'transparent';
                    item.style.transform = '';
                });

                duplicateList.appendChild(item);
            });

            duplicateSection.appendChild(duplicateList);
            problemsList.appendChild(duplicateSection);
        }

        messageBox.appendChild(problemsList);

        // Bouton fermer
        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = `
            position: absolute;
            top: 14px;
            right: 16px;
            background: rgba(255, 255, 255, 0.3);
            border: none;
            color: white;
            font-size: 24px;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            line-height: 1;
        `;
        closeBtn.innerHTML = '✕';
        closeBtn.addEventListener('click', () => messageBox.remove());
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(255, 255, 255, 0.5)';
            closeBtn.style.transform = 'rotate(90deg)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
            closeBtn.style.transform = '';
        });
        messageBox.appendChild(closeBtn);

        document.body.appendChild(messageBox);
    }

    /**
     * Scroll vers un élément avec effet flash inline
     */
    function scrollToElement(element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Créer un effet flash sans animation CSS
        const originalBoxShadow = element.style.boxShadow;
        let opacity = 0.5;
        const interval = setInterval(() => {
            opacity -= 0.05;
            if (opacity <= 0) {
                element.style.boxShadow = originalBoxShadow;
                clearInterval(interval);
            } else {
                element.style.boxShadow = `0 0 0 10px rgba(102, 126, 234, ${opacity})`;
            }
        }, 50);
    }

    /**
     * Retourne le style CSS inline pour le message box selon la position
     */
    function getMessageBoxStyle() {
        const baseStyle = `
            position: fixed;
            z-index: 999999;
            background: white;
            border: 3px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 450px;
            max-height: 80vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        `;

        const positions = {
            'top-right': 'top: 20px; right: 20px;',
            'top-left': 'top: 20px; left: 20px;',
            'bottom-right': 'bottom: 20px; right: 20px;',
            'bottom-left': 'bottom: 20px; left: 20px;'
        };

        return baseStyle + (positions[CONFIG.messagePosition] || positions['top-right']);
    }

    /**
     * Nettoie tous les surlignages et styles inline
     */
    function clearHighlights() {
        // Nettoyer les liens coupés
        document.querySelectorAll('.broken-link-highlight').forEach(link => {
            link.classList.remove('broken-link-highlight');

            // Supprimer la tooltip
            const tooltip = link.querySelector('div[style*="position: absolute"]');
            if (tooltip) tooltip.remove();

            // Réinitialiser les styles inline
            const stylesToRemove = [
                'background-color', 'outline', 'outline-offset',
                'padding', 'border-radius', 'position'
            ];
            stylesToRemove.forEach(prop => link.style.removeProperty(prop));

            if (link.dataset.originalPosition) {
                link.style.position = link.dataset.originalPosition;
                delete link.dataset.originalPosition;
            }

            // Supprimer les event listeners en clonant l'élément
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);

            link.removeAttribute('data-problem-type');
            link.removeAttribute('data-problem-index');
        });

        // Nettoyer les liens consécutifs
        document.querySelectorAll('.duplicate-link-highlight').forEach(link => {
            link.classList.remove('duplicate-link-highlight');

            // Supprimer la tooltip
            const tooltip = link.querySelector('div[style*="position: absolute"]');
            if (tooltip) tooltip.remove();

            // Réinitialiser les styles inline
            const stylesToRemove = [
                'background-color', 'outline', 'outline-offset',
                'padding', 'border-radius', 'position'
            ];
            stylesToRemove.forEach(prop => link.style.removeProperty(prop));

            if (link.dataset.originalPosition) {
                link.style.position = link.dataset.originalPosition;
                delete link.dataset.originalPosition;
            }

            // Supprimer les event listeners en clonant l'élément
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);

            link.removeAttribute('data-problem-type');
            link.removeAttribute('data-problem-index');
            link.removeAttribute('data-link-index');
        });

        // Supprimer le message récapitulatif
        const summary = document.getElementById('link-problems-summary');
        if (summary) summary.remove();

    }

    // ============================================
    // PARTIE 4 : UTILITAIRES
    // ============================================

    /**
     * Obtient le chemin HTML d'un élément
     */
    function getElementPath(element) {
        const path = [];
        let current = element;

        while (current && current.tagName && current.tagName.toLowerCase() !== 'body') {
            let selector = current.tagName.toLowerCase();

            if (current.id) {
                selector += '#' + current.id;
                path.unshift(selector);
                break;
            } else {
                const classes = Array.from(current.classList).slice(0, 2).join('.');
                if (classes) selector += '.' + classes;
            }

            path.unshift(selector);
            current = current.parentNode;
        }

        return path.join(' > ');
    }

    /**
     * Échappe les caractères HTML
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============================================
    // PARTIE 5 : FONCTIONS PRINCIPALES
    // ============================================

    /**
     * Lance toutes les vérifications
     */
    function checkAllLinks() {
        console.log('%c🔍 CheckBrokenLinks: Analyse complète en cours...', 'color:#667eea; font-weight:bold; font-size:14px;');

        // Réinitialiser
        allProblems = {
            brokenLinks: [],
            duplicateLinks: [],
            total: 0
        };

        // Détection des liens coupés
        allProblems.brokenLinks = detectBrokenLinks();

        // Détection des liens consécutifs identiques
        allProblems.duplicateLinks = detectDuplicateConsecutiveLinks();

        // Total
        allProblems.total = allProblems.brokenLinks.length + allProblems.duplicateLinks.length;

        // Affichage des résultats
        if (allProblems.total > 0) {
            console.log(`%c⚠️ ${allProblems.total} problème(s) détecté(s)`, 'color:#ff0000; font-weight:bold; font-size:13px;');
            console.log(`   - ${allProblems.brokenLinks.length} lien(s) coupé(s)`);
            console.log(`   - ${allProblems.duplicateLinks.length} groupe(s) de liens consécutifs`);

            if (CONFIG.autoHighlight) {
                highlightAllProblems();
            }
        } else {
            console.log('%c✅ Aucun problème détecté', 'color:#2e7d32; font-weight:bold; font-size:13px;');
        }

        return allProblems;
    }

    // ============================================
    // PARTIE 6 : API PUBLIQUE
    // ============================================

    window.CheckBrokenLinks = {
        check: checkAllLinks,
        clear: clearHighlights,
        getProblems: () => allProblems,
        config: CONFIG,

        // Fonctions individuelles (pour debug)
        detectBrokenLinks: detectBrokenLinks,
        detectDuplicateLinks: detectDuplicateConsecutiveLinks,
        highlight: highlightAllProblems
    };

    // Auto-exécution au chargement
    if (CONFIG.checkOnLoad) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkAllLinks);
        } else {
            checkAllLinks();
        }
    }

    // console.log('%c✅ CheckBrokenLinks: Module chargé', 'color:#2e7d32; font-weight:bold;');
    // console.log('%c💡 API disponible:', 'color:#667eea; font-weight:bold;');
    // console.log('   CheckBrokenLinks.check()  - Lance l\'analyse');
    // console.log('   CheckBrokenLinks.clear()  - Nettoie les surlignages');
    // console.log('   CheckBrokenLinks.getProblems() - Obtient les résultats');
})();
