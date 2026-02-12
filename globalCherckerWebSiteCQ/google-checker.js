// google-checker.js
(async () => {
    const { targetDomain } = await chrome.storage.local.get('targetDomain');
    if (!targetDomain) return;

    const query = new URLSearchParams(window.location.search).get('q');
    const results = document.querySelectorAll('#search .g'); // Résultats organiques

    let foundData = {
        keyword: query,
        position: "Hors Top 10",
        url: "N/A",
        time: new Date().toLocaleTimeString()
    };

    results.forEach((el, index) => {
        const link = el.querySelector('a')?.href;
        // On vérifie si le lien contient notre domaine cible
        if (link && link.includes(targetDomain) && foundData.position === "Hors Top 10") {
            foundData.position = index + 1;
            foundData.url = link;
        }
    });

    chrome.runtime.sendMessage({
        action: "SAVE_GOOGLE_RESULT",
        data: foundData
    });

    // Optionnel : ferme l'onglet après analyse pour nettoyer le navigateur
    // setTimeout(() => window.close(), 1500);
})();