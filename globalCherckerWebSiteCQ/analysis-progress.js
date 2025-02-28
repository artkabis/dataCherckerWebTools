// Éléments DOM
const progressFill = document.getElementById('progressFill');
const infoText = document.getElementById('infoText');
const analyzedCount = document.getElementById('analyzedCount');
const failedCount = document.getElementById('failedCount');
const totalCount = document.getElementById('totalCount');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const cancelBtn = document.getElementById('cancelBtn');
const completeMsg = document.getElementById('completeMsg');

// Obtenir l'état initial
chrome.runtime.sendMessage({ action: 'getAnalysisStatus' }, (response) => {
    if (response && response.active) {
        updateUI(response.progress);

        if (response.isPaused) {
            pauseBtn.disabled = true;
            resumeBtn.disabled = false;
        }
    } else {
        // Aucune analyse en cours
        infoText.textContent = "Aucune analyse en cours. Fermez cette page et lancez une analyse depuis l'extension.";
        pauseBtn.disabled = true;
        resumeBtn.disabled = true;
        cancelBtn.disabled = true;
    }
});

// Écouteur de messages pour les mises à jour de progression
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'analysisProgress') {
        updateUI(message.progress);
    }

    if (message.action === 'analysisComplete') {
        showCompletionMessage();
    }
});

// Mise à jour de l'interface utilisateur
function updateUI(progress) {
    if (!progress) return;

    const percentage = progress.percentage || 0;
    progressFill.style.width = `${percentage}%`;

    infoText.textContent = `Progression: ${progress.analyzed} pages analysées, ${progress.failed} échouées sur ${progress.total} (${percentage}%)`;

    analyzedCount.textContent = progress.analyzed;
    failedCount.textContent = progress.failed;
    totalCount.textContent = progress.total;

    if (percentage >= 100) {
        showCompletionMessage();
    }
}

// Afficher le message de fin
function showCompletionMessage() {
    completeMsg.style.display = 'block';
    pauseBtn.disabled = true;
    resumeBtn.disabled = true;
    cancelBtn.disabled = true;

    // Redirection automatique après 3 secondes
    setTimeout(() => {
        window.location.href = chrome.runtime.getURL('results.html');
    }, 3000);
}

// Gestionnaires d'événements
pauseBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'pauseAnalysis' }, (response) => {
        if (response && response.status === 'paused') {
            pauseBtn.disabled = true;
            resumeBtn.disabled = false;
            infoText.textContent += ' (En pause)';
        }
    });
});

resumeBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'resumeAnalysis' }, (response) => {
        if (response && response.status === 'resumed') {
            pauseBtn.disabled = false;
            resumeBtn.disabled = true;
            infoText.textContent = infoText.textContent.replace(' (En pause)', '');
        }
    });
});

cancelBtn.addEventListener('click', () => {
    if (confirm('Êtes-vous sûr de vouloir annuler l\'analyse en cours ?')) {
        chrome.runtime.sendMessage({ action: 'cancelAnalysis' }, (response) => {
            if (response && response.status === 'cancelled') {
                infoText.textContent = 'Analyse annulée. Vous pouvez fermer cette page.';
                pauseBtn.disabled = true;
                resumeBtn.disabled = true;
                cancelBtn.disabled = true;
            }
        });
    }
});