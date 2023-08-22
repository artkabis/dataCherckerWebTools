console.log(" ------------------------------- HnOutlineValidity starting");
(() => {
  const isHeadingValid = (currentHn, previousHn) => {
    const currentHnIndex = parseInt(currentHn.charAt(1));
    const previousHnIndex = parseInt(previousHn.charAt(1));

    if (currentHn === previousHn) {
      return false;
    }

    if (currentHnIndex !== previousHnIndex + 1) {
      return false;
    }

    return true;
  };
  const hasDuplicateH1 = () => {
    const h1Tags = document.querySelectorAll("h1");
    const h1Texts = Array.from(h1Tags).map((h1) =>
      h1.textContent.toLowerCase()
    );
    const uniqueH1Texts = new Set(h1Texts);

    return h1Texts.length > 1;
  };
  const getHeadingStyle = (isValid, currentHnIndex, parentStyle) => {
    const backgroundColor = isValid ? parentStyle.backgroundColor : "orange";
    const margin = currentHnIndex * 50;

    return `margin-left: ${margin}px; color: green; display: flex; align-items: center; background-color: ${backgroundColor};`;
  };

  const getSpanStyle = (parentStyle, isValid, isMissingHeading) => {
    let backgroundColor = isMissingHeading
      ? "orange"
      : isValid
      ? "green"
      : "green";
    return `color: white; background: ${backgroundColor}; text-transform: uppercase; padding: 5px 20px;`;
  };

  let hnTagArray = [],
    hnTagContentArray = [];
  document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(function (t, i) {
    hnTagArray.push(t.tagName.toLowerCase());
    hnTagContentArray.push(t.textContent);
  });

  let structure = "",
    previousHn = null;

  hnTagArray.forEach(function (currentHn, index) {
    const currentHnContent = hnTagContentArray[index];
    const currentHnIndex = parseInt(currentHn.charAt(1));
    const parentStyle = window.getComputedStyle(
      document.querySelector(currentHn)
    );

    if (index > 0) {
      const isValid = isHeadingValid(currentHn, previousHn);

      if (!isValid) {
        const missingHeadingsCount =
          currentHnIndex - (parseInt(previousHn.charAt(1)) + 1);

        for (let i = 1; i <= missingHeadingsCount; i++) {
          const missingHnIndex = parseInt(previousHn.charAt(1)) + i;
          const missingHn = `h${missingHnIndex}`;
          const missingHnContent = `Missing Heading - ${missingHn}`;
          const missingHeadingStyle = getHeadingStyle(
            false,
            missingHnIndex,
            parentStyle
          );
          structure += `<${missingHn} class="missing" style="${missingHeadingStyle}"><span style="${getSpanStyle(
            parentStyle,
            false,
            true
          )}">${missingHn}</span> - ${missingHnContent}</${missingHn}><br>`;
        }
      }
      if (currentHn === "h1" && hasDuplicateH1()) {
        structure += `<${currentHn} class="duplicate" style="${getHeadingStyle(
          false,
          currentHnIndex,
          parentStyle
        )}"><span style="${getSpanStyle(
          parentStyle,
          false,
          false
        )}">Warning: Duplicate H1</span> - ${currentHnContent}</${currentHn}><br>`;
      }
    }

    const headingStyle = getHeadingStyle(true, currentHnIndex, parentStyle);
    structure += `<${currentHn} style="${headingStyle}"><span style="${getSpanStyle(
      parentStyle,
      true,
      false
    )}">${currentHn}</span> - ${currentHnContent}</${currentHn}><br>`;
    previousHn = currentHn;
  });
  console.log({ structure });
  const newWindow = window.open("", "_blank");
  newWindow.document.write("<html><head><title>Structure corrigée</title>");
  newWindow.document.write(
    "<style>.missing {background-color: white!important;color: orange!important;}.noMissingHeading { background-color:green }.duplicate { background-color: orange }</style>"
  );
  newWindow.document.write(`</head><body>${structure}<body></html>`);
  newWindow.document.close();
})();
