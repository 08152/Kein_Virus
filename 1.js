// ====================================================================
// KORRIGIERTER LIVE-WEB INDEXER (1.js) - FEHLERFREIES PARSING
// ====================================================================

const meinEigenerServer = "https://onrender.com"; 

async function fetchWebResultsWithEndlessRetry(searchQuery, stepElement) {
    let attemptCounter = 1;
    
    while (true) {
        // Render-Server beim ersten Versuch aufwecken
        if (attemptCounter === 1) {
            fetch(meinEigenerServer).catch(() => {});
        }

        // --- WEG 1: DEIN EIGENER RENDER-SERVER ---
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

        // --- WEG 2: LIVE-WEB ABFRAGE ÜBER ALLORIGINS (KORRIGIERT) ---
        try {
            stepElement.innerHTML = `<div class="spinner"></div> Schritt 3: Rufe Live-Web ab (Versuch #${attemptCounter}...)`;
            
            // Wikipedia-Suche über das freie AllOrigins-Netzwerk tunneln
            const targetUrl = `https://wikipedia.org{encodeURIComponent(searchQuery)}&format=json`;
            const response = await fetch(`https://allorigins.win{encodeURIComponent(targetUrl)}`);
            
            if (response.ok) {
                const wrapper = await response.json();
                
                // WICHTIG: AllOrigins packt den Text in wrapper.contents. Das müssen wir erst parsen!
                if (wrapper && wrapper.contents) {
                    const data = JSON.parse(wrapper.contents);
                    
                    if (data && data.query && data.query.search && data.query.search.length > 0) {
                        let processedResults = [];
                        
                        data.query.search.forEach((item, index) => {
                            if (index < 4) { 
                                const cleanUrl = `https://wikipedia.org{encodeURIComponent(item.title.replace(/ /g, "_"))}`;
                                const cleanSnippet = item.snippet.replace(/<\/?[^>]+(>|$)/g, ""); // HTML-Tags säubern
                                
                                processedResults.push({
                                    title: item.title,
                                    url: cleanUrl,
                                    content: cleanSnippet + "..."
                                });
                            }
                        });
                        
                        if (processedResults.length > 0) {
                            return { results: processedResults }; // Echte Live-Daten gefunden! Schleife bricht ab.
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Fehler beim Verarbeiten der Live-Webdaten:", e);
        }
        
        attemptCounter++;
        // 2 Sekunden warten, damit die Server nicht überlastet werden und der Render-Server aufwachen kann
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}
