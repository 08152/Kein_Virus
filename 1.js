// ====================================================================
// COMPLETER WEB-INDEXER FÜR GITHUB PAGES (1.js)
// ====================================================================

// Feste Verknüpfung mit deinem Render-Backend
const meinEigenerServer = "https://onrender.com"; 

async function fetchWebResultsWithEndlessRetry(searchQuery, stepElement) {
    let attemptCounter = 1;
    
    // Unendliche Schleife (Infinity Loop) - Sucht so lange, bis Ergebnisse da sind
    while (true) {
        
        // --- 1. PRIMÄRE ABFRAGE: ÜBER DEINEN EIGENEN RENDER-SERVER ---
        try {
            stepElement.innerHTML = `<div class="spinner"></div> Schritt 3: Render-Indexer sucht im Internet (Versuch #${attemptCounter}...)`;
            
            // Timeout-Sicherung (4 Sekunden für schnelle Reaktion)
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 4000);
            
            const response = await fetch(`${meinEigenerServer}/search?q=${encodeURIComponent(searchQuery)}`, { 
                signal: controller.signal 
            });
            clearTimeout(id);
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.results && data.results.length > 0) {
                    console.log("Erfolgreich abgerufen über eigenen Render-Server.");
                    return data; // Erfolg! Beendet die Endlosschleife sofort
                }
            }
        } catch (e) {
            console.warn("Render-Server antwortet nicht oder schläft noch. Schalte auf Ausfallsicherung...");
        }

        // --- 2. BACKUP-ABFRAGE: DIREKTES WIKIMEDIA-NETZ (FALLS RENDER OFFLINE IST) ---
        try {
            stepElement.innerHTML = `<div class="spinner"></div> Schritt 3: Nutze Web-Ausfallsicherung (Versuch #${attemptCounter}...)`;
            
            // 'origin=*' verhindert CORS-Sperren auf GitHub Pages
            const fallbackUrl = `https://wikipedia.org{encodeURIComponent(searchQuery)}&format=json&origin=*`;
            
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 4000);
            
            const response = await fetch(fallbackUrl, { signal: controller.signal });
            clearTimeout(id);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data && data.query && data.query.search && data.query.search.length > 0) {
                    let processedResults = [];
                    
                    // Die besten 4 Treffer extrahieren und für script.js formatieren
                    data.query.search.forEach((item, index) => {
                        if (index < 4) {
                            const cleanUrl = `https://wikipedia.org{encodeURIComponent(item.title.replace(/ /g, "_"))}`;
                            const cleanSnippet = item.snippet.replace(/<\/?[^>]+(>|$)/g, ""); // HTML säubern
                            
                            processedResults.push({
                                title: item.title,
                                url: cleanUrl,
                                content: cleanSnippet + "..."
                            });
                        }
                    });
                    
                    if (processedResults.length > 0) {
                        console.log("Erfolgreich abgerufen über Wikimedia-Ausfallsicherung.");
                        return { results: processedResults }; // Erfolg! Beendet die Schleife
                    }
                }
            }
        } catch (e) {
            console.error(`Ausfallsicherung blockiert (Versuch #${attemptCounter}). Wiederhole...`);
        }
        
        attemptCounter++;
        // 2.5 Sekunden Pause vor der nächsten Runde, um Server-Sperren zu vermeiden
        await new Promise(resolve => setTimeout(resolve, 2500));
    }
}
