export const HnOutlineValidity = (tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: function () {
      // Constants
      const HEADING_SELECTORS = 'h1, h2, h3, h4, h5, h6';
      const WARNING_COLOR = '#FFA500'; // orange
      const SUCCESS_COLOR = '#008000'; // green

      // Utility functions
      const cleanTextContent = (text) => {
        const cleaned = text.replace(/<br\s*\/?>/gi, ' ').trim();
        return cleaned || '(Aucun texte présent dans ce Hn)';
      };

      const isHeadingValid = (currentLevel, previousLevel) => {
        if (currentLevel === previousLevel) return false;
        return currentLevel === previousLevel + 1;
      };

      const hasDuplicateH1 = () => {
        const h1s = document.querySelectorAll('h1');
        const h1Texts = new Set(Array.from(h1s).map(h1 => h1.textContent.toLowerCase()));
        return h1s.length > 1 && h1s.length !== h1Texts.size;
      };

      // Style generators
      const createStyles = {
        heading: (isValid, level, parentStyle) => ({
          marginLeft: `${level * 50}px`,
          color: parentStyle?.backgroundColor == "rgb(70, 97, 67)" ? "white" : 'green',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: isValid ? parentStyle.backgroundColor : WARNING_COLOR
        }),

        tag: (isValid, isMissing) => ({
          color: 'white',
          background: isMissing ? WARNING_COLOR : SUCCESS_COLOR,
          textTransform: 'uppercase',
          padding: '5px 20px',
          borderRadius: "10px"
        })
      };

      // Main processing
      const processHeadings = () => {
        const headings = document.querySelectorAll(HEADING_SELECTORS);
        const headingData = Array.from(headings).map(heading => ({
          tag: heading.tagName.toLowerCase(),
          content: cleanTextContent(heading.textContent),
          level: parseInt(heading.tagName[1]),
          style: window.getComputedStyle(heading)
        }));

        let structure = '';

        // Si le premier heading n'est pas un h1, ajouter les headings manquants
        if (headingData.length > 0 && headingData[0].level !== 1) {
          const firstLevel = headingData[0].level;
          const style = headingData[0].style;

          // Ajouter tous les niveaux manquants avant le premier heading
          for (let i = 1; i < firstLevel; i++) {
            structure += generateHeadingHTML({
              tag: `h${i}`,
              content: `Missing Heading - h${i}`,
              level: i,
              style,
              isMissing: true
            });
          }
        }

        let previousLevel = 0;

        headingData.forEach((heading, index) => {
          const { tag, content, level, style } = heading;

          // Handle missing headings
          if (index > 0) {
            const isValid = isHeadingValid(level, previousLevel);

            if (!isValid) {
              const missingCount = level - (previousLevel + 1);
              for (let i = 1; i <= missingCount; i++) {
                const missingLevel = previousLevel + i;
                structure += generateHeadingHTML({
                  tag: `h${missingLevel}`,
                  content: `Missing Heading - h${missingLevel}`,
                  level: missingLevel,
                  style,
                  isMissing: true
                });
              }
            }

            // Check for duplicate H1
            if (tag === 'h1' && hasDuplicateH1()) {
              structure += generateHeadingHTML({
                tag,
                content: `Warning: Duplicate H1 - ${content}`,
                level,
                style,
                isDuplicate: true
              });
            }
          }

          structure += generateHeadingHTML({ tag, content, level, style });
          previousLevel = level;
        });

        return structure;
      };

      // HTML generation
      const generateHeadingHTML = ({ tag, content, level, style, isMissing = false, isDuplicate = false }) => {
        const headingStyle = createStyles.heading(!isMissing && !isDuplicate, level, style);
        const tagStyle = createStyles.tag(!isMissing && !isDuplicate, isMissing);

        const className = isMissing ? 'missing' : isDuplicate ? 'duplicate' : '';

        return `
          <${tag} class="${className}" style="${styleToString(headingStyle)}">
            <span style="${styleToString(tagStyle)}">${tag}</span> - ${content}
          </${tag}><br>`;
      };

      // Helper to convert style object to string
      const styleToString = (styles) =>
        Object.entries(styles)
          .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
          .join('; ');

      // Create and populate new window
      const createResultWindow = (structure) => {
        const newWindow = window.open('', '_blank');
        const css = `
          .missing {
            background-color: white !important;
            color: ${WARNING_COLOR} !important;
          }
          .duplicate {
            background-color: ${WARNING_COLOR}
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
        `;

        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Structure des headings</title>
              <style>${css}</style>
            </head>
            <body>${structure}</body>
          </html>
        `);
        newWindow.document.close();
      };

      // Execute
      const structure = processHeadings();
      createResultWindow(structure);
    },
  });
};