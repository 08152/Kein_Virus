// ====================================================================
// COMPLETER WEB-INDEXER FÜR GITHUB PAGES & LOKAL (1.js)
// ====================================================================

// TRAGE HIER DEINE KOPIERTE LINK-ADRESSE VON RENDER EIN!
// Falls du noch keinen Render-Server hast, lass die Adresse einfach so, 
// das Skript nutzt dann automatisch das integrierte Wikipedia-Ausfallsystem.
const meinEigenerServer = "https://onrender.com"; 

async function fetchWebResultsWithEndlessRetry(searchQuery, stepElement) {
    let attemptCounter = 1;
    
    // Unendliche Schleife (Infinity Loop) - Gibt niemals auf!
    while (true) {
        // --- 1. VERSUCH: ABFRAGE ÜBER DEINEN EIGENEN RENDER-SERVER ---
        if (meinEigenerServer && !meinEigenerServer.includes("DEIN-INDEXER-NAME")) {
            try {
                stepElement.innerHTML = `<div class="spinner"></div> Schritt 3: Render-Indexer sucht im Internet (Versuch #${attemptCounter}...)`;
                
                // Timeout-Sicherung für die Verbindung (4 Sekunden)
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), 4000);
                
                const response = await fetch(`${meinEigenerServer}/search?q=${encodeURIComponent(searchQuery)}`, { signal: controller.signal });
                clearTimeout(id);
                
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.results && data.results.length > 0) {
                        console.log("Erfolgreich abgerufen über eigenen Render-Server.");
                        return data; // Erfolg! Beendet die Schleife sofort
                    }
                }
            } catch (e) {
                console.warn("Render-Server antwortet nicht oder schläft noch. Schalte auf Ausfallsicherung...");
            }
        }

        // --- 2. VERSUCH: DIREKTE BACKUP-ABFRAGE ÜBER DAS OFFENE WEB (WIKIMEDIA NET) ---
        try {
            stepElement.innerHTML = `<div class="spinner"></div> Schritt 3: Nutze Web-Ausfallsicherung (Versuch #${attemptCounter}...)`;
            
            // 'origin=*' ist zwingend nötig, damit GitHub Pages nicht blockiert wird
            const fallbackUrl = `https://wikipedia.org{encodeURIComponent(searchQuery)}&format=json&origin=*`;
            
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 4000);
            
            const response = await fetch(fallbackUrl, { signal: controller.signal });
            clearTimeout(id);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data && data.query && data.query.search && data.query.search.length > 0) {
                    let processedResults = [];
                    
                    // Die besten 4 Internet-Quellen auslesen und formatieren
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
                        console.log("Erfolgreich abgerufen über Wikimedia-Ausfallsicherung.");
                        return { results: processedResults }; // Erfolg! Beendet die Schleife
                    }
                }
            }
        } catch (e) {
            console.error(`Ausfallsicherung blockiert (Versuch #${attemptCounter}). Wiederhole...`);
        }
        
        attemptCounter++;
        // 2 Sekunden Abkühlzeit vor der nächsten unendlichen Runde im Web
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}
