const chatBox = document.getElementById('chatBox');
const attachMenu = document.getElementById('attachMenu');
const plusBtn = document.getElementById('plusBtn');
const historyBox = document.getElementById('historyBox');

// Globale Einstellungen
let deepSearchActive = true;
let longAnswerActive = false;
let chatHistory = [];

// --- LIVE-UHR & DATUM ---
function updateClock() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('liveDate').innerText = now.toLocaleDateString('de-DE', options);
    document.getElementById('liveTime').innerText = now.toLocaleTimeString('de-DE');
}
setInterval(updateClock, 1000);
updateClock();

// --- PLUS-MENÜ STEUERUNG ---
function toggleMenu() {
    attachMenu.classList.toggle('show');
    plusBtn.classList.toggle('open');
}

function toggleDeepSearch() {
    deepSearchActive = !deepSearchActive;
    document.getElementById('btnDeepSearch').classList.toggle('active', deepSearchActive);
}

function toggleLongAnswer() {
    longAnswerActive = !longAnswerActive;
    document.getElementById('btnLongAnswer').classList.toggle('active', longAnswerActive);
}

// Schließt das Menü bei Klicks außerhalb
document.addEventListener('click', function(event) {
    if (!plusBtn.contains(event.target) && !attachMenu.contains(event.target)) {
        attachMenu.classList.remove('show');
        plusBtn.classList.remove('open');
    }
});

// --- SPRACHAUSGABE (TTS) ---
function speakText(button, textToSpeak) {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        button.innerHTML = "🔊 Vorlesen";
        return;
    }
    const cleanText = textToSpeak.replace(/<\/?[^>]+(>|$)/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'de-DE';
    utterance.rate = 1.0;
    button.innerHTML = "🛑 Stoppen";
    utterance.onend = () => button.innerHTML = "🔊 Vorlesen";
    window.speechSynthesis.speak(utterance);
}

// --- SUCHVERLAUF-ARCHIV ---
function addToHistory(query, messageElementId) {
    chatHistory.push({ title: query, targetId: messageElementId });
    historyBox.innerHTML = "";
    chatHistory.forEach(item => {
        const btn = document.createElement("button");
        btn.className = "history-item";
        btn.innerText = item.title;
        btn.title = item.title;
        btn.onclick = () => {
            const element = document.getElementById(item.targetId);
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        };
        historyBox.appendChild(btn);
    });
}

