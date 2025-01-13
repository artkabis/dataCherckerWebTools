export const HnOutlineValidity = (tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: function () {
      // Constants et configurations
      const HEADING_SELECTORS = 'h1, h2, h3, h4, h5, h6';
      const WARNING_COLOR = '#FFA500';
      const SUCCESS_COLOR = '#008000';
      const ERROR_COLOR = '#FF4444';

      // Icônes de statut
      const STATUS_ICONS = {
        valid: '✓',
        warning: '⚠️',
        error: '❌'
      };

      // Configuration SEO
      const SEO_RULES = {
        maxH1H2Length: 90,
        minH1H2Length: 50
      };

      // Configuration des conseils SEO
      const SEO_RECOMMENDATIONS = {
        length: {
          tooLong: (tag, length, maxLength) => ({
            title: 'Titre trop long',
            tips: [
              `Réduisez la longueur à ${maxLength} caractères maximum`,
              'Gardez les mots-clés importants au début',
              'Évitez les mots de liaison superflus',
              'Utilisez des synonymes plus courts'
            ]
          }),
          tooShort: (tag, length, minLength) => ({
            title: 'Titre trop court',
            tips: [
              `Ajoutez du contenu pour atteindre au moins ${minLength} caractères`,
              'Incluez vos mots-clés principaux',
              'Ajoutez des qualificatifs pertinents',
              'Précisez le contexte si nécessaire'
            ]
          })
        },
        duplicates: {
          title: 'Contenu dupliqué détecté',
          tips: [
            'Chaque titre doit avoir un contenu unique',
            'Différenciez les titres de sections similaires',
            'Utilisez des variations sémantiques',
            'Ajoutez des qualificatifs spécifiques au contexte'
          ]
        },
        multipleH1: {
          title: 'Plusieurs H1 détectés',
          tips: [
            'Une page ne doit avoir qu\'un seul H1',
            'Le H1 doit représenter le titre principal de la page',
            'Utilisez des H2 pour les sections principales',
            'Restructurez la hiérarchie des titres'
          ]
        }
      };

      // État global
      let stats = {
        totalHeadings: 0,
        headingsPerLevel: {},
        averageLength: 0,
        totalWords: 0,
        structureScore: 100,
        errors: [],
        warnings: [],
        duplicateContents: [],
        h1Count: 0
      };

      // Utilitaires
      const cleanTextContent = text => {
        const cleaned = text.replace(/<br\s*\/?>/gi, ' ').trim();
        return cleaned || '(Aucun texte présent dans Hn)';
      };

      const countWords = text => {
        return text.split(/\s+/).filter(word => word.length > 0).length;
      };

      const getElementPosition = element => {
        const rect = element.getBoundingClientRect();
        return {
          top: Math.round(rect.top + window.scrollY),
          left: Math.round(rect.left + window.scrollX)
        };
      };

      const styleToString = styles =>
        Object.entries(styles)
          .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
          .join('; ');

      // Fonction pour trouver les titres dupliqués
      const findDuplicateHeadings = (headings) => {
        const contentMap = new Map();
        const duplicates = [];

        headings.forEach((heading, index) => {
          const content = cleanTextContent(heading.textContent);
          if (!contentMap.has(content)) {
            contentMap.set(content, []);
          }
          contentMap.get(content).push({
            index,
            tag: heading.tagName.toLowerCase()
          });
        });

        contentMap.forEach((occurrences, content) => {
          if (occurrences.length > 1) {
            duplicates.push({
              content,
              occurrences
            });
          }
        });

        return duplicates;
      };

      const generateSEOTooltip = (analysis, tag) => {
        let recommendations = [];

        // Recommendations pour la longueur
        if (analysis.length > SEO_RULES.maxH1H2Length) {
          recommendations.push(SEO_RECOMMENDATIONS.length.tooLong(tag, analysis.length, SEO_RULES.maxH1H2Length));
        }
        if (analysis.length < SEO_RULES.minH1H2Length) {
          recommendations.push(SEO_RECOMMENDATIONS.length.tooShort(tag, analysis.length, SEO_RULES.minH1H2Length));
        }

        // Recommendations pour les erreurs
        if (analysis.issues.some(issue => issue.includes('dupliqué'))) {
          recommendations.push(SEO_RECOMMENDATIONS.duplicates);
        }
        if (analysis.issues.some(issue => issue.includes('Multiple H1'))) {
          recommendations.push(SEO_RECOMMENDATIONS.multipleH1);
        }

        return `
          <div class="seo-tooltip">
            ${recommendations.map(rec => `
              <div class="tooltip-section">
                <h4 class="tooltip-title">${rec.title}</h4>
                <ul class="tooltip-list">
                  ${rec.tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        `;
      };

      // Fonctions d'analyse
      const analyzeHeadingContent = (content, level, tag, headings, index) => {
        const length = content.length;
        const words = countWords(content);

        let analysis = {
          length,
          words,
          issues: [],
          status: 'valid'
        };

        // Vérification de la longueur pour H1 et H2
        if (level <= 2) {
          if (length > SEO_RULES.maxH1H2Length) {
            analysis.issues.push(`${tag.toUpperCase()} trop long (${length}/${SEO_RULES.maxH1H2Length} caractères max.)`);
            analysis.status = 'warning';
          }
          if (length < SEO_RULES.minH1H2Length) {
            analysis.issues.push(`${tag.toUpperCase()} trop court (${length}/${SEO_RULES.minH1H2Length} caractères min.)`);
            analysis.status = 'warning';
          }
        }

        // Vérification des doublons
        const duplicateCheck = Array.from(headings).find((h, i) => {
          return i !== index &&
            cleanTextContent(h.textContent) === content;
        });

        if (duplicateCheck) {
          analysis.issues.push(`Contenu dupliqué avec un autre ${duplicateCheck.tagName.toLowerCase()}`);
          analysis.status = 'error';
        }

        // Vérification du H1
        if (tag === 'h1') {
          const h1Count = Array.from(headings).filter(h => h.tagName.toLowerCase() === 'h1').length;
          if (h1Count > 1) {
            analysis.issues.push(`Multiple H1 détectés sur la page (${h1Count} au total)`);
            analysis.status = 'error';
          }
        }

        return analysis;
      };

      // Fonctions de structure
      const createTreeView = headingData => {
        let treeStructure = [];
        let currentPath = [];

        headingData.forEach((heading, index) => {
          const { tag, content, level, analysis } = heading;
          const node = {
            id: index,
            tag,
            content,
            level,
            status: analysis.status,
            children: []
          };

          while (currentPath.length > 0 && currentPath[currentPath.length - 1].level >= level) {
            currentPath.pop();
          }

          if (currentPath.length === 0) {
            treeStructure.push(node);
          } else {
            currentPath[currentPath.length - 1].children.push(node);
          }

          currentPath.push(node);
        });

        return treeStructure;
      };

      const renderTreeNode = (node, depth = 0) => {
        const padding = depth * 20;
        const icon = STATUS_ICONS[node.status] || STATUS_ICONS.valid;

        return `
          <div class="tree-node" style="margin-left: ${padding}px; margin-bottom: 10px;">
            <div class="node-content" style="display: flex; align-items: center; gap: 10px;">
              <span class="status-icon">${icon}</span>
              <span class="tag-badge" style="background: ${node.status === 'valid' ? SUCCESS_COLOR :
            node.status === 'error' ? ERROR_COLOR : WARNING_COLOR}; 
                                           color: white; 
                                           padding: 2px 6px; 
                                           border-radius: 4px;">
                ${node.tag}
              </span>
              <span class="content">${node.content}</span>
            </div>
            ${node.children.map(child => renderTreeNode(child, depth + 1)).join('')}
          </div>
        `;
      };

      // Fonction de génération HTML
      const generateHeadingHTML = ({ tag, content, level, style, analysis, position = null, isMissing = false, status = 'valid' }) => {
        // Utiliser le statut de l'analyse si disponible
        const finalStatus = analysis ? analysis.status : status;

        const headingStyle = {
          marginLeft: `${level * 50}px`,
          padding: '15px',
          marginBottom: '15px',
          borderRadius: '8px',
          position: 'relative',
          backgroundColor: finalStatus === 'error' ? ERROR_COLOR :
            finalStatus === 'warning' ? WARNING_COLOR :
              '#fff',
          border: '1px solid #ddd',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          color: finalStatus === 'error' ? '#fff' : 'inherit'
        };

        const icon = STATUS_ICONS[finalStatus];
        const analysisInfo = analysis ? `
          <div style="font-size: 0.9em; margin-top: 5px; color: ${finalStatus === 'error' ? '#fff' : '#666'};">
            ${analysis.length} caractères | ${analysis.words} mots
            ${analysis.issues.map(issue =>
          `<div style="color: ${finalStatus === 'error' ? '#fff' : WARNING_COLOR}; margin-top: 5px;">${issue}</div>`
        ).join('')}
          </div>
        ` : '';

        return `
          <div class="heading-container" style="${styleToString(headingStyle)}">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span class="status-icon">${icon}</span>
                <span style="background: ${finalStatus === 'valid' ? SUCCESS_COLOR :
            finalStatus === 'error' ? '#fff' : WARNING_COLOR}; 
                            color: ${finalStatus === 'error' ? ERROR_COLOR : '#fff'}; 
                            padding: 5px 10px; 
                            border-radius: 4px;">
                  ${tag}
                </span>
                ${position ? `<small style="color: ${finalStatus === 'error' ? '#fff' : 'inherit'}">Position: ${position.top}px</small>` : ''}
              </div>
            </div>
            <div style="margin: 10px 0;">${content}</div>
            ${analysisInfo}
            ${(finalStatus === 'warning' || finalStatus === 'error') ? generateSEOTooltip(analysis, tag) : ''}
          </div>
        `;
      };

      const generateMissingHeadingHTML = (level, style) => {
        return generateHeadingHTML({
          tag: `h${level}`,
          content: `Missing Heading - h${level}`,
          level,
          style,
          isMissing: true,
          status: 'error'
        });
      };
      // Fonction de traitement de la structure des headings
      const processHeadingStructure = (headingData) => {
        let structure = '';
        let previousLevel = 0;

        if (headingData.length > 0 && headingData[0].level !== 1) {
          stats.errors.push("La page ne commence pas par un H1");
          stats.structureScore -= 20;

          for (let i = 1; i < headingData[0].level; i++) {
            structure += generateMissingHeadingHTML(i, headingData[0].style);
          }
        }

        headingData.forEach((heading, index) => {
          const { tag, content, level, style, analysis, position } = heading;

          if (index > 0) {
            const levelDiff = level - previousLevel;
            if (levelDiff > 1) {
              stats.errors.push(`Saut de niveau non valide : ${previousLevel} à ${level}`);
              stats.structureScore -= 10;

              for (let i = 1; i < levelDiff; i++) {
                structure += generateMissingHeadingHTML(previousLevel + i, style);
              }
            }
          }

          structure += generateHeadingHTML({
            tag,
            content,
            level,
            style,
            analysis,
            position
          });

          previousLevel = level;
        });

        return structure;
      };

      const generateHeadingStructure = () => {
        const headingsList = document.querySelectorAll(HEADING_SELECTORS);
        const headings = Array.from(headingsList);
        stats.totalHeadings = headings.length;

        // Vérification des doublons
        stats.duplicateContents = findDuplicateHeadings(headings);
        if (stats.duplicateContents.length > 0) {
          stats.errors.push("Des titres avec un contenu identique ont été détectés");
          stats.structureScore -= 10 * stats.duplicateContents.length;
        }

        // Vérification du nombre de H1
        const h1Count = document.querySelectorAll('h1').length;
        stats.h1Count = h1Count;
        if (h1Count === 0) {
          stats.errors.push("Aucun H1 n'a été trouvé sur la page");
          stats.structureScore -= 20;
        } else if (h1Count > 1) {
          stats.errors.push(`${h1Count} H1 ont été trouvés sur la page (il devrait y en avoir un seul)`);
          stats.structureScore -= 15 * (h1Count - 1);
        }

        const headingData = Array.from(headings).map((heading, index) => {
          const tag = heading.tagName.toLowerCase();
          const level = parseInt(tag[1]);
          const content = cleanTextContent(heading.textContent);
          const analysis = analyzeHeadingContent(content, level, tag, headings, index);

          stats.headingsPerLevel[tag] = (stats.headingsPerLevel[tag] || 0) + 1;
          stats.totalWords += analysis.words;
          stats.averageLength += content.length;

          return {
            tag,
            content,
            level,
            style: window.getComputedStyle(heading),
            analysis,
            position: getElementPosition(heading)
          };
        });

        if (stats.totalHeadings > 0) {
          stats.averageLength = Math.round(stats.averageLength / stats.totalHeadings);
        }
        const treeStructure = createTreeView(headingData);
        const treeView = `
          <div class="tree-view" style="margin: 20px 0; padding: 20px; background: #f5f5f5; border-radius: 8px;">
            <h3>Structure arborescente des headings</h3>
            ${treeStructure.map(node => renderTreeNode(node)).join('')}
          </div>
        `;

        return {
          normalView: processHeadingStructure(headingData),
          treeView
        };
      };

      const generateSummaryHTML = () => {
        const score = Math.max(0, stats.structureScore);
        const duplicateContent = stats.duplicateContents.length > 0 ? `
          <div style="margin-top: 10px;">
            <strong>Titres dupliqués détectés :</strong>
            <ul>
              ${stats.duplicateContents.map(dup => `
                <li>
                  "${dup.content}" utilisé dans : ${dup.occurrences.map(occ => occ.tag).join(', ')}
                </li>
              `).join('')}
            </ul>
          </div>
        ` : '';

        return `
          <div style="background: #f5f5f5; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
            <h2>Résumé de l'analyse</h2>
            <p>Score de structure: <strong style="color: ${score > 70 ? SUCCESS_COLOR : WARNING_COLOR}">${score}%</strong></p>
            <ul>
              <li>Nombre total de headings: ${stats.totalHeadings}</li>
              <li>Nombre de H1: ${stats.h1Count}</li>
              <li>Longueur moyenne: ${stats.averageLength} caractères</li>
              <li>Nombre total de mots: ${stats.totalWords}</li>
              ${Object.entries(stats.headingsPerLevel)
            .map(([tag, count]) => `<li>${tag}: ${count}</li>`)
            .join('')}
            </ul>
            ${stats.errors.length > 0 ? `
              <div style="color: ${ERROR_COLOR}; margin-top: 10px;">
                <strong>Erreurs:</strong>
                <ul>${stats.errors.map(error => `<li>${error}</li>`).join('')}</ul>
              </div>
            ` : ''}
            ${duplicateContent}
          </div>
        `;
      };

      const createResultWindow = () => {
        const { normalView, treeView } = generateHeadingStructure();
        const summary = generateSummaryHTML();

        const newWindow = window.open('', '_blank');
        const css = `
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.5;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
            background: #fafafa;
          }

          .tree-view {
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }

          .tree-node:hover {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 4px;
          }

          .status-icon {
            font-size: 1.2em;
          }

          .heading-container {
            position: relative;
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
          }

          .heading-container:hover {
            transform: translateX(5px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }

          .seo-tooltip {
            display: none;
            position: absolute;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            max-width: 300px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 1000;
            top: 0;
            right: -320px;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s, visibility 0.2s;
          }

          .heading-container:hover .seo-tooltip {
            display: block;
            opacity: 1;
            visibility: visible;
          }

          .tooltip-section {
            margin-bottom: 10px;
          }

          .tooltip-title {
            margin: 0 0 8px 0;
            color: ${WARNING_COLOR};
          }

          .tooltip-list {
            margin: 0;
            padding-left: 20px;
            color: #333;
          }

          .tooltip-list li {
            margin-bottom: 4px;
          }

          @media (max-width: 1600px) {
            .seo-tooltip {
              right: -280px;
              max-width: 260px;
            }
          }
        `;

        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Analyse de la structure des headings</title>
              <style>${css}</style>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link rel="icon" type="image/jpg" href="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QL6RXhpZgAATU0AKgAAAAgABAE7AAIAAAAQAAABSodpAAQAAAABAAABWpydAAEAAAAgAAAC0uocAAcAAAEMAAAAPgAAAAAc6gAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAR3JlZ29yeSBOSUNPTExFAAAFkAMAAgAAABQAAAKokAQAAgAAABQAAAK8kpEAAgAAAAM4MAAAkpIAAgAAAAM4MAAA6hwABwAAAQwAAAGcAAAAABzqAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAyMDI1OjAxOjEwIDEyOjAzOjAyADIwMjU6MDE6MTAgMTI6MDM6MDIAAABHAHIAZQBnAG8AcgB5ACAATgBJAEMATwBMAEwARQAAAP/hBCJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvADw/eHBhY2tldCBiZWdpbj0n77u/JyBpZD0nVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkJz8+DQo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIj48cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPjxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSJ1dWlkOmZhZjViZGQ1LWJhM2QtMTFkYS1hZDMxLWQzM2Q3NTE4MmYxYiIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIi8+PHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9InV1aWQ6ZmFmNWJkZDUtYmEzZC0xMWRhLWFkMzEtZDMzZDc1MTgyZjFiIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iPjx4bXA6Q3JlYXRlRGF0ZT4yMDI1LTAxLTEwVDEyOjAzOjAyLjc5NTwveG1wOkNyZWF0ZURhdGU+PC9yZGY6RGVzY3JpcHRpb24+PHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9InV1aWQ6ZmFmNWJkZDUtYmEzZC0xMWRhLWFkMzEtZDMzZDc1MTgyZjFiIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iPjxkYzpjcmVhdG9yPjxyZGY6U2VxIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+PHJkZjpsaT5HcmVnb3J5IE5JQ09MTEU8L3JkZjpsaT48L3JkZjpTZXE+DQoJCQk8L2RjOmNyZWF0b3I+PC9yZGY6RGVzY3JpcHRpb24+PC9yZGY6UkRGPjwveDp4bXBtZXRhPg0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDw/eHBhY2tldCBlbmQ9J3cnPz7/2wBDAAcFBQYFBAcGBQYIBwcIChELCgkJChUPEAwRGBUaGRgVGBcbHichGx0lHRcYIi4iJSgpKywrGiAvMy8qMicqKyr/2wBDAQcICAoJChQLCxQqHBgcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKir/wAARCADyAPgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD5tooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAPZ9B/Zr17X/D9lq1vrFlHFeQrKqMjZUHsa0f+GU/Ef/QcsP8Avhq+g/hp/wAkx8P/APXjH/KuooA+BPiD4FvPh74mGi6hcxXMpgWbfECBhiRjn/drl69h/ad/5K4n/YOi/wDQnrx6gAooooA9B+G3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" >
            </head>
            <body>
              ${summary}
              ${treeView}
              <div class="structure">
                ${normalView}
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      };

      // Exécution
      createResultWindow();
    },
  });
};