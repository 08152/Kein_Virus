// ====================================================================
// CORE-PIPELINE: UNENDLICHE NETZWERK-SUCHSCHLEIFE (1.js)
// ====================================================================

const meinEigenerServer = "https://onrender.com"; 

async function executeWebPipeline(searchQuery, stepElement) {
    let attemptCounter = 1;
    
    while (true) {
        // Render-Server beim allerersten Durchlauf im Hintergrund aufwecken
        if (attemptCounter === 1) {
            fetch(meinEigenerServer).catch(() => {});
        }

        // WEG A: VERSUCH ÜBER DEINEN EIGENEN RENDER-SERVER
        try {
            stepElement.innerHTML = `<div class="spinner"></div> Schritt 3: Render-Indexer wird abgefragt (Versuch #${attemptCounter}...)`;
            
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 3500); // 3.5 Sek. schnelles Limit
            
            const response = await fetch(`${meinEigenerServer}/search?q=${encodeURIComponent(searchQuery)}`, { 
                signal: controller.signal 
            });
            clearTimeout(id);
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.results && data.results.length > 0) {
                    return data; // Server-Daten erfolgreich empfangen!
                }
            }
        } catch (e) {
            console.warn("Render-Server schläft noch. Starte Live-Tunneling...");
        }

        // WEG B: AUTOMATISCHE AUSFALLSICHERUNG ÜBER DEN ALLORIGINS-TUNNEL (WIKIPEDIA JSON-PARSING)
        try {
            stepElement.innerHTML = `<div class="spinner"></div> Schritt 3: Rufe Live-Web ab (Versuch #${attemptCounter}...)`;
            
            const targetUrl = `https://wikipedia.org{encodeURIComponent(searchQuery)}&format=json`;
            const response = await fetch(`https://allorigins.win{encodeURIComponent(targetUrl)}`);
            
            if (response.ok) {
                const wrapper = await response.json();
                
                if (wrapper && wrapper.contents) {
                    const data = JSON.parse(wrapper.contents);
                    
                    if (data && data.query && data.query.search && data.query.search.length > 0) {
                        let processedResults = [];
                        
                        data.query.search.forEach((item, index) => {
                            if (index < 4) { 
                                const cleanUrl = `https://wikipedia.org{encodeURIComponent(item.title.replace(/ /g, "_"))}`;
                                const cleanSnippet = item.snippet.replace(/<\/?[^>]+(>|$)/g, ""); // HTML-Müll säubern
                                
                                processedResults.push({
                                    title: item.title,
                                    url: cleanUrl,
                                    content: cleanSnippet + "..."
                                });
                            }
                        });
                        
                        if (processedResults.length > 0) {
                            return { results: processedResults }; // Daten erfolgreich extrahiert! Schleife bricht ab.
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Pipeline-Knoten blockiert, rotiere IP-Verbindung...", e);
        }
        
        attemptCounter++;
        // 2 Sekunden Abkühlzeit, um IP-Sperren zu verhindern und Render Zeit zum Booten zu geben
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}
        } // <-- Das ist die schließende Klammer vom "if (!deepSearchActive)"-Block

        // KI-BILDERZEUGUNG VIA POLLINATIONS GRAPHIC-NODES (NO-API)
        htmlOutput += `<h4>Generiertes KI-Bild:</h4><div class="img-grid">`;
        const prompt1 = encodeURIComponent(extractedMeaning + " realistic highly detailed cinematic lighting");
        const prompt2 = encodeURIComponent(extractedMeaning + " artistic digital painting concept art");
        
        if (longAnswerActive) {
            htmlOutput += `<img src="https://pollinations.ai{prompt1}?width=500&height=300&enhanced=true" alt="KI Bild 1" style="width:100%; object-fit:cover; border-radius:10px;">`;
            htmlOutput += `<img src="https://pollinations.ai{prompt2}?width=500&height=300&enhanced=true" alt="KI Bild 2" style="width:100%; object-fit:cover; border-radius:10px;">`;
        } else {
            htmlOutput += `<img src="https://pollinations.ai{prompt1}?width=600&height=350&enhanced=true" alt="Generiertes KI Bild" style="width:100%; object-fit:cover; border-radius:10px;">`;
        }
        htmlOutput += `</div>`;

        // Sprachausgabe-Button (Hier war der Fehler aus dem Screenshot behoben!)
        const escapedText = textToVoice.replace(/"/g, '&quot;').replace(/'/g, '\\\'');
        htmlOutput += `<br><button class="tts-btn" onclick="speakText(this, '${escapedText}')">🔊 Vorlesen</button>`;

        // Inhalt in die Chat-Sprechblase injizieren
        if (aiRow.querySelector('.reply-content')) {
            aiRow.querySelector('.reply-content').innerHTML = htmlOutput;
        }

    } catch (error) {
        if (aiRow.querySelector('.reply-content')) {
            aiRow.querySelector('.reply-content').innerHTML = `<p style="color:#ff4757;">⚠ Allgemeiner Systemfehler in der Daten-Pipeline.</p>`;
        }
    }

    // Automatisch nach ganz unten scrollen
    chatBox.scrollTop = chatBox.scrollHeight;
}