// --- CHAT-ABWICKLUNG ---
async function handleSend() {
    const input = document.getElementById('userInput');
    const query = input.value.trim();
    if (!query) return;

    attachMenu.classList.remove('show');
    plusBtn.classList.remove('open');
    
    const userMsgId = 'user-' + Date.now();
    chatBox.innerHTML += `<div class="message-row user" id="${userMsgId}"><div class="message-box">${query}</div></div>`;
    input.value = '';
    
    const msgId = 'ai-' + Date.now();
    let stepsHtml = '';
    
    if (deepSearchActive) {
        stepsHtml = `
            <div class="agent-steps">
                <div class="step id-1 active"><div class="spinner"></div> Schritt 1: Analysiere "${query}" im Live-Web...</div>
                <div class="step id-2"><div class="spinner" style="display:none;"></div> Schritt 2: Extrahiere Kernbedeutung...</div>
                <div class="step id-3"><div class="spinner" style="display:none;"></div> Schritt 3: Starte Hintergrundrecherche...</div>
            </div>`;
    } else {
        stepsHtml = `<div class="agent-steps"><div class="step done"><span class="check-icon">✓</span> Sofort-Modus aktiv</div></div>`;
    }

    chatBox.innerHTML += `<div class="message-row ai" id="${msgId}"><div class="message-box">${stepsHtml}<div class="reply-content"></div></div></div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
    
    addToHistory(query, msgId);
    const aiRow = document.getElementById(msgId);

    try {
        let extractedMeaning = query;
        let definitionSnippet = "";
        let webData = null;

        if (deepSearchActive) {
            // Wikipedia Begriffserklärung (Schritt 1 & 2)
            try {
                const definitionUrl = `https://wikipedia.org{encodeURIComponent(query)}`;
                const defResponse = await fetch(definitionUrl);
                if(defResponse.ok) {
                    const defData = await defResponse.json();
                    if (defData && defData.extract) {
                        definitionSnippet = defData.extract;
                        if(defData.title) extractedMeaning = defData.title;
                    }
                }
            } catch(e) { definitionSnippet = "Erklärung temporär nicht im Live-Index verfügbar."; }

            aiRow.querySelector('.id-1').className = "step id-1 done";
            aiRow.querySelector('.id-1').innerHTML = `<span class="check-icon">✓</span> Analysierte "${query}" im Live-Web.`;
            aiRow.querySelector('.id-2').className = "step id-2 active";
            aiRow.querySelector('.id-2 .spinner').style.display = "block";

            await new Promise(r => setTimeout(r, 400));

            aiRow.querySelector('.id-2').className = "step id-2 done";
            aiRow.querySelector('.id-2').innerHTML = `<span class="check-icon">✓</span> Bedeutung ermittelt: [${extractedMeaning}]`;
            
            const step3Element = aiRow.querySelector('.id-3');
            step3Element.className = "step id-3 active";
            step3Element.querySelector('.spinner').style.display = "block";

            // RUFT DIE UNENDLICHE SUCHE AUS DER DATEI 1.JS AUF
            webData = await fetchWebResultsWithEndlessRetry(extractedMeaning, step3Element);

            step3Element.className = "step id-3 done";
            step3Element.innerHTML = `<span class="check-icon">✓</span> Hintergrundrecherche abgeschlossen.`;
        }

        // Ergebnisse im Chat anzeigen
        let htmlOutput = "";
        let textToVoice = "";

        if (deepSearchActive && definitionSnippet) {
            htmlOutput += `<div class="meaning-badge">🔍 Gefundene Bedeutung: ${extractedMeaning}</div>`;
            htmlOutput += `<p style="margin-top:0; color:#ccc;"><em>"${definitionSnippet}"</em></p>`;
            textToVoice += definitionSnippet + " ";
        }

        if (deepSearchActive && webData && webData.results && webData.results.length > 0) {
            htmlOutput += `<h4>Gefundene Web-Ergebnisse:</h4><div class="web-results">`;
            const maxResults = longAnswerActive ? 4 : 1;
            const links = webData.results.slice(0, maxResults);
            
            links.forEach(item => {
                htmlOutput += `
                    <div class="web-item">
                        <a href="${item.url}" target="_blank">${item.title}</a>
                        <span style="color:#aaa; font-size:13px;">${item.content || 'Keine Beschreibung verfügbar.'}</span>
                    </div>`;
                textToVoice += item.title + ". " + (item.content || "") + " ";
            });
            htmlOutput += `</div>`;
        }

        if (deepSearchActive) {
            htmlOutput += `<h4>Medien-Inhalte:</h4><div class="img-grid">`;
            const imgCount = longAnswerActive ? 3 : 1;
            for(let i = 1; i <= imgCount; i++) {
                htmlOutput += `<img src="https://loremflickr.com{encodeURIComponent(extractedMeaning)}?t=${i}" alt="Bild ${i}">`;
            }
            htmlOutput += `</div>`;
        }

        if (!deepSearchActive) {
            htmlOutput = `<p>Direktantwort-Modus ohne Websuche.<br>Inhalt: <strong>"${query}"</strong></p>`;
            textToVoice = `Direktantwort Modus aktiv für Begriff ${query}`;
        }

        const escapedText = textToVoice.replace(/"/g, '&quot;').replace(/'/g, '\\\'');
        htmlOutput += `<br><button class="tts-btn" onclick="speakText(this, '${escapedText}')">🔊 Vorlesen</button>`;

        aiRow.querySelector('.reply-content').innerHTML = htmlOutput;

    } catch (error) {
        aiRow.querySelector('.reply-content').innerHTML = `<p style="color:#ff4757;">⚠ Schwerer Systemfehler.</p>`;
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}

function resetChat() { 
    chatBox.innerHTML = '<div class="message-row ai"><div class="message-box">Neuer Chat bereit!</div></div>'; 
    historyBox.innerHTML = "";
    chatHistory = [];
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
}

function exportChat() {
    attachMenu.classList.remove('show');
    plusBtn.classList.remove('open');
    const messages = chatBox.querySelectorAll('.message-row');
    if(messages.length <= 1) { alert("Der Chat ist noch leer!"); return; }

    let exportText = "=== CHAT PROTOKOLL ===\n\n";
    messages.forEach(msg => {
        if (msg.classList.contains('user')) {
            exportText += `USER: ${msg.querySelector('.message-box').innerText}\n\n`;
        } else {
            exportText += `KI ASSISTANT:\n${msg.querySelector('.message-box').innerText}\n-----------\n\n`;
        }
    });

    const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `chat-export-${Date.now()}.txt`;
    link.click();
}
