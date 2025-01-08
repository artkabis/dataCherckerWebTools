export const HnOutlineValidity = (tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: function () {
      // Constants
      const HEADING_SELECTORS = 'h1, h2, h3, h4, h5, h6';
      const WARNING_COLOR = '#FFA500';
      const SUCCESS_COLOR = '#008000';
      const ERROR_COLOR = '#FF4444';

      // Configuration des règles SEO
      const SEO_RULES = {
        maxH1Length: 60, // Longueur maximale recommandée pour un H1
        minH1Length: 20, // Longueur minimale recommandée pour un H1
        maxHeadingLength: 70, // Longueur maximale recommandée pour les autres headings
      };

      // Statistiques globales
      let stats = {
        totalHeadings: 0,
        headingsPerLevel: {},
        averageLength: 0,
        totalWords: 0,
        structureScore: 100, // Score initial
        errors: [],
        warnings: []
      };

      // Utility functions
      const cleanTextContent = (text) => {
        const cleaned = text.replace(/<br\s*\/?>/gi, ' ').trim();
        return cleaned || '(Aucun texte présent dans Hn)';
      };

      const countWords = (text) => {
        return text.split(/\s+/).filter(word => word.length > 0).length;
      };

      const analyzeHeadingContent = (content, level) => {
        const length = content.length;
        const words = countWords(content);

        let analysis = {
          length,
          words,
          issues: []
        };

        // Analyse spécifique pour H1
        if (level === 1) {
          if (length > SEO_RULES.maxH1Length) {
            analysis.issues.push(`H1 trop long (${length}/${SEO_RULES.maxH1Length} caractères recommandés)`);
          }
          if (length < SEO_RULES.minH1Length) {
            analysis.issues.push(`H1 trop court (${length}/${SEO_RULES.minH1Length} caractères recommandés)`);
          }
        } else if (length > SEO_RULES.maxHeadingLength) {
          analysis.issues.push(`Heading trop long (${length}/${SEO_RULES.maxHeadingLength} caractères recommandés)`);
        }

        return analysis;
      };

      const generateHeadingStructure = () => {
        const headings = document.querySelectorAll(HEADING_SELECTORS);
        stats.totalHeadings = headings.length;

        const headingData = Array.from(headings).map(heading => {
          const tag = heading.tagName.toLowerCase();
          const level = parseInt(tag[1]);
          const content = cleanTextContent(heading.textContent);
          const analysis = analyzeHeadingContent(content, level);

          // Mise à jour des statistiques
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

        return processHeadingStructure(headingData);
      };

      const getElementPosition = (element) => {
        const rect = element.getBoundingClientRect();
        return {
          top: Math.round(rect.top + window.scrollY),
          left: Math.round(rect.left + window.scrollX)
        };
      };

      const processHeadingStructure = (headingData) => {
        let structure = '';
        let previousLevel = 0;

        // Vérification initiale de la structure
        if (headingData.length > 0 && headingData[0].level !== 1) {
          stats.errors.push("La page ne commence pas par un H1");
          stats.structureScore -= 20;

          // Ajout des headings manquants au début
          for (let i = 1; i < headingData[0].level; i++) {
            structure += generateMissingHeadingHTML(i, headingData[0].style);
          }
        }

        // Analyse des headings
        headingData.forEach((heading, index) => {
          const { tag, content, level, style, analysis, position } = heading;

          // Vérification de la structure
          if (index > 0) {
            const levelDiff = level - previousLevel;
            if (levelDiff > 1) {
              stats.errors.push(`Saut de niveau non valide : ${previousLevel} à ${level}`);
              stats.structureScore -= 10;

              // Ajout des niveaux manquants
              for (let i = 1; i < levelDiff; i++) {
                structure += generateMissingHeadingHTML(previousLevel + i, style);
              }
            }
          }

          // Construction du HTML pour ce heading
          structure += generateHeadingHTML({
            tag,
            content,
            level,
            style,
            analysis,
            position,
            isDuplicate: tag === 'h1' && stats.headingsPerLevel.h1 > 1
          });

          previousLevel = level;
        });

        return structure;
      };

      const generateMissingHeadingHTML = (level, style) => {
        return generateHeadingHTML({
          tag: `h${level}`,
          content: `Missing Heading - h${level}`,
          level,
          style,
          isMissing: true
        });
      };

      const generateHeadingHTML = ({ tag, content, level, style, analysis, position = null, isMissing = false, isDuplicate = false }) => {
        const headingStyle = {
          marginLeft: `${level * 50}px`,
          padding: '10px',
          marginBottom: '10px',
          borderRadius: '4px',
          border: '1px solid #ddd',
          backgroundColor: isMissing ? WARNING_COLOR :
            isDuplicate ? ERROR_COLOR :
              analysis?.issues.length ? WARNING_COLOR :
                '#fff'
        };

        const positionInfo = position ? `<small>Position: ${position.top}px from top</small>` : '';
        const analysisInfo = analysis ? `
          <div style="font-size: 0.9em; margin-top: 5px; color: #666;">
            ${analysis.length} caractères | ${analysis.words} mots
            ${analysis.issues.map(issue => `<div style="color: ${WARNING_COLOR}">${issue}</div>`).join('')}
          </div>
        ` : '';

        return `
          <div style="${styleToString(headingStyle)}">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <span style="background: ${isMissing ? WARNING_COLOR : SUCCESS_COLOR}; color: white; padding: 3px 8px; border-radius: 3px;">
                ${tag}
              </span>
              ${positionInfo}
            </div>
            <div style="margin-top: 8px;">${content}</div>
            ${analysisInfo}
          </div>
        `;
      };

      const styleToString = (styles) =>
        Object.entries(styles)
          .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
          .join('; ');

      const generateSummaryHTML = () => {
        const score = Math.max(0, stats.structureScore);
        return `
          <div style="background: #f5f5f5; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
            <h2>Résumé de l'analyse</h2>
            <p>Score de structure: <strong style="color: ${score > 70 ? SUCCESS_COLOR : WARNING_COLOR}">${score}%</strong></p>
            <ul>
              <li>Nombre total de headings: ${stats.totalHeadings}</li>
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
            ${stats.warnings.length > 0 ? `
              <div style="color: ${WARNING_COLOR}; margin-top: 10px;">
                <strong>Avertissements:</strong>
                <ul>${stats.warnings.map(warning => `<li>${warning}</li>`).join('')}</ul>
              </div>
            ` : ''}
          </div>
        `;
      };

      const createResultWindow = () => {
        const structure = generateHeadingStructure();
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
        `;

        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Analyse de la structure des headings</title>
              <style>${css}</style>
              <meta charset="UTF-8">
            </head>
            <body>
              ${summary}
              <div class="structure">
                ${structure}
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