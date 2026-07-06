// ====================================================================
// UNZERSTÖRBARER WEB-INDEXER (1.js) - KEINE BLOCKADEN MEHR
// ====================================================================

const meinEigenerServer = "https://onrender.com"; 

async function fetchWebResultsWithEndlessRetry(searchQuery, stepElement) {
    let attemptCounter = 1;
    
    while (true) {
        // --- VORAB-CHECK: Render-Server aufwecken ---
        if (attemptCounter === 1) {
            fetch(meinEigenerServer).catch(() => {}); // Sendet ein Aufwach-Signal im Hintergrund
        }

        // --- 1. WEG: DEIN EIGENER RENDER-SERVER ---
        try {
            stepElement.innerHTML = `<div class="spinner"></div> Schritt 3: Render-Indexer wird abgefragt (Versuch #${attemptCounter}...)`;
            
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(`${meinEigenerServer}/search?q=${encodeURIComponent(searchQuery)}`, { 
                signal: controller.signal 
            });
            clearTimeout(id);
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.results && data.results.length > 0) {
                    return data; 
                }
            }
        } catch (e) {
            console.warn("Render-Server schläft noch.");
        }

        // --- 2. WEG: UNBLOCKIERBARER DUCKDUCKGO-HTML-PARSER (DIREKT-SUCHE) ---
        try {
            stepElement.innerHTML = `<div class="spinner"></div> Schritt 3: Nutze globale Live-Web-Suche (Versuch #${attemptCounter}...)`;
            
            // Wir nutzen ein freies, extrem stabiles CORS-Netzwerk, das speziell für Webseiten gebaut wurde
            const response = await fetch(`https://allorigins.win{encodeURIComponent('https://duckduckgo.com' + searchQuery)}`);
            
            if (response.ok) {
                const wrapper = await response.json();
                const htmlText = wrapper.contents;
                
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');
                const results = doc.querySelectorAll('.result');
                
                let processedResults = [];
                
                results.forEach((res, index) => {
                    if (index < 4) { 
                        const titleElem = res.querySelector('.result__title a');
                        const snippetElem = res.querySelector('.result__snippet');
                        const urlElem = res.querySelector('.result__url');
                        
                        if (titleElem && snippetElem) {
                            let rawUrl = titleElem.getAttribute('href');
                            if (rawUrl.includes('uddg=')) {
                                rawUrl = decodeURIComponent(rawUrl.split('uddg=')[1].split('&')[0]);
                            }
                            
                            processedResults.push({
                                title: titleElem.innerText.trim(),
                                url: rawUrl.startsWith('http') ? rawUrl : 'https://' + urlElem.innerText.trim(),
                                content: snippetElem.innerText.trim()
                            });
                        }
                    }
                });
                
                if (processedResults.length > 0) {
                    return { results: processedResults }; 
                }
            }
        } catch (e) {
            console.error("Globale Suche blockiert, versuche nächsten Knoten...");
        }
        
        attemptCounter++;
        // 2 Sekunden warten, damit der Render-Server in Ruhe aufwachen kann
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}
