// STABILES OPEN-DATA SUCHSKRIPT (OPTIMIERT FÜR GITHUB PAGES & LOKAL)
async function fetchWebResultsWithEndlessRetry(searchQuery, stepElement) {
    let attemptCounter = 1;
    
    while (true) {
        try {
            // UI-Update für den Benutzer
            stepElement.innerHTML = `<div class="spinner"></div> Schritt 3: Durchsuche das offene Internet (Versuch #${attemptCounter}...)`;
            
            // Wir nutzen die offizielle, weltweit ausfallsichere Wikimedia API
            // 'origin=*' ist extrem wichtig, damit GitHub Pages und dein lokaler PC nicht blockiert werden!
            const openWebUrl = `https://wikipedia.org{encodeURIComponent(searchQuery)}&format=json&origin=*`;
            
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 4000); // 4 Sekunden Zeitlimit pro Versuch
            
            const response = await fetch(openWebUrl, { signal: controller.signal });
            clearTimeout(id);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data && data.query && data.query.search && data.query.search.length > 0) {
                    let processedResults = [];
                    
                    // Extrahiere die besten Quellen aus dem freien Web
                    data.query.search.forEach((item, index) => {
                        if (index < 4) { // Die besten 4 Internet-Ergebnisse
                            // Baue den sauberen, echten https:// Link zur Live-Webseite
                            const cleanUrl = `https://wikipedia.org{encodeURIComponent(item.title.replace(/ /g, "_"))}`;
                            
                            // Entferne unschöne HTML-Reste (<span class="searchmatch">) aus dem Vorschautext
                            const cleanSnippet = item.snippet.replace(/<\/?[^>]+(>|$)/g, "");
                            
                            processedResults.push({
                                title: item.title,
                                url: cleanUrl,
                                content: cleanSnippet + "..."
                            });
                        }
                    });
                    
                    if (processedResults.length > 0) {
                        return { results: processedResults }; // Suche erfolgreich! Beendet die Endlosschleife
                    }
                }
            }
        } catch (e) {
            console.warn(`Verbindungsaufbau fehlgeschlagen (Versuch ${attemptCounter}). Wiederhole über Ausfallsicherung...`);
        }
        
        attemptCounter++;
        // 1.5 Sekunden Pause vor dem nächsten automatischen Versuch im Netz (schützt vor IP-Sperren)
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
}

