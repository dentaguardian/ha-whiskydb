// Whisky — Carte Lovelace
// Projet indépendant dérivé de Millésime (github.com/Redsklns/ha-millesime,
// licence MIT) : même style d'architecture (Web Component vanilla, Shadow
// DOM, rendu par template strings), vocabulaire entièrement whisky.
//
// Commit 12/12 : packaging final — VERSION 1.0.0, socle v1 complet. Pas de
// changement fonctionnel côté carte depuis le commit 9 (suivi du niveau
// restant) ; le commit 8 avait ajouté le panneau de statistiques et la barre
// de recherche/filtres ; le commit 7, la liste (tuiles) et la fiche détail ;
// le commit 6, le formulaire d'ajout/édition et la reconnaissance photo
// Gemini.
//
// Les fonctions PURES (sans DOM) sont exportées en fin de fichier pour être
// testées avec Node (voir tests/), sans dépendre d'un navigateur ou de HA.

const DOMAIN = "whiskydb";
const VERSION = "1.3.0";

// ── i18n: mehrsprachige Oberfläche (Quellsprache Deutsch) ──
// Sprachwörterbücher: deutscher Quell-String -> Übersetzung.
// Fallback-Kette in tr(): Sprache -> Englisch -> Deutsch (Quelle).
const CARD_I18N = {
"en": {
  "% verbleibend": "% remaining",
  "(Einstellungen → Apps → Home Assistant → Berechtigungen → Kamera). ": "(Settings → Apps → Home Assistant → Permissions → Camera). ",
  "<em>Keine verwertbaren Felder.</em>": "<em>No usable fields.</em>",
  "API-Key ungültig oder vom Anbieter abgelehnt.": "API key invalid or rejected by the provider.",
  "Abbrechen": "Cancel",
  "Abfülljahr": "Bottling year",
  "Abgang": "Finish",
  "Aktualisieren": "Update",
  "Aktueller geschätzter Wert": "Current estimated value",
  "Alkoholgehalt (% vol)": "Alcohol content (% vol)",
  "Alle Status": "All statuses",
  "Alle Typen": "All types",
  "Allgemeine Notizen": "General notes",
  "Als leer markieren": "Mark as empty",
  "Alter (Jahre)": "Age (years)",
  "Analysiert das Etikett per KI — prüfe die Ergebnisse, bevor du speicherst.": "Analyses the label with AI — check the results before saving.",
  "Anfangsstatus": "Initial status",
  "Antwort abgeschnitten — bitte mit einem schärferen Foto erneut versuchen.": "Response truncated — please try again with a sharper photo.",
  "Antwort der KI nicht lesbar — bitte erneut versuchen.": "AI response unreadable — please try again.",
  "Anzahl": "Quantity",
  "Auf dem Foto wurden keine verwertbaren Informationen erkannt — bitte von Hand ergänzen.": "No usable information was recognised on the photo — please fill in manually.",
  "Ausgewählte Felder übernehmen": "Apply selected fields",
  "Barcode": "Barcode",
  "Batch": "Batch",
  "Bewertung (/5)": "Rating (/5)",
  "Bis dahin funktioniert der Weg über die Galerie.": "Until then, the gallery route keeps working.",
  "Datum": "Date",
  "Datum unbekannt": "Date unknown",
  "Der Name des Whiskys ist erforderlich.": "The whisky name is required.",
  "Destillationsjahr": "Distillation year",
  "Destillerie": "Distillery",
  "Destillerien": "Distilleries",
  "Diese Verkostung löschen": "Delete this tasting",
  "Diese Verkostung löschen?": "Delete this tasting?",
  "Dieses Exemplar entfernen?": "Remove this bottle?",
  "Durchschnittsalter (Jahre)": "Average age (years)",
  "Edition": "Edition",
  "Einträge": "Entries",
  "Einträge,": "entries,",
  "Einträgen angezeigt (": "entries shown (",
  "Enddatum unbekannt": "End date unknown",
  "Entfernen": "Remove",
  "Ergebnisse der Erkennung": "Recognition results",
  "Etikettenfoto (URL)": "Label photo (URL)",
  "Expression / Cuvée": "Expression / Cuvée",
  "Externe ID": "External ID",
  "Externer Link": "External link",
  "Fassnummer": "Cask number",
  "Fasstyp": "Cask type",
  "Fehler:": "Error:",
  "Feld(er) erkannt und automatisch übernommen — bitte prüfen und speichern.": "field(s) recognised and applied automatically — please review and save.",
  "Feld(er) übernommen — bitte prüfen und speichern.": "field(s) applied — please review and save.",
  "Felder werden automatisch in das Formular unten übernommen (außer bereits manuell ausgefüllte) — Häkchen anpassen, dann „Übernehmen“. Nichts wird gespeichert, bevor du das Formular abschickst.": "Fields are applied automatically to the form below (except those already filled in manually) — adjust the checkboxes, then click “Apply”. Nothing is saved until you submit the form.",
  "Finish (Cask Finish)": "Finish (Cask Finish)",
  "Flaschen": "Bottles",
  "Flaschen)": "bottles)",
  "Flaschennummer": "Bottle number",
  "Foto (URL)": "Photo (URL)",
  "Foto aus der Galerie: Der direkte Kamerazugriff ist nur über sichere ": "Photo from gallery: Direct camera access is only available over secure ",
  "Foto konnte nicht gelesen werden.": "Photo could not be read.",
  "Foto leer oder unlesbar.": "Photo empty or unreadable.",
  "Füllstand": "Fill level",
  "Für einen nur verkosteten Whisky (Bar, bei Freunden, Tasting) — ohne ihn in die Sammlung aufzunehmen.": "For a whisky you only tasted (bar, at a friend's, tasting) — without adding it to your collection.",
  "Gaumen": "Palate",
  "Gesamtkonfidenz:": "Overall confidence:",
  "Gesamtzahl produzierter Flaschen": "Total bottles produced",
  "Geöffnet": "Opened",
  "Hinzufügen": "Add",
  "Hoch": "High",
  "Ja": "Yes",
  "Jahre": "years",
  "KI-Dienst momentan nicht erreichbar.": "AI service currently unavailable.",
  "Kamerazugriff verweigert — prüfe die Berechtigungen der Home-Assistant-App ": "Camera access denied — check the Home Assistant app permissions ",
  "Kaufdatum": "Purchase date",
  "Kaufort": "Purchase location",
  "Kaufpreis": "Purchase price",
  "Kein Exemplar.": "No bottle.",
  "Kein KI-API-Key konfiguriert — hinterlege ihn in den Einstellungen der Integration oder gib die Daten von Hand ein.": "No AI API key configured — set it in the integration settings or enter the data manually.",
  "Kein Modell mit diesem API-Key erreichbar.": "No model reachable with this API key.",
  "Keine Einträge entsprechen diesen Filtern.": "No entries match these filters.",
  "Kommentar": "Comment",
  "Kühlfiltration": "Chill filtered",
  "Lagerort": "Storage location",
  "Land": "Country",
  "Leer": "Empty",
  "Leer seit": "Empty since",
  "Lieblinge": "Favourites",
  "Lieblingsflasche": "Favourite bottle",
  "Limitierte Edition": "Limited edition",
  "Marke": "Brand",
  "Mittel": "Medium",
  "Nach Destillerie": "By distillery",
  "Nach Land": "By country",
  "Nach Region": "By region",
  "Nach Typ": "By type",
  "Name *": "Name *",
  "Nase": "Nose",
  "Natürliche Farbe": "Natural colour",
  "Nein": "No",
  "Nicht angegeben": "Not specified",
  "Nicht einsortiert": "Not placed in rack",
  "Niedrig": "Low",
  "Noch kein Whisky vorhanden — klicke auf ➕ Hinzufügen, um deine Sammlung zu starten.": "No whisky yet — click ➕ Add to start your collection.",
  "Noch keine getrunkenen Whiskys — markiere eine Flasche als leer oder füge eine Verkostung außerhalb der Sammlung hinzu.": "No finished whiskies yet — mark a bottle as empty or add a tasting outside your collection.",
  "Ort der Verkostung": "Tasting location",
  "Persönliche Anmerkungen": "Personal notes",
  "Persönliche Bewertung (/5)": "Personal rating (/5)",
  "Phenole (ppm)": "Phenols (ppm)",
  "Platz": "Slot",
  "Regal": "Rack",
  "Region": "Region",
  "Reifungsdauer (Jahre)": "Maturation (years)",
  "Reifungsübersicht": "Maturation summary",
  "Schließen": "Close",
  "Speichern": "Save",
  "Standort der Destillerie": "Distillery location",
  "Tageslimit des KI-Anbieters überschritten — versuch es morgen erneut oder gib die Daten von Hand ein.": "AI provider daily limit exceeded — try again tomorrow or enter the data manually.",
  "Torfig": "Peated",
  "Torfigkeit": "Peatiness",
  "Typ": "Type",
  "Unabhängige Abfüllung": "Independent bottling",
  "Unabhängiger Abfüller": "Independent bottler",
  "Unbekannt": "Unknown",
  "Unbekannter Fehler.": "Unknown error.",
  "Ungültiger Füllstand (0 bis 100).": "Invalid fill level (0 to 100).",
  "Verbindungen (https) möglich. Das ist kein Fehler von WhiskyDB — ": "connections (https). This is not a WhiskyDB issue — ",
  "Verkostet am": "Tasted on",
  "Verkostung": "Tasting",
  "Versiegelt": "Sealed",
  "Verwaltung deiner Whisky-Sammlung: detaillierte Einträge, Fotoerkennung per KI, Statistiken.": "Manage your whisky collection: detailed entries, AI photo recognition, statistics.",
  "Volumen (ml)": "Volume (ml)",
  "Wert (aktueller Bestand)": "Value (current stock)",
  "Whisky bearbeiten": "Edit whisky",
  "Whisky hinzufügen": "Add whisky",
  "Whisky(s) getrunken": "whisky(s) drunk",
  "WhiskyDB — Sammlung": "WhiskyDB — Collection",
  "Whiskybase-ID (optional)": "Whiskybase ID (optional)",
  "Whiskybase-Link (optional)": "Whiskybase link (optional)",
  "Währung": "Currency",
  "Zeitüberschreitung — bitte erneut versuchen.": "Timed out — please try again.",
  "Zur Sammlung hinzufügen": "Add to collection",
  "[WhiskyDB] getUserMedia nicht verfügbar:": "[WhiskyDB] getUserMedia unavailable:",
  "aus der Sammlung,": "from the collection,",
  "außerhalb)": "outside)",
  "endgültig löschen — inklusive aller Exemplare?": "delete permanently — including all bottles?",
  "falls abweichend von der Destillerie": "if different from the distillery",
  "geöffnet": "opened",
  "geöffnet am": "opened on",
  "keine Flasche": "no bottle",
  "leer": "empty",
  "leer seit": "empty since",
  "nicht torfig": "not peated",
  "nimm das Foto mit deiner Kamera-App auf und wähle es dann in der Galerie, ": "take the photo with your camera app and then select it in the gallery, ",
  "oder verbinde dich über https (externe URL / Nabu Casa) für die Direktaufnahme.": "or connect via https (external URL / Nabu Casa) for direct capture.",
  "torfig": "peated",
  "versiegelt": "sealed",
  "von": "of",
  "z. B. 16 Year Old": "e.g. 16 Year Old",
  "z. B. 16, leer bei NAS": "e.g. 16, empty for NAS",
  "z. B. Bar Le Malt": "e.g. Bar Le Malt",
  "z. B. Islay": "e.g. Islay",
  "z. B. Lagavulin": "e.g. Lagavulin",
  "z. B. Lagavulin 16 Years Old": "e.g. Lagavulin 16 Years Old",
  "z. B. Schottland": "e.g. Scotland",
  "z. B. Talisker 18 Years Old": "e.g. Talisker 18 Years Old",
  "z. B. Wohnzimmerschrank": "e.g. living room cabinet",
  "z. B. leicht, mittel, stark": "e.g. light, medium, strong",
  "Öffnen": "Open",
  "✏️ Bearbeiten": "✏️ Edit",
  "➕ Exemplar hinzufügen": "➕ Add bottle",
  "➕ Hinzufügen": "➕ Add",
  "⭐ Notizen & Medien": "⭐ Notes & media",
  "🌍 Herkunft": "🌍 Origin",
  "🏷️ Klassifikation": "🏷️ Classification",
  "👃 Verkostung": "👃 Tasting",
  "💰 Persönliche Sammlung": "💰 Personal collection",
  "📊 Sammlungs-Statistiken": "📊 Collection statistics",
  "📊 Statistiken": "📊 Statistics",
  "📥 Beim Anlegen": "📥 On creation",
  "📦 Abfüllung": "📦 Bottling",
  "📷 Aufnehmen": "📷 Capture",
  "📷 Foto aufnehmen": "📷 Take photo",
  "🔎 Foto wird analysiert…": "🔎 Photo is being analysed…",
  "🔎 Name, Destillerie, Region…": "🔎 Name, distillery, region…",
  "🔗 Externe Referenzen": "🔗 External references",
  "🔬 Eigenschaften": "🔬 Properties",
  "🖼️ Galerie": "🖼️ Gallery",
  "🗑️ Löschen": "🗑️ Delete",
  "🛢️ Fassreifung": "🛢️ Cask maturation",
  "🥂 Außerhalb der Sammlung": "🥂 Outside the collection",
  "🥂 Getrunkene": "🥂 Finished",
  "🥂 Verkostung hinzufügen": "🥂 Add tasting",
  "🥃 Identität": "🥃 Identity",
  "🥃 Sammlung": "🥃 Collection",
  "🥃 WhiskyDB — Sammlung": "🥃 WhiskyDB — Collection"
},
"es": {
  "% verbleibend": "% restante",
  "(Einstellungen → Apps → Home Assistant → Berechtigungen → Kamera). ": "(Ajustes → Aplicaciones → Home Assistant → Permisos → Cámara). ",
  "<em>Keine verwertbaren Felder.</em>": "<em>No hay campos aprovechables.</em>",
  "API-Key ungültig oder vom Anbieter abgelehnt.": "Clave de API no válida o rechazada por el proveedor.",
  "Abbrechen": "Cancelar",
  "Abfülljahr": "Año de embotellado",
  "Abgang": "Final",
  "Aktualisieren": "Actualizar",
  "Aktueller geschätzter Wert": "Valor actual estimado",
  "Alkoholgehalt (% vol)": "Gradación alcohólica (% vol)",
  "Alle Status": "Todos los estados",
  "Alle Typen": "Todos los tipos",
  "Allgemeine Notizen": "Notas generales",
  "Als leer markieren": "Marcar como terminada",
  "Alter (Jahre)": "Edad (años)",
  "Analysiert das Etikett per KI — prüfe die Ergebnisse, bevor du speicherst.": "Analiza la etiqueta con IA — comprueba los resultados antes de guardar.",
  "Anfangsstatus": "Estado inicial",
  "Antwort abgeschnitten — bitte mit einem schärferen Foto erneut versuchen.": "Respuesta truncada — inténtalo de nuevo con una foto más nítida.",
  "Antwort der KI nicht lesbar — bitte erneut versuchen.": "Respuesta de la IA ilegible — inténtalo de nuevo.",
  "Anzahl": "Cantidad",
  "Auf dem Foto wurden keine verwertbaren Informationen erkannt — bitte von Hand ergänzen.": "No se reconoció información aprovechable en la foto — complétala manualmente.",
  "Ausgewählte Felder übernehmen": "Aplicar campos seleccionados",
  "Barcode": "Código de barras",
  "Batch": "Lote",
  "Bewertung (/5)": "Valoración (/5)",
  "Bis dahin funktioniert der Weg über die Galerie.": "Mientras tanto, la vía de la galería sigue funcionando.",
  "Datum": "Fecha",
  "Datum unbekannt": "Fecha desconocida",
  "Der Name des Whiskys ist erforderlich.": "El nombre del whisky es obligatorio.",
  "Destillationsjahr": "Año de destilación",
  "Destillerie": "Destilería",
  "Destillerien": "Destilerías",
  "Diese Verkostung löschen": "Eliminar esta degustación",
  "Diese Verkostung löschen?": "¿Eliminar esta degustación?",
  "Dieses Exemplar entfernen?": "¿Retirar esta botella?",
  "Durchschnittsalter (Jahre)": "Edad media (años)",
  "Edition": "Edición",
  "Einträge": "Entradas",
  "Einträge,": "entradas,",
  "Einträgen angezeigt (": "entradas mostradas (",
  "Enddatum unbekannt": "Fecha de fin desconocida",
  "Entfernen": "Retirar",
  "Ergebnisse der Erkennung": "Resultados del reconocimiento",
  "Etikettenfoto (URL)": "Foto de etiqueta (URL)",
  "Expression / Cuvée": "Expression / Cuvée",
  "Externe ID": "ID externo",
  "Externer Link": "Enlace externo",
  "Fassnummer": "Número de barrica",
  "Fasstyp": "Tipo de barrica",
  "Fehler:": "Error:",
  "Feld(er) erkannt und automatisch übernommen — bitte prüfen und speichern.": "campo(s) reconocido(s) y aplicado(s) automáticamente — revisa y guarda.",
  "Feld(er) übernommen — bitte prüfen und speichern.": "campo(s) aplicado(s) — revisa y guarda.",
  "Felder werden automatisch in das Formular unten übernommen (außer bereits manuell ausgefüllte) — Häkchen anpassen, dann „Übernehmen“. Nichts wird gespeichert, bevor du das Formular abschickst.": "Los campos se aplican automáticamente al formulario de abajo (excepto los ya rellenados a mano) — ajusta las casillas y pulsa «Aplicar». No se guarda nada hasta que envíes el formulario.",
  "Finish (Cask Finish)": "Finish (Cask Finish)",
  "Flaschen": "Botellas",
  "Flaschen)": "botellas)",
  "Flaschennummer": "Número de botella",
  "Foto (URL)": "Foto (URL)",
  "Foto aus der Galerie: Der direkte Kamerazugriff ist nur über sichere ": "Foto desde la galería: el acceso directo a la cámara solo funciona con ",
  "Foto konnte nicht gelesen werden.": "No se pudo leer la foto.",
  "Foto leer oder unlesbar.": "Foto vacía o ilegible.",
  "Füllstand": "Nivel de llenado",
  "Für einen nur verkosteten Whisky (Bar, bei Freunden, Tasting) — ohne ihn in die Sammlung aufzunehmen.": "Para un whisky solo degustado (bar, casa de amigos, cata) — sin añadirlo a la colección.",
  "Gaumen": "Paladar",
  "Gesamtkonfidenz:": "Confianza global:",
  "Gesamtzahl produzierter Flaschen": "Botellas totales producidas",
  "Geöffnet": "Abierta",
  "Hinzufügen": "Añadir",
  "Hoch": "Alta",
  "Ja": "Sí",
  "Jahre": "años",
  "KI-Dienst momentan nicht erreichbar.": "Servicio de IA no disponible en este momento.",
  "Kamerazugriff verweigert — prüfe die Berechtigungen der Home-Assistant-App ": "Acceso a la cámara denegado — comprueba los permisos de la app de Home Assistant ",
  "Kaufdatum": "Fecha de compra",
  "Kaufort": "Lugar de compra",
  "Kaufpreis": "Precio de compra",
  "Kein Exemplar.": "Sin botella.",
  "Kein KI-API-Key konfiguriert — hinterlege ihn in den Einstellungen der Integration oder gib die Daten von Hand ein.": "No hay clave de API de IA configurada — introdúcela en los ajustes de la integración o escribe los datos a mano.",
  "Kein Modell mit diesem API-Key erreichbar.": "No hay ningún modelo accesible con esta clave de API.",
  "Keine Einträge entsprechen diesen Filtern.": "Ninguna entrada coincide con estos filtros.",
  "Kommentar": "Comentario",
  "Kühlfiltration": "Filtrado en frío",
  "Lagerort": "Lugar de almacenaje",
  "Land": "País",
  "Leer": "Terminada",
  "Leer seit": "Terminada desde",
  "Lieblinge": "Favoritos",
  "Lieblingsflasche": "Botella favorita",
  "Limitierte Edition": "Edición limitada",
  "Marke": "Marca",
  "Mittel": "Media",
  "Nach Destillerie": "Por destilería",
  "Nach Land": "Por país",
  "Nach Region": "Por región",
  "Nach Typ": "Por tipo",
  "Name *": "Nombre *",
  "Nase": "Nariz",
  "Natürliche Farbe": "Color natural",
  "Nein": "No",
  "Nicht angegeben": "Sin especificar",
  "Nicht einsortiert": "Sin ubicar",
  "Niedrig": "Baja",
  "Noch kein Whisky vorhanden — klicke auf ➕ Hinzufügen, um deine Sammlung zu starten.": "Todavía no hay ningún whisky — pulsa ➕ Añadir para empezar tu colección.",
  "Noch keine getrunkenen Whiskys — markiere eine Flasche als leer oder füge eine Verkostung außerhalb der Sammlung hinzu.": "Todavía no hay whiskys terminados — marca una botella como terminada o añade una degustación fuera de la colección.",
  "Ort der Verkostung": "Lugar de la degustación",
  "Persönliche Anmerkungen": "Notas personales",
  "Persönliche Bewertung (/5)": "Valoración personal (/5)",
  "Phenole (ppm)": "Fenoles (ppm)",
  "Platz": "Hueco",
  "Regal": "Estantería",
  "Region": "Región",
  "Reifungsdauer (Jahre)": "Duración de crianza (años)",
  "Reifungsübersicht": "Resumen de crianza",
  "Schließen": "Cerrar",
  "Speichern": "Guardar",
  "Standort der Destillerie": "Ubicación de la destilería",
  "Tageslimit des KI-Anbieters überschritten — versuch es morgen erneut oder gib die Daten von Hand ein.": "Límite diario del proveedor de IA superado — inténtalo mañana o escribe los datos a mano.",
  "Torfig": "Con turba",
  "Torfigkeit": "Turba",
  "Typ": "Tipo",
  "Unabhängige Abfüllung": "Embotellado independiente",
  "Unabhängiger Abfüller": "Embotellador independiente",
  "Unbekannt": "Desconocida",
  "Unbekannter Fehler.": "Error desconocido.",
  "Ungültiger Füllstand (0 bis 100).": "Nivel de llenado no válido (0 a 100).",
  "Verbindungen (https) möglich. Das ist kein Fehler von WhiskyDB — ": "conexiones seguras (https). No es un fallo de WhiskyDB — ",
  "Verkostet am": "Degustado el",
  "Verkostung": "Degustación",
  "Versiegelt": "Sellada",
  "Verwaltung deiner Whisky-Sammlung: detaillierte Einträge, Fotoerkennung per KI, Statistiken.": "Gestiona tu colección de whiskys: entradas detalladas, reconocimiento de fotos con IA, estadísticas.",
  "Volumen (ml)": "Volumen (ml)",
  "Wert (aktueller Bestand)": "Valor (existencias actuales)",
  "Whisky bearbeiten": "Editar whisky",
  "Whisky hinzufügen": "Añadir whisky",
  "Whisky(s) getrunken": "whisky(s) bebido(s)",
  "WhiskyDB — Sammlung": "WhiskyDB — Colección",
  "Whiskybase-ID (optional)": "ID de Whiskybase (opcional)",
  "Whiskybase-Link (optional)": "Enlace de Whiskybase (opcional)",
  "Währung": "Moneda",
  "Zeitüberschreitung — bitte erneut versuchen.": "Tiempo de espera agotado — inténtalo de nuevo.",
  "Zur Sammlung hinzufügen": "Añadir a la colección",
  "[WhiskyDB] getUserMedia nicht verfügbar:": "[WhiskyDB] getUserMedia no disponible:",
  "aus der Sammlung,": "de la colección,",
  "außerhalb)": "fuera)",
  "endgültig löschen — inklusive aller Exemplare?": "¿eliminar definitivamente — incluidas todas las botellas?",
  "falls abweichend von der Destillerie": "si difiere de la destilería",
  "geöffnet": "abierta",
  "geöffnet am": "abierta el",
  "keine Flasche": "sin botella",
  "leer": "terminada",
  "leer seit": "terminada desde",
  "nicht torfig": "sin turba",
  "nimm das Foto mit deiner Kamera-App auf und wähle es dann in der Galerie, ": "haz la foto con tu app de cámara y selecciónala luego en la galería, ",
  "oder verbinde dich über https (externe URL / Nabu Casa) für die Direktaufnahme.": "o conéctate por https (URL externa / Nabu Casa) para la captura directa.",
  "torfig": "con turba",
  "versiegelt": "sellada",
  "von": "de",
  "z. B. 16 Year Old": "p. ej. 16 Year Old",
  "z. B. 16, leer bei NAS": "p. ej. 16, vacío para NAS",
  "z. B. Bar Le Malt": "p. ej. Bar Le Malt",
  "z. B. Islay": "p. ej. Islay",
  "z. B. Lagavulin": "p. ej. Lagavulin",
  "z. B. Lagavulin 16 Years Old": "p. ej. Lagavulin 16 Years Old",
  "z. B. Schottland": "p. ej. Escocia",
  "z. B. Talisker 18 Years Old": "p. ej. Talisker 18 Years Old",
  "z. B. Wohnzimmerschrank": "p. ej. aparador del salón",
  "z. B. leicht, mittel, stark": "p. ej. suave, medio, intenso",
  "Öffnen": "Abrir",
  "✏️ Bearbeiten": "✏️ Editar",
  "➕ Exemplar hinzufügen": "➕ Añadir botella",
  "➕ Hinzufügen": "➕ Añadir",
  "⭐ Notizen & Medien": "⭐ Notas y multimedia",
  "🌍 Herkunft": "🌍 Origen",
  "🏷️ Klassifikation": "🏷️ Clasificación",
  "👃 Verkostung": "👃 Degustación",
  "💰 Persönliche Sammlung": "💰 Colección personal",
  "📊 Sammlungs-Statistiken": "📊 Estadísticas de la colección",
  "📊 Statistiken": "📊 Estadísticas",
  "📥 Beim Anlegen": "📥 Al crear",
  "📦 Abfüllung": "📦 Embotellado",
  "📷 Aufnehmen": "📷 Capturar",
  "📷 Foto aufnehmen": "📷 Hacer foto",
  "🔎 Foto wird analysiert…": "🔎 Analizando la foto…",
  "🔎 Name, Destillerie, Region…": "🔎 Nombre, destilería, región…",
  "🔗 Externe Referenzen": "🔗 Referencias externas",
  "🔬 Eigenschaften": "🔬 Propiedades",
  "🖼️ Galerie": "🖼️ Galería",
  "🗑️ Löschen": "🗑️ Eliminar",
  "🛢️ Fassreifung": "🛢️ Crianza en barrica",
  "🥂 Außerhalb der Sammlung": "🥂 Fuera de la colección",
  "🥂 Getrunkene": "🥂 Whisky bebido",
  "🥂 Verkostung hinzufügen": "🥂 Añadir degustación",
  "🥃 Identität": "🥃 Identidad",
  "🥃 Sammlung": "🥃 Colección",
  "🥃 WhiskyDB — Sammlung": "🥃 WhiskyDB — Colección"
},
"fr": {
  "% verbleibend": "% restante",
  "(Einstellungen → Apps → Home Assistant → Berechtigungen → Kamera). ": "(Réglages → Applications → Home Assistant → Autorisations → Caméra). ",
  "<em>Keine verwertbaren Felder.</em>": "<em>Aucun champ exploitable.</em>",
  "API-Key ungültig oder vom Anbieter abgelehnt.": "Clé d'API invalide ou refusée par le fournisseur.",
  "Abbrechen": "Annuler",
  "Abfülljahr": "Année de mise en bouteille",
  "Abgang": "Finale",
  "Aktualisieren": "Mettre à jour",
  "Aktueller geschätzter Wert": "Valeur actuelle estimée",
  "Alkoholgehalt (% vol)": "Taux d'alcool (% vol)",
  "Alle Status": "Tous les statuts",
  "Alle Typen": "Tous les types",
  "Allgemeine Notizen": "Notes générales",
  "Als leer markieren": "Marquer comme terminée",
  "Alter (Jahre)": "Âge (années)",
  "Analysiert das Etikett per KI — prüfe die Ergebnisse, bevor du speicherst.": "Analyse l'étiquette par IA — vérifie les résultats avant d'enregistrer.",
  "Anfangsstatus": "Statut initial",
  "Antwort abgeschnitten — bitte mit einem schärferen Foto erneut versuchen.": "Réponse tronquée — veuillez réessayer avec une photo plus nette.",
  "Antwort der KI nicht lesbar — bitte erneut versuchen.": "Réponse de l'IA illisible — veuillez réessayer.",
  "Anzahl": "Quantité",
  "Auf dem Foto wurden keine verwertbaren Informationen erkannt — bitte von Hand ergänzen.": "Aucune information exploitable reconnue sur la photo — veuillez compléter à la main.",
  "Ausgewählte Felder übernehmen": "Appliquer les champs sélectionnés",
  "Barcode": "Code-barres",
  "Batch": "Batch",
  "Bewertung (/5)": "Note (/5)",
  "Bis dahin funktioniert der Weg über die Galerie.": "D'ici là, le passage par la galerie fonctionne.",
  "Datum": "Date",
  "Datum unbekannt": "Date inconnue",
  "Der Name des Whiskys ist erforderlich.": "Le nom du whisky est requis.",
  "Destillationsjahr": "Année de distillation",
  "Destillerie": "Distillerie",
  "Destillerien": "Distilleries",
  "Diese Verkostung löschen": "Supprimer cette dégustation",
  "Diese Verkostung löschen?": "Supprimer cette dégustation ?",
  "Dieses Exemplar entfernen?": "Retirer cet exemplaire ?",
  "Durchschnittsalter (Jahre)": "Âge moyen (années)",
  "Edition": "Édition",
  "Einträge": "Entrées",
  "Einträge,": "entrées,",
  "Einträgen angezeigt (": "entrées affichées (",
  "Enddatum unbekannt": "Date de fin inconnue",
  "Entfernen": "Retirer",
  "Ergebnisse der Erkennung": "Résultats de la reconnaissance",
  "Etikettenfoto (URL)": "Photo d'étiquette (URL)",
  "Expression / Cuvée": "Expression / Cuvée",
  "Externe ID": "ID externe",
  "Externer Link": "Lien externe",
  "Fassnummer": "Numéro de fût",
  "Fasstyp": "Type de fût",
  "Fehler:": "Erreur :",
  "Feld(er) erkannt und automatisch übernommen — bitte prüfen und speichern.": "champ(s) reconnu(s) et appliqué(s) automatiquement — vérifie puis enregistre.",
  "Feld(er) übernommen — bitte prüfen und speichern.": "champ(s) appliqué(s) — vérifie puis enregistre.",
  "Felder werden automatisch in das Formular unten übernommen (außer bereits manuell ausgefüllte) — Häkchen anpassen, dann „Übernehmen“. Nichts wird gespeichert, bevor du das Formular abschickst.": "Les champs sont reportés automatiquement dans le formulaire ci-dessous (sauf ceux déjà remplis à la main) — ajuste les cases, puis « Appliquer ». Rien n'est enregistré avant l'envoi du formulaire.",
  "Finish (Cask Finish)": "Finish (Cask Finish)",
  "Flaschen": "Bouteilles",
  "Flaschen)": "bouteilles)",
  "Flaschennummer": "Numéro de bouteille",
  "Foto (URL)": "Photo (URL)",
  "Foto aus der Galerie: Der direkte Kamerazugriff ist nur über sichere ": "Photo depuis la galerie : l'accès direct à la caméra n'est possible que via une ",
  "Foto konnte nicht gelesen werden.": "Impossible de lire la photo.",
  "Foto leer oder unlesbar.": "Photo vide ou illisible.",
  "Füllstand": "Niveau restant",
  "Für einen nur verkosteten Whisky (Bar, bei Freunden, Tasting) — ohne ihn in die Sammlung aufzunehmen.": "Pour un whisky simplement dégusté (bar, chez des amis, tasting) — sans l'ajouter à la collection.",
  "Gaumen": "Bouche",
  "Gesamtkonfidenz:": "Confiance globale :",
  "Gesamtzahl produzierter Flaschen": "Nombre total de bouteilles produites",
  "Geöffnet": "Ouverte",
  "Hinzufügen": "Ajouter",
  "Hoch": "Haute",
  "Ja": "Oui",
  "Jahre": "ans",
  "KI-Dienst momentan nicht erreichbar.": "Service IA momentanément indisponible.",
  "Kamerazugriff verweigert — prüfe die Berechtigungen der Home-Assistant-App ": "Accès caméra refusé — vérifie les autorisations de l'application Home Assistant ",
  "Kaufdatum": "Date d'achat",
  "Kaufort": "Lieu d'achat",
  "Kaufpreis": "Prix d'achat",
  "Kein Exemplar.": "Aucun exemplaire.",
  "Kein KI-API-Key konfiguriert — hinterlege ihn in den Einstellungen der Integration oder gib die Daten von Hand ein.": "Aucune clé d'API IA configurée — renseigne-la dans les paramètres de l'intégration ou saisis les données à la main.",
  "Kein Modell mit diesem API-Key erreichbar.": "Aucun modèle accessible avec cette clé d'API.",
  "Keine Einträge entsprechen diesen Filtern.": "Aucune entrée ne correspond à ces filtres.",
  "Kommentar": "Commentaire",
  "Kühlfiltration": "Filtrage à froid",
  "Lagerort": "Lieu de stockage",
  "Land": "Pays",
  "Leer": "Terminée",
  "Leer seit": "Terminée depuis",
  "Lieblinge": "Favoris",
  "Lieblingsflasche": "Bouteille favorite",
  "Limitierte Edition": "Édition limitée",
  "Marke": "Marque",
  "Mittel": "Moyenne",
  "Nach Destillerie": "Par distillerie",
  "Nach Land": "Par pays",
  "Nach Region": "Par région",
  "Nach Typ": "Par type",
  "Name *": "Nom *",
  "Nase": "Nez",
  "Natürliche Farbe": "Couleur naturelle",
  "Nein": "Non",
  "Nicht angegeben": "Non renseigné",
  "Nicht einsortiert": "Non rangé",
  "Niedrig": "Basse",
  "Noch kein Whisky vorhanden — klicke auf ➕ Hinzufügen, um deine Sammlung zu starten.": "Aucun whisky pour l'instant — clique sur ➕ Ajouter pour démarrer ta collection.",
  "Noch keine getrunkenen Whiskys — markiere eine Flasche als leer oder füge eine Verkostung außerhalb der Sammlung hinzu.": "Aucun whisky bu pour l'instant — marque une bouteille comme terminée ou ajoute une dégustation hors collection.",
  "Ort der Verkostung": "Lieu de dégustation",
  "Persönliche Anmerkungen": "Remarques personnelles",
  "Persönliche Bewertung (/5)": "Note personnelle (/5)",
  "Phenole (ppm)": "Phénols (ppm)",
  "Platz": "Emplacement",
  "Regal": "Étagère",
  "Region": "Région",
  "Reifungsdauer (Jahre)": "Durée d'élevage (années)",
  "Reifungsübersicht": "Résumé de l'élevage",
  "Schließen": "Fermer",
  "Speichern": "Enregistrer",
  "Standort der Destillerie": "Localisation de la distillerie",
  "Tageslimit des KI-Anbieters überschritten — versuch es morgen erneut oder gib die Daten von Hand ein.": "Limite quotidienne du fournisseur d'IA dépassée — réessaie demain ou saisis les données à la main.",
  "Torfig": "Tourbé",
  "Torfigkeit": "Tourbe",
  "Typ": "Type",
  "Unabhängige Abfüllung": "Mise en bouteille indépendante",
  "Unabhängiger Abfüller": "Embouteilleur indépendant",
  "Unbekannt": "Inconnue",
  "Unbekannter Fehler.": "Erreur inconnue.",
  "Ungültiger Füllstand (0 bis 100).": "Niveau restant invalide (0 à 100).",
  "Verbindungen (https) möglich. Das ist kein Fehler von WhiskyDB — ": "connexion sécurisée (https). Ce n'est pas un défaut de WhiskyDB — ",
  "Verkostet am": "Dégusté le",
  "Verkostung": "Dégustation",
  "Versiegelt": "Scellée",
  "Verwaltung deiner Whisky-Sammlung: detaillierte Einträge, Fotoerkennung per KI, Statistiken.": "Gère ta collection de whiskys : entrées détaillées, reconnaissance photo par IA, statistiques.",
  "Volumen (ml)": "Volume (ml)",
  "Wert (aktueller Bestand)": "Valeur (stock actuel)",
  "Whisky bearbeiten": "Modifier le whisky",
  "Whisky hinzufügen": "Ajouter un whisky",
  "Whisky(s) getrunken": "whisky(s) bu(s)",
  "WhiskyDB — Sammlung": "WhiskyDB — Collection",
  "Whiskybase-ID (optional)": "ID Whiskybase (optionnel)",
  "Whiskybase-Link (optional)": "Lien Whiskybase (optionnel)",
  "Währung": "Devise",
  "Zeitüberschreitung — bitte erneut versuchen.": "Délai dépassé — veuillez réessayer.",
  "Zur Sammlung hinzufügen": "Ajouter à la collection",
  "[WhiskyDB] getUserMedia nicht verfügbar:": "[WhiskyDB] getUserMedia indisponible :",
  "aus der Sammlung,": "de la collection,",
  "außerhalb)": "hors collection)",
  "endgültig löschen — inklusive aller Exemplare?": "supprimer définitivement — y compris tous les exemplaires ?",
  "falls abweichend von der Destillerie": "si différent de la distillerie",
  "geöffnet": "ouverte",
  "geöffnet am": "ouverte le",
  "keine Flasche": "aucune bouteille",
  "leer": "terminée",
  "leer seit": "terminée depuis",
  "nicht torfig": "non tourbé",
  "nimm das Foto mit deiner Kamera-App auf und wähle es dann in der Galerie, ": "prends la photo avec ton application caméra puis sélectionne-la dans la galerie, ",
  "oder verbinde dich über https (externe URL / Nabu Casa) für die Direktaufnahme.": "ou connecte-toi via https (URL externe / Nabu Casa) pour la prise de vue directe.",
  "torfig": "tourbé",
  "versiegelt": "scellée",
  "von": "sur",
  "z. B. 16 Year Old": "ex. 16 Year Old",
  "z. B. 16, leer bei NAS": "ex. 16, vide pour un NAS",
  "z. B. Bar Le Malt": "ex. Bar Le Malt",
  "z. B. Islay": "ex. Islay",
  "z. B. Lagavulin": "ex. Lagavulin",
  "z. B. Lagavulin 16 Years Old": "ex. Lagavulin 16 Years Old",
  "z. B. Schottland": "ex. Écosse",
  "z. B. Talisker 18 Years Old": "ex. Talisker 18 Years Old",
  "z. B. Wohnzimmerschrank": "ex. buffet du salon",
  "z. B. leicht, mittel, stark": "ex. léger, moyen, prononcé",
  "Öffnen": "Ouvrir",
  "✏️ Bearbeiten": "✏️ Modifier",
  "➕ Exemplar hinzufügen": "➕ Ajouter un exemplaire",
  "➕ Hinzufügen": "➕ Ajouter",
  "⭐ Notizen & Medien": "⭐ Notes & médias",
  "🌍 Herkunft": "🌍 Origine",
  "🏷️ Klassifikation": "🏷️ Classification",
  "👃 Verkostung": "👃 Dégustation",
  "💰 Persönliche Sammlung": "💰 Collection personnelle",
  "📊 Sammlungs-Statistiken": "📊 Statistiques de la collection",
  "📊 Statistiken": "📊 Statistiques",
  "📥 Beim Anlegen": "📥 À la création",
  "📦 Abfüllung": "📦 Mise en bouteille",
  "📷 Aufnehmen": "📷 Capturer",
  "📷 Foto aufnehmen": "📷 Prendre une photo",
  "🔎 Foto wird analysiert…": "🔎 Analyse de la photo…",
  "🔎 Name, Destillerie, Region…": "🔎 Nom, distillerie, région…",
  "🔗 Externe Referenzen": "🔗 Références externes",
  "🔬 Eigenschaften": "🔬 Caractéristiques",
  "🖼️ Galerie": "🖼️ Galerie",
  "🗑️ Löschen": "🗑️ Supprimer",
  "🛢️ Fassreifung": "🛢️ Élevage en fût",
  "🥂 Außerhalb der Sammlung": "🥂 Hors collection",
  "🥂 Getrunkene": "🥂 Whisky bu",
  "🥂 Verkostung hinzufügen": "🥂 Ajouter une dégustation",
  "🥃 Identität": "🥃 Identité",
  "🥃 Sammlung": "🥃 Collection",
  "🥃 WhiskyDB — Sammlung": "🥃 WhiskyDB — Collection"
},
"it": {
  "% verbleibend": "% rimanente",
  "(Einstellungen → Apps → Home Assistant → Berechtigungen → Kamera). ": "(Impostazioni → App → Home Assistant → Permessi → Fotocamera). ",
  "<em>Keine verwertbaren Felder.</em>": "<em>Nessun campo utilizzabile.</em>",
  "API-Key ungültig oder vom Anbieter abgelehnt.": "Chiave API non valida o rifiutata dal fornitore.",
  "Abbrechen": "Annulla",
  "Abfülljahr": "Anno di imbottigliamento",
  "Abgang": "Finale",
  "Aktualisieren": "Aggiorna",
  "Aktueller geschätzter Wert": "Valore attuale stimato",
  "Alkoholgehalt (% vol)": "Gradazione alcolica (% vol)",
  "Alle Status": "Tutti gli stati",
  "Alle Typen": "Tutti i tipi",
  "Allgemeine Notizen": "Note generali",
  "Als leer markieren": "Segna come terminata",
  "Alter (Jahre)": "Età (anni)",
  "Analysiert das Etikett per KI — prüfe die Ergebnisse, bevor du speicherst.": "Analizza l'etichetta con l'IA — controlla i risultati prima di salvare.",
  "Anfangsstatus": "Stato iniziale",
  "Antwort abgeschnitten — bitte mit einem schärferen Foto erneut versuchen.": "Risposta troncata — riprova con una foto più nitida.",
  "Antwort der KI nicht lesbar — bitte erneut versuchen.": "Risposta dell'IA illeggibile — riprova.",
  "Anzahl": "Quantità",
  "Auf dem Foto wurden keine verwertbaren Informationen erkannt — bitte von Hand ergänzen.": "Nessuna informazione utile riconosciuta nella foto — completala a mano.",
  "Ausgewählte Felder übernehmen": "Applica campi selezionati",
  "Barcode": "Codice a barre",
  "Batch": "Batch",
  "Bewertung (/5)": "Valutazione (/5)",
  "Bis dahin funktioniert der Weg über die Galerie.": "Nel frattempo, il percorso via galleria continua a funzionare.",
  "Datum": "Data",
  "Datum unbekannt": "Data sconosciuta",
  "Der Name des Whiskys ist erforderlich.": "Il nome del whisky è obbligatorio.",
  "Destillationsjahr": "Anno di distillazione",
  "Destillerie": "Distilleria",
  "Destillerien": "Distillerie",
  "Diese Verkostung löschen": "Elimina questa degustazione",
  "Diese Verkostung löschen?": "Eliminare questa degustazione?",
  "Dieses Exemplar entfernen?": "Rimuovere questa bottiglia?",
  "Durchschnittsalter (Jahre)": "Età media (anni)",
  "Edition": "Edizione",
  "Einträge": "Voci",
  "Einträge,": "voci,",
  "Einträgen angezeigt (": "voci mostrate (",
  "Enddatum unbekannt": "Data di fine sconosciuta",
  "Entfernen": "Rimuovi",
  "Ergebnisse der Erkennung": "Risultati del riconoscimento",
  "Etikettenfoto (URL)": "Foto etichetta (URL)",
  "Expression / Cuvée": "Expression / Cuvée",
  "Externe ID": "ID esterno",
  "Externer Link": "Link esterno",
  "Fassnummer": "Numero della botte",
  "Fasstyp": "Tipo di botte",
  "Fehler:": "Errore:",
  "Feld(er) erkannt und automatisch übernommen — bitte prüfen und speichern.": "campo/i riconosciuto/i e applicato/i automaticamente — controlla e salva.",
  "Feld(er) übernommen — bitte prüfen und speichern.": "campo/i applicato/i — controlla e salva.",
  "Felder werden automatisch in das Formular unten übernommen (außer bereits manuell ausgefüllte) — Häkchen anpassen, dann „Übernehmen“. Nichts wird gespeichert, bevor du das Formular abschickst.": "I campi vengono riportati automaticamente nel modulo qui sotto (tranne quelli già compilati a mano) — regola le spunte, poi premi «Applica». Nulla viene salvato prima di inviare il modulo.",
  "Finish (Cask Finish)": "Finish (Cask Finish)",
  "Flaschen": "Bottiglie",
  "Flaschen)": "bottiglie)",
  "Flaschennummer": "Numero di bottiglia",
  "Foto (URL)": "Foto (URL)",
  "Foto aus der Galerie: Der direkte Kamerazugriff ist nur über sichere ": "Foto dalla galleria: l'accesso diretto alla fotocamera funziona solo con ",
  "Foto konnte nicht gelesen werden.": "Impossibile leggere la foto.",
  "Foto leer oder unlesbar.": "Foto vuota o illeggibile.",
  "Füllstand": "Livello rimanente",
  "Für einen nur verkosteten Whisky (Bar, bei Freunden, Tasting) — ohne ihn in die Sammlung aufzunehmen.": "Per un whisky solo degustato (bar, da amici, tasting) — senza aggiungerlo alla collezione.",
  "Gaumen": "Palato",
  "Gesamtkonfidenz:": "Confidenza globale:",
  "Gesamtzahl produzierter Flaschen": "Bottiglie totali prodotte",
  "Geöffnet": "Aperta",
  "Hinzufügen": "Aggiungi",
  "Hoch": "Alta",
  "Ja": "Sì",
  "Jahre": "anni",
  "KI-Dienst momentan nicht erreichbar.": "Servizio IA momentaneamente non raggiungibile.",
  "Kamerazugriff verweigert — prüfe die Berechtigungen der Home-Assistant-App ": "Accesso alla fotocamera negato — controlla i permessi dell'app Home Assistant ",
  "Kaufdatum": "Data di acquisto",
  "Kaufort": "Luogo di acquisto",
  "Kaufpreis": "Prezzo di acquisto",
  "Kein Exemplar.": "Nessuna bottiglia.",
  "Kein KI-API-Key konfiguriert — hinterlege ihn in den Einstellungen der Integration oder gib die Daten von Hand ein.": "Nessuna chiave API IA configurata — inseriscila nelle impostazioni dell'integrazione oppure compila i dati a mano.",
  "Kein Modell mit diesem API-Key erreichbar.": "Nessun modello raggiungibile con questa chiave API.",
  "Keine Einträge entsprechen diesen Filtern.": "Nessuna voce corrisponde a questi filtri.",
  "Kommentar": "Commento",
  "Kühlfiltration": "Filtrazione a freddo",
  "Lagerort": "Luogo di conservazione",
  "Land": "Paese",
  "Leer": "Terminata",
  "Leer seit": "Terminata dal",
  "Lieblinge": "Preferiti",
  "Lieblingsflasche": "Bottiglia preferita",
  "Limitierte Edition": "Edizione limitata",
  "Marke": "Marca",
  "Mittel": "Media",
  "Nach Destillerie": "Per distilleria",
  "Nach Land": "Per paese",
  "Nach Region": "Per regione",
  "Nach Typ": "Per tipo",
  "Name *": "Nome *",
  "Nase": "Naso",
  "Natürliche Farbe": "Colore naturale",
  "Nein": "No",
  "Nicht angegeben": "Non specificato",
  "Nicht einsortiert": "Non riposta",
  "Niedrig": "Bassa",
  "Noch kein Whisky vorhanden — klicke auf ➕ Hinzufügen, um deine Sammlung zu starten.": "Ancora nessun whisky — premi ➕ Aggiungi per iniziare la tua collezione.",
  "Noch keine getrunkenen Whiskys — markiere eine Flasche als leer oder füge eine Verkostung außerhalb der Sammlung hinzu.": "Ancora nessun whisky terminato — segna una bottiglia come terminata oppure aggiungi una degustazione fuori dalla collezione.",
  "Ort der Verkostung": "Luogo della degustazione",
  "Persönliche Anmerkungen": "Note personali",
  "Persönliche Bewertung (/5)": "Valutazione personale (/5)",
  "Phenole (ppm)": "Fenoli (ppm)",
  "Platz": "Postazione",
  "Regal": "Mensola",
  "Region": "Regione",
  "Reifungsdauer (Jahre)": "Durata di invecchiamento (anni)",
  "Reifungsübersicht": "Riepilogo invecchiamento",
  "Schließen": "Chiudi",
  "Speichern": "Salva",
  "Standort der Destillerie": "Località della distilleria",
  "Tageslimit des KI-Anbieters überschritten — versuch es morgen erneut oder gib die Daten von Hand ein.": "Limite giornaliero del fornitore IA superato — riprova domani oppure compila i dati a mano.",
  "Torfig": "Torbato",
  "Torfigkeit": "Torbatura",
  "Typ": "Tipo",
  "Unabhängige Abfüllung": "Imbottigliamento indipendente",
  "Unabhängiger Abfüller": "Imbottigliatore indipendente",
  "Unbekannt": "Sconosciuta",
  "Unbekannter Fehler.": "Errore sconosciuto.",
  "Ungültiger Füllstand (0 bis 100).": "Livello non valido (da 0 a 100).",
  "Verbindungen (https) möglich. Das ist kein Fehler von WhiskyDB — ": "connessioni sicure (https). Non è un difetto di WhiskyDB — ",
  "Verkostet am": "Degustato il",
  "Verkostung": "Degustazione",
  "Versiegelt": "Sigillata",
  "Verwaltung deiner Whisky-Sammlung: detaillierte Einträge, Fotoerkennung per KI, Statistiken.": "Gestisci la tua collezione di whisky: voci dettagliate, riconoscimento foto via IA, statistiche.",
  "Volumen (ml)": "Volume (ml)",
  "Wert (aktueller Bestand)": "Valore (scorta attuale)",
  "Whisky bearbeiten": "Modifica whisky",
  "Whisky hinzufügen": "Aggiungi whisky",
  "Whisky(s) getrunken": "whisky bevuto/i",
  "WhiskyDB — Sammlung": "WhiskyDB — Collezione",
  "Whiskybase-ID (optional)": "ID Whiskybase (opzionale)",
  "Whiskybase-Link (optional)": "Link Whiskybase (opzionale)",
  "Währung": "Valuta",
  "Zeitüberschreitung — bitte erneut versuchen.": "Timeout — riprova.",
  "Zur Sammlung hinzufügen": "Aggiungi alla collezione",
  "[WhiskyDB] getUserMedia nicht verfügbar:": "[WhiskyDB] getUserMedia non disponibile:",
  "aus der Sammlung,": "dalla collezione,",
  "außerhalb)": "fuori)",
  "endgültig löschen — inklusive aller Exemplare?": "eliminare definitivamente — incluse tutte le bottiglie?",
  "falls abweichend von der Destillerie": "se diverso dalla distilleria",
  "geöffnet": "aperta",
  "geöffnet am": "aperta il",
  "keine Flasche": "nessuna bottiglia",
  "leer": "terminata",
  "leer seit": "terminata dal",
  "nicht torfig": "non torbato",
  "nimm das Foto mit deiner Kamera-App auf und wähle es dann in der Galerie, ": "scatta la foto con l'app fotocamera e poi selezionala nella galleria, ",
  "oder verbinde dich über https (externe URL / Nabu Casa) für die Direktaufnahme.": "oppure collegati via https (URL esterno / Nabu Casa) per lo scatto diretto.",
  "torfig": "torbato",
  "versiegelt": "sigillata",
  "von": "su",
  "z. B. 16 Year Old": "es. 16 Year Old",
  "z. B. 16, leer bei NAS": "es. 16, vuoto per NAS",
  "z. B. Bar Le Malt": "es. Bar Le Malt",
  "z. B. Islay": "es. Islay",
  "z. B. Lagavulin": "es. Lagavulin",
  "z. B. Lagavulin 16 Years Old": "es. Lagavulin 16 Years Old",
  "z. B. Schottland": "es. Scozia",
  "z. B. Talisker 18 Years Old": "es. Talisker 18 Years Old",
  "z. B. Wohnzimmerschrank": "es. mobile del salotto",
  "z. B. leicht, mittel, stark": "es. leggero, medio, intenso",
  "Öffnen": "Apri",
  "✏️ Bearbeiten": "✏️ Modifica",
  "➕ Exemplar hinzufügen": "➕ Aggiungi bottiglia",
  "➕ Hinzufügen": "➕ Aggiungi",
  "⭐ Notizen & Medien": "⭐ Note e media",
  "🌍 Herkunft": "🌍 Origine",
  "🏷️ Klassifikation": "🏷️ Classificazione",
  "👃 Verkostung": "👃 Degustazione",
  "💰 Persönliche Sammlung": "💰 Collezione personale",
  "📊 Sammlungs-Statistiken": "📊 Statistiche della collezione",
  "📊 Statistiken": "📊 Statistiche",
  "📥 Beim Anlegen": "📥 Alla creazione",
  "📦 Abfüllung": "📦 Imbottigliamento",
  "📷 Aufnehmen": "📷 Scatta",
  "📷 Foto aufnehmen": "📷 Scatta foto",
  "🔎 Foto wird analysiert…": "🔎 Analisi della foto…",
  "🔎 Name, Destillerie, Region…": "🔎 Nome, distilleria, regione…",
  "🔗 Externe Referenzen": "🔗 Riferimenti esterni",
  "🔬 Eigenschaften": "🔬 Caratteristiche",
  "🖼️ Galerie": "🖼️ Galleria",
  "🗑️ Löschen": "🗑️ Elimina",
  "🛢️ Fassreifung": "🛢️ Invecchiamento in botte",
  "🥂 Außerhalb der Sammlung": "🥂 Fuori dalla collezione",
  "🥂 Getrunkene": "🥂 Whisky bevuti",
  "🥂 Verkostung hinzufügen": "🥂 Aggiungi degustazione",
  "🥃 Identität": "🥃 Identità",
  "🥃 Sammlung": "🥃 Collezione",
  "🥃 WhiskyDB — Sammlung": "🥃 WhiskyDB — Collezione"
},
"ja": {
  "% verbleibend": "% 残量",
  "(Einstellungen → Apps → Home Assistant → Berechtigungen → Kamera). ": "(設定 → アプリ → Home Assistant → 権限 → カメラ)。 ",
  "<em>Keine verwertbaren Felder.</em>": "<em>利用可能なフィールドがありません。</em>",
  "API-Key ungültig oder vom Anbieter abgelehnt.": "APIキーが無効か、プロバイダーに拒否されました。",
  "Abbrechen": "キャンセル",
  "Abfülljahr": "ボトリング年",
  "Abgang": "フィニッシュ",
  "Aktualisieren": "更新",
  "Aktueller geschätzter Wert": "現在の推定価値",
  "Alkoholgehalt (% vol)": "アルコール度数 (% vol)",
  "Alle Status": "すべてのステータス",
  "Alle Typen": "すべてのタイプ",
  "Allgemeine Notizen": "一般メモ",
  "Als leer markieren": "空きボトルにする",
  "Alter (Jahre)": "熟成年数 (年)",
  "Analysiert das Etikett per KI — prüfe die Ergebnisse, bevor du speicherst.": "AIでラベルを解析します — 保存前に結果をご確認ください。",
  "Anfangsstatus": "初期ステータス",
  "Antwort abgeschnitten — bitte mit einem schärferen Foto erneut versuchen.": "応答が途切れました — より鮮明な写真でもう一度お試しください。",
  "Antwort der KI nicht lesbar — bitte erneut versuchen.": "AIの応答を読み取れません — もう一度お試しください。",
  "Anzahl": "本数",
  "Auf dem Foto wurden keine verwertbaren Informationen erkannt — bitte von Hand ergänzen.": "写真から利用可能な情報を認識できませんでした — 手動で入力してください。",
  "Ausgewählte Felder übernehmen": "選択したフィールドを適用",
  "Barcode": "バーコード",
  "Batch": "バッチ",
  "Bewertung (/5)": "評価 (/5)",
  "Bis dahin funktioniert der Weg über die Galerie.": "それまでの間はギャラリーからの選択が利用できます。",
  "Datum": "日付",
  "Datum unbekannt": "日付不明",
  "Der Name des Whiskys ist erforderlich.": "ウイスキー名は必須です。",
  "Destillationsjahr": "蒸留年",
  "Destillerie": "蒸留所",
  "Destillerien": "蒸留所数",
  "Diese Verkostung löschen": "このテイスティングを削除",
  "Diese Verkostung löschen?": "このテイスティングを削除しますか？",
  "Dieses Exemplar entfernen?": "このボトルを取り除きますか？",
  "Durchschnittsalter (Jahre)": "平均熟成年数 (年)",
  "Edition": "エディション",
  "Einträge": "登録数",
  "Einträge,": "件、",
  "Einträgen angezeigt (": "件を表示 (",
  "Enddatum unbekannt": "終了日不明",
  "Entfernen": "取り除く",
  "Ergebnisse der Erkennung": "認識結果",
  "Etikettenfoto (URL)": "ラベル写真 (URL)",
  "Expression / Cuvée": "エクスプレッション / キュヴェ",
  "Externe ID": "外部ID",
  "Externer Link": "外部リンク",
  "Fassnummer": "樽番号",
  "Fasstyp": "樽のタイプ",
  "Fehler:": "エラー:",
  "Feld(er) erkannt und automatisch übernommen — bitte prüfen und speichern.": "件のフィールドを認識して自動適用しました — 確認して保存してください。",
  "Feld(er) übernommen — bitte prüfen und speichern.": "件のフィールドを適用しました — 確認して保存してください。",
  "Felder werden automatisch in das Formular unten übernommen (außer bereits manuell ausgefüllte) — Häkchen anpassen, dann „Übernehmen“. Nichts wird gespeichert, bevor du das Formular abschickst.": "フィールドは下のフォームに自動反映されます（手動入力済みの項目を除く）— チェックを調整して「適用」を押してください。フォームを送信するまで保存されません。",
  "Finish (Cask Finish)": "フィニッシュ (カスクフィニッシュ)",
  "Flaschen": "ボトル",
  "Flaschen)": "本)",
  "Flaschennummer": "ボトル番号",
  "Foto (URL)": "写真 (URL)",
  "Foto aus der Galerie: Der direkte Kamerazugriff ist nur über sichere ": "ギャラリーから写真を選択：カメラへの直接アクセスは安全な ",
  "Foto konnte nicht gelesen werden.": "写真を読み込めませんでした。",
  "Foto leer oder unlesbar.": "写真が空か読み取れません。",
  "Füllstand": "残量",
  "Für einen nur verkosteten Whisky (Bar, bei Freunden, Tasting) — ohne ihn in die Sammlung aufzunehmen.": "テイスティングのみのウイスキー（バー、友人宅、テイスティング会）用 — コレクションに追加せずに記録します。",
  "Gaumen": "口当たり",
  "Gesamtkonfidenz:": "総合信頼度:",
  "Gesamtzahl produzierter Flaschen": "生産本数",
  "Geöffnet": "開封",
  "Hinzufügen": "追加",
  "Hoch": "高",
  "Ja": "はい",
  "Jahre": "年",
  "KI-Dienst momentan nicht erreichbar.": "AIサービスに現在接続できません。",
  "Kamerazugriff verweigert — prüfe die Berechtigungen der Home-Assistant-App ": "カメラアクセスが拒否されました — Home Assistantアプリの権限を確認してください ",
  "Kaufdatum": "購入日",
  "Kaufort": "購入場所",
  "Kaufpreis": "購入価格",
  "Kein Exemplar.": "ボトルなし。",
  "Kein KI-API-Key konfiguriert — hinterlege ihn in den Einstellungen der Integration oder gib die Daten von Hand ein.": "AIのAPIキーが未設定です — 統合の設定で登録するか、手動で入力してください。",
  "Kein Modell mit diesem API-Key erreichbar.": "このAPIキーでアクセスできるモデルがありません。",
  "Keine Einträge entsprechen diesen Filtern.": "このフィルターに一致する登録はありません。",
  "Kommentar": "コメント",
  "Kühlfiltration": "チルフィルター",
  "Lagerort": "保管場所",
  "Land": "国",
  "Leer": "空き",
  "Leer seit": "飲み切った日",
  "Lieblinge": "お気に入り",
  "Lieblingsflasche": "お気に入りのボトル",
  "Limitierte Edition": "限定エディション",
  "Marke": "ブランド",
  "Mittel": "中",
  "Nach Destillerie": "蒸留所別",
  "Nach Land": "国別",
  "Nach Region": "地方別",
  "Nach Typ": "タイプ別",
  "Name *": "名前 *",
  "Nase": "香り",
  "Natürliche Farbe": "天然着色なし",
  "Nein": "いいえ",
  "Nicht angegeben": "未入力",
  "Nicht einsortiert": "未配置",
  "Niedrig": "低",
  "Noch kein Whisky vorhanden — klicke auf ➕ Hinzufügen, um deine Sammlung zu starten.": "まだウイスキーがありません — ➕ 追加を押してコレクションを始めましょう。",
  "Noch keine getrunkenen Whiskys — markiere eine Flasche als leer oder füge eine Verkostung außerhalb der Sammlung hinzu.": "まだ飲んだウイスキーがありません — ボトルを空きにするか、コレクション外のテイスティングを追加してください。",
  "Ort der Verkostung": "テイスティング場所",
  "Persönliche Anmerkungen": "個人メモ",
  "Persönliche Bewertung (/5)": "個人評価 (/5)",
  "Phenole (ppm)": "フェノール値 (ppm)",
  "Platz": "位置",
  "Regal": "棚",
  "Region": "地方",
  "Reifungsdauer (Jahre)": "熟成期間 (年)",
  "Reifungsübersicht": "熟成の概要",
  "Schließen": "閉じる",
  "Speichern": "保存",
  "Standort der Destillerie": "蒸留所の場所",
  "Tageslimit des KI-Anbieters überschritten — versuch es morgen erneut oder gib die Daten von Hand ein.": "AIプロバイダーの1日の上限に達しました — 明日もう一度お試しいただくか、手動で入力してください。",
  "Torfig": "ピーティ",
  "Torfigkeit": "ピート感",
  "Typ": "タイプ",
  "Unabhängige Abfüllung": "インディペンデントボトリング",
  "Unabhängiger Abfüller": "インディペンデント・ボトラー",
  "Unbekannt": "不明",
  "Unbekannter Fehler.": "不明なエラー。",
  "Ungültiger Füllstand (0 bis 100).": "残量が無効です（0〜100）。",
  "Verbindungen (https) möglich. Das ist kein Fehler von WhiskyDB — ": "接続（https）でのみ可能です。これはWhiskyDBの不具合ではありません — ",
  "Verkostet am": "テイスティング日",
  "Verkostung": "テイスティング",
  "Versiegelt": "未開封",
  "Verwaltung deiner Whisky-Sammlung: detaillierte Einträge, Fotoerkennung per KI, Statistiken.": "ウイスキーコレクションを管理：詳細な記録、AIによる写真認識、統計。",
  "Volumen (ml)": "容量 (ml)",
  "Wert (aktueller Bestand)": "価値（現在の在庫）",
  "Whisky bearbeiten": "ウイスキーを編集",
  "Whisky hinzufügen": "ウイスキーを追加",
  "Whisky(s) getrunken": "本のウイスキーを飲みました",
  "WhiskyDB — Sammlung": "WhiskyDB — コレクション",
  "Whiskybase-ID (optional)": "Whiskybase ID（任意）",
  "Whiskybase-Link (optional)": "Whiskybaseリンク（任意）",
  "Währung": "通貨",
  "Zeitüberschreitung — bitte erneut versuchen.": "タイムアウト — もう一度お試しください。",
  "Zur Sammlung hinzufügen": "コレクションに追加",
  "[WhiskyDB] getUserMedia nicht verfügbar:": "[WhiskyDB] getUserMediaを利用できません:",
  "aus der Sammlung,": "コレクションから、",
  "außerhalb)": "コレクション外)",
  "endgültig löschen — inklusive aller Exemplare?": "を完全に削除しますか — すべてのボトルも含めて？",
  "falls abweichend von der Destillerie": "蒸留所と異なる場合",
  "geöffnet": "開封",
  "geöffnet am": "開封日",
  "keine Flasche": "ボトルなし",
  "leer": "空き",
  "leer seit": "飲み切った日",
  "nicht torfig": "ピーティではない",
  "nimm das Foto mit deiner Kamera-App auf und wähle es dann in der Galerie, ": "カメラアプリで撮影し、ギャラリーから選択してください。 ",
  "oder verbinde dich über https (externe URL / Nabu Casa) für die Direktaufnahme.": "または https（外部URL / Nabu Casa）経由で接続して直接撮影してください。",
  "torfig": "ピーティ",
  "versiegelt": "未開封",
  "von": "/",
  "z. B. 16 Year Old": "例：16 Year Old",
  "z. B. 16, leer bei NAS": "例：16、NASの場合は空欄",
  "z. B. Bar Le Malt": "例：Bar Le Malt",
  "z. B. Islay": "例：アイラ",
  "z. B. Lagavulin": "例：ラガヴーリン",
  "z. B. Lagavulin 16 Years Old": "例：ラガヴーリン16年",
  "z. B. Schottland": "例：スコットランド",
  "z. B. Talisker 18 Years Old": "例：タリスカー18年",
  "z. B. Wohnzimmerschrank": "例：リビングのキャビネット",
  "z. B. leicht, mittel, stark": "例：軽い、中程度、強い",
  "Öffnen": "開封する",
  "✏️ Bearbeiten": "✏️ 編集",
  "➕ Exemplar hinzufügen": "➕ ボトルを追加",
  "➕ Hinzufügen": "➕ 追加",
  "⭐ Notizen & Medien": "⭐ メモとメディア",
  "🌍 Herkunft": "🌍 産地",
  "🏷️ Klassifikation": "🏷️ 分類",
  "👃 Verkostung": "👃 テイスティング",
  "💰 Persönliche Sammlung": "💰 個人コレクション",
  "📊 Sammlungs-Statistiken": "📊 コレクション統計",
  "📊 Statistiken": "📊 統計",
  "📥 Beim Anlegen": "📥 登録時",
  "📦 Abfüllung": "📦 ボトリング",
  "📷 Aufnehmen": "📷 撮影",
  "📷 Foto aufnehmen": "📷 写真を撮る",
  "🔎 Foto wird analysiert…": "🔎 写真を解析中…",
  "🔎 Name, Destillerie, Region…": "🔎 名前、蒸留所、地方…",
  "🔗 Externe Referenzen": "🔗 外部参照",
  "🔬 Eigenschaften": "🔬 特徴",
  "🖼️ Galerie": "🖼️ ギャラリー",
  "🗑️ Löschen": "🗑️ 削除",
  "🛢️ Fassreifung": "🛢️ 樽熟成",
  "🥂 Außerhalb der Sammlung": "🥂 コレクション外",
  "🥂 Getrunkene": "🥂 飲んだウイスキー",
  "🥂 Verkostung hinzufügen": "🥂 テイスティングを追加",
  "🥃 Identität": "🥃 基本",
  "🥃 Sammlung": "🥃 コレクション",
  "🥃 WhiskyDB — Sammlung": "🥃 WhiskyDB — コレクション"
},
"ko": {
  "% verbleibend": "% 남음",
  "(Einstellungen → Apps → Home Assistant → Berechtigungen → Kamera). ": "(설정 → 앱 → Home Assistant → 권한 → 카메라). ",
  "<em>Keine verwertbaren Felder.</em>": "<em>사용 가능한 항목이 없습니다.</em>",
  "API-Key ungültig oder vom Anbieter abgelehnt.": "API 키가 잘못되었거나 제공자가 거부했습니다.",
  "Abbrechen": "취소",
  "Abfülljahr": "보틀링 연도",
  "Abgang": "피니시",
  "Aktualisieren": "업데이트",
  "Aktueller geschätzter Wert": "현재 추정 가치",
  "Alkoholgehalt (% vol)": "알코올 도수 (% vol)",
  "Alle Status": "모든 상태",
  "Alle Typen": "모든 타입",
  "Allgemeine Notizen": "일반 노트",
  "Als leer markieren": "빈 병으로 표시",
  "Alter (Jahre)": "숙성 연수 (년)",
  "Analysiert das Etikett per KI — prüfe die Ergebnisse, bevor du speicherst.": "AI로 라벨을 분석합니다 — 저장하기 전에 결과를 확인하세요.",
  "Anfangsstatus": "초기 상태",
  "Antwort abgeschnitten — bitte mit einem schärferen Foto erneut versuchen.": "응답이 잘렸습니다 — 더 선명한 사진으로 다시 시도해 주세요.",
  "Antwort der KI nicht lesbar — bitte erneut versuchen.": "AI 응답을 읽을 수 없습니다 — 다시 시도해 주세요.",
  "Anzahl": "수량",
  "Auf dem Foto wurden keine verwertbaren Informationen erkannt — bitte von Hand ergänzen.": "사진에서 사용 가능한 정보를 인식하지 못했습니다 — 직접 입력해 주세요.",
  "Ausgewählte Felder übernehmen": "선택한 항목 적용",
  "Barcode": "바코드",
  "Batch": "배치",
  "Bewertung (/5)": "평점 (/5)",
  "Bis dahin funktioniert der Weg über die Galerie.": "그동안은 갤러리 경로를 이용할 수 있습니다.",
  "Datum": "날짜",
  "Datum unbekannt": "날짜 미상",
  "Der Name des Whiskys ist erforderlich.": "위스키 이름은 필수입니다.",
  "Destillationsjahr": "증류 연도",
  "Destillerie": "증류소",
  "Destillerien": "증류소 수",
  "Diese Verkostung löschen": "이 테이스팅 삭제",
  "Diese Verkostung löschen?": "이 테이스팅을 삭제할까요?",
  "Dieses Exemplar entfernen?": "이 병을 제거할까요?",
  "Durchschnittsalter (Jahre)": "평균 숙성 연수 (년)",
  "Edition": "에디션",
  "Einträge": "항목",
  "Einträge,": "개 항목,",
  "Einträgen angezeigt (": "개 항목 표시 (",
  "Enddatum unbekannt": "종료일 미상",
  "Entfernen": "제거",
  "Ergebnisse der Erkennung": "인식 결과",
  "Etikettenfoto (URL)": "라벨 사진 (URL)",
  "Expression / Cuvée": "익스프레션 / 큐베",
  "Externe ID": "외부 ID",
  "Externer Link": "외부 링크",
  "Fassnummer": "오크통 번호",
  "Fasstyp": "오크통 타입",
  "Fehler:": "오류:",
  "Feld(er) erkannt und automatisch übernommen — bitte prüfen und speichern.": "개 항목을 인식하여 자동 적용했습니다 — 확인 후 저장하세요.",
  "Feld(er) übernommen — bitte prüfen und speichern.": "개 항목을 적용했습니다 — 확인 후 저장하세요.",
  "Felder werden automatisch in das Formular unten übernommen (außer bereits manuell ausgefüllte) — Häkchen anpassen, dann „Übernehmen“. Nichts wird gespeichert, bevor du das Formular abschickst.": "항목이 아래 양식에 자동으로 반영됩니다(이미 직접 입력한 항목 제외) — 체크를 조정한 뒤 «적용»을 누르세요. 양식을 제출하기 전까지 저장되지 않습니다.",
  "Finish (Cask Finish)": "피니시 (캐스크 피니시)",
  "Flaschen": "병",
  "Flaschen)": "병)",
  "Flaschennummer": "병 번호",
  "Foto (URL)": "사진 (URL)",
  "Foto aus der Galerie: Der direkte Kamerazugriff ist nur über sichere ": "갤러리에서 사진 선택: 카메라 직접 접근은 보안 연결 ",
  "Foto konnte nicht gelesen werden.": "사진을 읽을 수 없습니다.",
  "Foto leer oder unlesbar.": "사진이 비어 있거나 읽을 수 없습니다.",
  "Füllstand": "잔량",
  "Für einen nur verkosteten Whisky (Bar, bei Freunden, Tasting) — ohne ihn in die Sammlung aufzunehmen.": "테이스팅만 한 위스키용(바, 친구 집, 시음회) — 컬렉션에 추가하지 않습니다.",
  "Gaumen": "팔레트",
  "Gesamtkonfidenz:": "전체 신뢰도:",
  "Gesamtzahl produzierter Flaschen": "총 생산 병수",
  "Geöffnet": "개봉",
  "Hinzufügen": "추가",
  "Hoch": "높음",
  "Ja": "예",
  "Jahre": "년",
  "KI-Dienst momentan nicht erreichbar.": "AI 서비스에 현재 접속할 수 없습니다.",
  "Kamerazugriff verweigert — prüfe die Berechtigungen der Home-Assistant-App ": "카메라 접근이 거부되었습니다 — Home Assistant 앱 권한을 확인하세요 ",
  "Kaufdatum": "구매일",
  "Kaufort": "구매 장소",
  "Kaufpreis": "구매 가격",
  "Kein Exemplar.": "병이 없습니다.",
  "Kein KI-API-Key konfiguriert — hinterlege ihn in den Einstellungen der Integration oder gib die Daten von Hand ein.": "AI API 키가 설정되지 않았습니다 — 통합 설정에서 입력하거나 직접 입력해 주세요.",
  "Kein Modell mit diesem API-Key erreichbar.": "이 API 키로 접근 가능한 모델이 없습니다.",
  "Keine Einträge entsprechen diesen Filtern.": "이 필터에 일치하는 항목이 없습니다.",
  "Kommentar": "코멘트",
  "Kühlfiltration": "칠 필터링",
  "Lagerort": "보관 장소",
  "Land": "국가",
  "Leer": "빈 병",
  "Leer seit": "다 마신 날",
  "Lieblinge": "즐겨찾기",
  "Lieblingsflasche": "가장 아끼는 병",
  "Limitierte Edition": "한정 에디션",
  "Marke": "브랜드",
  "Mittel": "중간",
  "Nach Destillerie": "증류소별",
  "Nach Land": "국가별",
  "Nach Region": "지역별",
  "Nach Typ": "타입별",
  "Name *": "이름 *",
  "Nase": "향",
  "Natürliche Farbe": "천연 색소",
  "Nein": "아니요",
  "Nicht angegeben": "미지정",
  "Nicht einsortiert": "미배치",
  "Niedrig": "낮음",
  "Noch kein Whisky vorhanden — klicke auf ➕ Hinzufügen, um deine Sammlung zu starten.": "아직 위스키가 없습니다 — ➕ 추가를 눌러 컬렉션을 시작하세요.",
  "Noch keine getrunkenen Whiskys — markiere eine Flasche als leer oder füge eine Verkostung außerhalb der Sammlung hinzu.": "아직 마신 위스키가 없습니다 — 병을 빈 병으로 표시하거나 컬렉션 외 테이스팅을 추가하세요.",
  "Ort der Verkostung": "테이스팅 장소",
  "Persönliche Anmerkungen": "개인 메모",
  "Persönliche Bewertung (/5)": "개인 평점 (/5)",
  "Phenole (ppm)": "페놀 (ppm)",
  "Platz": "칸",
  "Regal": "선반",
  "Region": "지역",
  "Reifungsdauer (Jahre)": "숙성 기간 (년)",
  "Reifungsübersicht": "숙성 개요",
  "Schließen": "닫기",
  "Speichern": "저장",
  "Standort der Destillerie": "증류소 위치",
  "Tageslimit des KI-Anbieters überschritten — versuch es morgen erneut oder gib die Daten von Hand ein.": "AI 제공자의 일일 한도를 초과했습니다 — 내일 다시 시도하거나 직접 입력해 주세요.",
  "Torfig": "피티",
  "Torfigkeit": "피트감",
  "Typ": "타입",
  "Unabhängige Abfüllung": "인디펜던트 보틀링",
  "Unabhängiger Abfüller": "인디펜던트 보틀러",
  "Unbekannt": "미상",
  "Unbekannter Fehler.": "알 수 없는 오류.",
  "Ungültiger Füllstand (0 bis 100).": "잔량이 잘못되었습니다 (0~100).",
  "Verbindungen (https) möglich. Das ist kein Fehler von WhiskyDB — ": "(https)에서만 가능합니다. WhiskyDB의 오류가 아닙니다 — ",
  "Verkostet am": "시음일",
  "Verkostung": "테이스팅",
  "Versiegelt": "밀봉",
  "Verwaltung deiner Whisky-Sammlung: detaillierte Einträge, Fotoerkennung per KI, Statistiken.": "위스키 컬렉션 관리: 상세 항목, AI 사진 인식, 통계.",
  "Volumen (ml)": "용량 (ml)",
  "Wert (aktueller Bestand)": "가치 (현재 재고)",
  "Whisky bearbeiten": "위스키 편집",
  "Whisky hinzufügen": "위스키 추가",
  "Whisky(s) getrunken": "개의 위스키를 마심",
  "WhiskyDB — Sammlung": "WhiskyDB — 컬렉션",
  "Whiskybase-ID (optional)": "Whiskybase ID (선택)",
  "Whiskybase-Link (optional)": "Whiskybase 링크 (선택)",
  "Währung": "통화",
  "Zeitüberschreitung — bitte erneut versuchen.": "시간 초과 — 다시 시도해 주세요.",
  "Zur Sammlung hinzufügen": "컬렉션에 추가",
  "[WhiskyDB] getUserMedia nicht verfügbar:": "[WhiskyDB] getUserMedia를 사용할 수 없습니다:",
  "aus der Sammlung,": "컬렉션에서,",
  "außerhalb)": "컬렉션 외)",
  "endgültig löschen — inklusive aller Exemplare?": "을 완전히 삭제할까요 — 모든 병 포함?",
  "falls abweichend von der Destillerie": "증류소와 다른 경우",
  "geöffnet": "개봉",
  "geöffnet am": "개봉일",
  "keine Flasche": "병 없음",
  "leer": "빈 병",
  "leer seit": "다 마신 날",
  "nicht torfig": "피티 아님",
  "nimm das Foto mit deiner Kamera-App auf und wähle es dann in der Galerie, ": "카메라 앱으로 촬영한 뒤 갤러리에서 선택하세요. ",
  "oder verbinde dich über https (externe URL / Nabu Casa) für die Direktaufnahme.": "또는 https(외부 URL / Nabu Casa)로 접속하여 직접 촬영하세요.",
  "torfig": "피티",
  "versiegelt": "밀봉",
  "von": "/",
  "z. B. 16 Year Old": "예: 16 Year Old",
  "z. B. 16, leer bei NAS": "예: 16, NAS는 비워 두기",
  "z. B. Bar Le Malt": "예: Bar Le Malt",
  "z. B. Islay": "예: 아일라",
  "z. B. Lagavulin": "예: 라가불린",
  "z. B. Lagavulin 16 Years Old": "예: 라가불린 16년",
  "z. B. Schottland": "예: 스코틀랜드",
  "z. B. Talisker 18 Years Old": "예: 탈리스커 18년",
  "z. B. Wohnzimmerschrank": "예: 거실 장식장",
  "z. B. leicht, mittel, stark": "예: 약함, 중간, 강함",
  "Öffnen": "개봉하기",
  "✏️ Bearbeiten": "✏️ 편집",
  "➕ Exemplar hinzufügen": "➕ 병 추가",
  "➕ Hinzufügen": "➕ 추가",
  "⭐ Notizen & Medien": "⭐ 노트 및 미디어",
  "🌍 Herkunft": "🌍 원산지",
  "🏷️ Klassifikation": "🏷️ 분류",
  "👃 Verkostung": "👃 테이스팅",
  "💰 Persönliche Sammlung": "💰 개인 컬렉션",
  "📊 Sammlungs-Statistiken": "📊 컬렉션 통계",
  "📊 Statistiken": "📊 통계",
  "📥 Beim Anlegen": "📥 등록 시",
  "📦 Abfüllung": "📦 보틀링",
  "📷 Aufnehmen": "📷 촬영",
  "📷 Foto aufnehmen": "📷 사진 촬영",
  "🔎 Foto wird analysiert…": "🔎 사진 분석 중…",
  "🔎 Name, Destillerie, Region…": "🔎 이름, 증류소, 지역…",
  "🔗 Externe Referenzen": "🔗 외부 참조",
  "🔬 Eigenschaften": "🔬 특성",
  "🖼️ Galerie": "🖼️ 갤러리",
  "🗑️ Löschen": "🗑️ 삭제",
  "🛢️ Fassreifung": "🛢️ 오크통 숙성",
  "🥂 Außerhalb der Sammlung": "🥂 컬렉션 외",
  "🥂 Getrunkene": "🥂 마신 위스키",
  "🥂 Verkostung hinzufügen": "🥂 테이스팅 추가",
  "🥃 Identität": "🥃 기본",
  "🥃 Sammlung": "🥃 컬렉션",
  "🥃 WhiskyDB — Sammlung": "🥃 WhiskyDB — 컬렉션"
},
"nl": {
  "% verbleibend": "% remaining",
  "(Einstellungen → Apps → Home Assistant → Berechtigungen → Kamera). ": "(Instellingen → Apps → Home Assistant → Machtigingen → Camera). ",
  "<em>Keine verwertbaren Felder.</em>": "<em>Geen bruikbare velden.</em>",
  "API-Key ungültig oder vom Anbieter abgelehnt.": "API-sleutel ongeldig of geweigerd door de aanbieder.",
  "Abbrechen": "Annuleren",
  "Abfülljahr": "Botteljaar",
  "Abgang": "Afdronk",
  "Aktualisieren": "Bijwerken",
  "Aktueller geschätzter Wert": "Huidige geschatte waarde",
  "Alkoholgehalt (% vol)": "Alcoholgehalte (% vol)",
  "Alle Status": "Alle statussen",
  "Alle Typen": "Alle types",
  "Allgemeine Notizen": "Algemene notities",
  "Als leer markieren": "Als leeg markeren",
  "Alter (Jahre)": "Leeftijd (jaar)",
  "Analysiert das Etikett per KI — prüfe die Ergebnisse, bevor du speicherst.": "Analyseert het etiket met AI — controleer de resultaten voordat je opslaat.",
  "Anfangsstatus": "Beginstatus",
  "Antwort abgeschnitten — bitte mit einem schärferen Foto erneut versuchen.": "Antwoord afgekapt — probeer het opnieuw met een scherpere foto.",
  "Antwort der KI nicht lesbar — bitte erneut versuchen.": "AI-antwoord onleesbaar — probeer het opnieuw.",
  "Anzahl": "Aantal",
  "Auf dem Foto wurden keine verwertbaren Informationen erkannt — bitte von Hand ergänzen.": "Er zijn geen bruikbare gegevens herkend op de foto — vul zelf aan.",
  "Ausgewählte Felder übernehmen": "Geselecteerde velden toepassen",
  "Barcode": "Barcode",
  "Batch": "Batch",
  "Bewertung (/5)": "Beoordeling (/5)",
  "Bis dahin funktioniert der Weg über die Galerie.": "Tot die tijd blijft de galerij-route werken.",
  "Datum": "Datum",
  "Datum unbekannt": "Datum onbekend",
  "Der Name des Whiskys ist erforderlich.": "De naam van de whisky is verplicht.",
  "Destillationsjahr": "Distillatiejaar",
  "Destillerie": "Distilleerderij",
  "Destillerien": "Distilleerderijen",
  "Diese Verkostung löschen": "Deze proeverij verwijderen",
  "Diese Verkostung löschen?": "Deze proeverij verwijderen?",
  "Dieses Exemplar entfernen?": "Deze fles verwijderen?",
  "Durchschnittsalter (Jahre)": "Gemiddelde leeftijd (jaar)",
  "Edition": "Editie",
  "Einträge": "Vermeldingen",
  "Einträge,": "vermeldingen,",
  "Einträgen angezeigt (": "vermeldingen getoond (",
  "Enddatum unbekannt": "Einddatum onbekend",
  "Entfernen": "Verwijderen",
  "Ergebnisse der Erkennung": "Herkenningsresultaten",
  "Etikettenfoto (URL)": "Etiketfoto (URL)",
  "Expression / Cuvée": "Expression / Cuvée",
  "Externe ID": "Externe ID",
  "Externer Link": "Externe link",
  "Fassnummer": "Vatnummer",
  "Fasstyp": "Vattype",
  "Fehler:": "Fout:",
  "Feld(er) erkannt und automatisch übernommen — bitte prüfen und speichern.": "veld(en) herkend en automatisch toegepast — controleer en sla op.",
  "Feld(er) übernommen — bitte prüfen und speichern.": "veld(en) toegepast — controleer en sla op.",
  "Felder werden automatisch in das Formular unten übernommen (außer bereits manuell ausgefüllte) — Häkchen anpassen, dann „Übernehmen“. Nichts wird gespeichert, bevor du das Formular abschickst.": "Velden worden automatisch overgenomen in het formulier hieronder (behalve degene die je al handmatig invulde) — pas de vinkjes aan en klik op «Toepassen». Er wordt niets opgeslagen voordat je het formulier verzendt.",
  "Finish (Cask Finish)": "Finish (Cask Finish)",
  "Flaschen": "Flessen",
  "Flaschen)": "flessen)",
  "Flaschennummer": "Flesnummer",
  "Foto (URL)": "Foto (URL)",
  "Foto aus der Galerie: Der direkte Kamerazugriff ist nur über sichere ": "Foto uit galerij: directe cameratoegang werkt alleen via een ",
  "Foto konnte nicht gelesen werden.": "Foto kon niet worden gelezen.",
  "Foto leer oder unlesbar.": "Foto leeg of onleesbaar.",
  "Füllstand": "Vulniveau",
  "Für einen nur verkosteten Whisky (Bar, bei Freunden, Tasting) — ohne ihn in die Sammlung aufzunehmen.": "Voor een whisky die je alleen proefde (bar, bij vrienden, tasting) — zonder hem aan je collectie toe te voegen.",
  "Gaumen": "Smaak",
  "Gesamtkonfidenz:": "Totale betrouwbaarheid:",
  "Gesamtzahl produzierter Flaschen": "Totaal aantal geproduceerde flessen",
  "Geöffnet": "Geopend",
  "Hinzufügen": "Toevoegen",
  "Hoch": "Hoog",
  "Ja": "Ja",
  "Jahre": "jaar",
  "KI-Dienst momentan nicht erreichbar.": "AI-service momenteel niet bereikbaar.",
  "Kamerazugriff verweigert — prüfe die Berechtigungen der Home-Assistant-App ": "Cameratoegang geweigerd — controleer de machtigingen van de Home Assistant-app ",
  "Kaufdatum": "Aankoopdatum",
  "Kaufort": "Aankooplocatie",
  "Kaufpreis": "Aankooprijs",
  "Kein Exemplar.": "Geen fles.",
  "Kein KI-API-Key konfiguriert — hinterlege ihn in den Einstellungen der Integration oder gib die Daten von Hand ein.": "Geen AI-API-sleutel ingesteld — stel die in bij de integratie-instellingen of vul de gegevens handmatig in.",
  "Kein Modell mit diesem API-Key erreichbar.": "Geen model bereikbaar met deze API-sleutel.",
  "Keine Einträge entsprechen diesen Filtern.": "Geen vermeldingen voldoen aan deze filters.",
  "Kommentar": "Opmerking",
  "Kühlfiltration": "Koude filtratie",
  "Lagerort": "Bewaarplaats",
  "Land": "Land",
  "Leer": "Leeg",
  "Leer seit": "Leeg sinds",
  "Lieblinge": "Favorieten",
  "Lieblingsflasche": "Favoriete fles",
  "Limitierte Edition": "Gelimiteerde editie",
  "Marke": "Merk",
  "Mittel": "Gemiddeld",
  "Nach Destillerie": "Per distilleerderij",
  "Nach Land": "Per land",
  "Nach Region": "Per regio",
  "Nach Typ": "Per type",
  "Name *": "Naam *",
  "Nase": "Neus",
  "Natürliche Farbe": "Natuurlijke kleur",
  "Nein": "Nee",
  "Nicht angegeben": "Niet opgegeven",
  "Nicht einsortiert": "Niet ingedeeld",
  "Niedrig": "Laag",
  "Noch kein Whisky vorhanden — klicke auf ➕ Hinzufügen, um deine Sammlung zu starten.": "Nog geen whisky — klik op ➕ Toevoegen om je collectie te starten.",
  "Noch keine getrunkenen Whiskys — markiere eine Flasche als leer oder füge eine Verkostung außerhalb der Sammlung hinzu.": "Nog geen gedronken whisky's — markeer een fles als leeg of voeg een proeverij buiten je collectie toe.",
  "Ort der Verkostung": "Locatie van de proeverij",
  "Persönliche Anmerkungen": "Persoonlijke notities",
  "Persönliche Bewertung (/5)": "Persoonlijke beoordeling (/5)",
  "Phenole (ppm)": "Fenolen (ppm)",
  "Platz": "Plek",
  "Regal": "Rek",
  "Region": "Regio",
  "Reifungsdauer (Jahre)": "Rijping (jaar)",
  "Reifungsübersicht": "Rijpingsoverzicht",
  "Schließen": "Sluiten",
  "Speichern": "Opslaan",
  "Standort der Destillerie": "Locatie van de distilleerderij",
  "Tageslimit des KI-Anbieters überschritten — versuch es morgen erneut oder gib die Daten von Hand ein.": "Daglimiet van de AI-aanbieder overschreden — probeer het morgen opnieuw of vul de gegevens handmatig in.",
  "Torfig": "Turfachtig",
  "Torfigkeit": "Turf",
  "Typ": "Type",
  "Unabhängige Abfüllung": "Onafhankelijke botteling",
  "Unabhängiger Abfüller": "Onafhankelijke bottelaar",
  "Unbekannt": "Onbekend",
  "Unbekannter Fehler.": "Onbekende fout.",
  "Ungültiger Füllstand (0 bis 100).": "Ongeldig vulniveau (0 tot 100).",
  "Verbindungen (https) möglich. Das ist kein Fehler von WhiskyDB — ": "beveiligde verbinding (https). Dit is geen fout van WhiskyDB — ",
  "Verkostet am": "Geproefd op",
  "Verkostung": "Proeverij",
  "Versiegelt": "Verzegeld",
  "Verwaltung deiner Whisky-Sammlung: detaillierte Einträge, Fotoerkennung per KI, Statistiken.": "Beheer je whiskycollectie: gedetailleerde vermeldingen, AI-fotoherkenning, statistieken.",
  "Volumen (ml)": "Volume (ml)",
  "Wert (aktueller Bestand)": "Waarde (huidige voorraad)",
  "Whisky bearbeiten": "Whisky bewerken",
  "Whisky hinzufügen": "Whisky toevoegen",
  "Whisky(s) getrunken": "whisky's gedronken",
  "WhiskyDB — Sammlung": "WhiskyDB — Collectie",
  "Whiskybase-ID (optional)": "Whiskybase-ID (optioneel)",
  "Whiskybase-Link (optional)": "Whiskybase-link (optioneel)",
  "Währung": "Valuta",
  "Zeitüberschreitung — bitte erneut versuchen.": "Time-out — probeer het opnieuw.",
  "Zur Sammlung hinzufügen": "Aan collectie toevoegen",
  "[WhiskyDB] getUserMedia nicht verfügbar:": "[WhiskyDB] getUserMedia niet beschikbaar:",
  "aus der Sammlung,": "uit de collectie,",
  "außerhalb)": "buiten)",
  "endgültig löschen — inklusive aller Exemplare?": "definitief verwijderen — inclusief alle flessen?",
  "falls abweichend von der Destillerie": "indien anders dan de distilleerderij",
  "geöffnet": "geopend",
  "geöffnet am": "geopend op",
  "keine Flasche": "geen fles",
  "leer": "leeg",
  "leer seit": "leeg sinds",
  "nicht torfig": "niet turfachtig",
  "nimm das Foto mit deiner Kamera-App auf und wähle es dann in der Galerie, ": "maak de foto met je camera-app en kies hem daarna in de galerij, ",
  "oder verbinde dich über https (externe URL / Nabu Casa) für die Direktaufnahme.": "of maak verbinding via https (externe URL / Nabu Casa) voor directe opname.",
  "torfig": "turfachtig",
  "versiegelt": "verzegeld",
  "von": "van",
  "z. B. 16 Year Old": "bv. 16 Year Old",
  "z. B. 16, leer bei NAS": "bv. 16, leeg bij NAS",
  "z. B. Bar Le Malt": "bv. Bar Le Malt",
  "z. B. Islay": "bv. Islay",
  "z. B. Lagavulin": "bv. Lagavulin",
  "z. B. Lagavulin 16 Years Old": "bv. Lagavulin 16 Years Old",
  "z. B. Schottland": "bv. Schotland",
  "z. B. Talisker 18 Years Old": "bv. Talisker 18 Years Old",
  "z. B. Wohnzimmerschrank": "bv. woonkamerkast",
  "z. B. leicht, mittel, stark": "bv. licht, medium, sterk",
  "Öffnen": "Openen",
  "✏️ Bearbeiten": "✏️ Bewerken",
  "➕ Exemplar hinzufügen": "➕ Fles toevoegen",
  "➕ Hinzufügen": "➕ Toevoegen",
  "⭐ Notizen & Medien": "⭐ Notities & media",
  "🌍 Herkunft": "🌍 Herkomst",
  "🏷️ Klassifikation": "🏷️ Classificatie",
  "👃 Verkostung": "👃 Proeverij",
  "💰 Persönliche Sammlung": "💰 Persoonlijke collectie",
  "📊 Sammlungs-Statistiken": "📊 Collectiestatistieken",
  "📊 Statistiken": "📊 Statistieken",
  "📥 Beim Anlegen": "📥 Bij aanmaken",
  "📦 Abfüllung": "📦 Botteling",
  "📷 Aufnehmen": "📷 Opnemen",
  "📷 Foto aufnehmen": "📷 Foto maken",
  "🔎 Foto wird analysiert…": "🔎 Foto wordt geanalyseerd…",
  "🔎 Name, Destillerie, Region…": "🔎 Naam, distilleerderij, regio…",
  "🔗 Externe Referenzen": "🔗 Externe referenties",
  "🔬 Eigenschaften": "🔬 Eigenschappen",
  "🖼️ Galerie": "🖼️ Galerij",
  "🗑️ Löschen": "🗑️ Verwijderen",
  "🛢️ Fassreifung": "🛢️ Vatrijping",
  "🥂 Außerhalb der Sammlung": "🥂 Buiten de collectie",
  "🥂 Getrunkene": "🥂 Gedronken",
  "🥂 Verkostung hinzufügen": "🥂 Proeverij toevoegen",
  "🥃 Identität": "🥃 Identiteit",
  "🥃 Sammlung": "🥃 Collectie",
  "🥃 WhiskyDB — Sammlung": "🥃 WhiskyDB — Collectie"
},
"pl": {
  "% verbleibend": "% pozostało",
  "(Einstellungen → Apps → Home Assistant → Berechtigungen → Kamera). ": "(Ustawienia → Aplikacje → Home Assistant → Uprawnienia → Aparat). ",
  "<em>Keine verwertbaren Felder.</em>": "<em>Brak użytecznych pól.</em>",
  "API-Key ungültig oder vom Anbieter abgelehnt.": "Klucz API jest nieprawidłowy lub odrzucony przez dostawcę.",
  "Abbrechen": "Anuluj",
  "Abfülljahr": "Rok rozlewania",
  "Abgang": "Finisz",
  "Aktualisieren": "Aktualizuj",
  "Aktueller geschätzter Wert": "Aktualna szacowana wartość",
  "Alkoholgehalt (% vol)": "Zawartość alkoholu (% obj.)",
  "Alle Status": "Wszystkie statusy",
  "Alle Typen": "Wszystkie typy",
  "Allgemeine Notizen": "Notatki ogólne",
  "Als leer markieren": "Oznacz jako pustą",
  "Alter (Jahre)": "Wiek (lata)",
  "Analysiert das Etikett per KI — prüfe die Ergebnisse, bevor du speicherst.": "Analizuje etykietę za pomocą AI — sprawdź wyniki przed zapisaniem.",
  "Anfangsstatus": "Status początkowy",
  "Antwort abgeschnitten — bitte mit einem schärferen Foto erneut versuchen.": "Odpowiedź ucięta — spróbuj ponownie z ostrzejszym zdjęciem.",
  "Antwort der KI nicht lesbar — bitte erneut versuchen.": "Odpowiedź AI nieczytelna — spróbuj ponownie.",
  "Anzahl": "Liczba",
  "Auf dem Foto wurden keine verwertbaren Informationen erkannt — bitte von Hand ergänzen.": "Na zdjęciu nie rozpoznano żadnych użytecznych informacji — uzupełnij ręcznie.",
  "Ausgewählte Felder übernehmen": "Zastosuj zaznaczone pola",
  "Barcode": "Kod kreskowy",
  "Batch": "Batch",
  "Bewertung (/5)": "Ocena (/5)",
  "Bis dahin funktioniert der Weg über die Galerie.": "Do tego czasu działa ścieżka przez galerię.",
  "Datum": "Data",
  "Datum unbekannt": "Data nieznana",
  "Der Name des Whiskys ist erforderlich.": "Nazwa whisky jest wymagana.",
  "Destillationsjahr": "Rok destylacji",
  "Destillerie": "Destylarnia",
  "Destillerien": "Destylarnie",
  "Diese Verkostung löschen": "Usuń tę degustację",
  "Diese Verkostung löschen?": "Usunąć tę degustację?",
  "Dieses Exemplar entfernen?": "Usunąć tę butelkę?",
  "Durchschnittsalter (Jahre)": "Średni wiek (lata)",
  "Edition": "Edycja",
  "Einträge": "Wpisy",
  "Einträge,": "wpisy,",
  "Einträgen angezeigt (": "wpisów wyświetlonych (",
  "Enddatum unbekannt": "Data zakończenia nieznana",
  "Entfernen": "Usuń",
  "Ergebnisse der Erkennung": "Wyniki rozpoznawania",
  "Etikettenfoto (URL)": "Zdjęcie etykiety (URL)",
  "Expression / Cuvée": "Expression / Cuvée",
  "Externe ID": "ID zewnętrzne",
  "Externer Link": "Link zewnętrzny",
  "Fassnummer": "Numer beczki",
  "Fasstyp": "Typ beczki",
  "Fehler:": "Błąd:",
  "Feld(er) erkannt und automatisch übernommen — bitte prüfen und speichern.": "pól rozpoznanych i automatycznie przeniesionych — sprawdź i zapisz.",
  "Feld(er) übernommen — bitte prüfen und speichern.": "pól przeniesionych — sprawdź i zapisz.",
  "Felder werden automatisch in das Formular unten übernommen (außer bereits manuell ausgefüllte) — Häkchen anpassen, dann „Übernehmen“. Nichts wird gespeichert, bevor du das Formular abschickst.": "Pola są automatycznie przenoszone do formularza poniżej (poza już wypełnionymi ręcznie) — dostosuj zaznaczenia, a potem kliknij «Zastosuj». Nic nie zostanie zapisane, dopóki nie wyślesz formularza.",
  "Finish (Cask Finish)": "Finish (Cask Finish)",
  "Flaschen": "Butelki",
  "Flaschen)": "butelek)",
  "Flaschennummer": "Numer butelki",
  "Foto (URL)": "Zdjęcie (URL)",
  "Foto aus der Galerie: Der direkte Kamerazugriff ist nur über sichere ": "Zdjęcie z galerii: bezpośredni dostęp do aparatu działa tylko przez ",
  "Foto konnte nicht gelesen werden.": "Nie udało się odczytać zdjęcia.",
  "Foto leer oder unlesbar.": "Zdjęcie puste lub nieczytelne.",
  "Füllstand": "Poziom zawartości",
  "Für einen nur verkosteten Whisky (Bar, bei Freunden, Tasting) — ohne ihn in die Sammlung aufzunehmen.": "Dla whisky tylko degustowanej (bar, u znajomych, tasting) — bez dodawania jej do kolekcji.",
  "Gaumen": "Podniebienie",
  "Gesamtkonfidenz:": "Ogólne zaufanie:",
  "Gesamtzahl produzierter Flaschen": "Łączna liczba wyprodukowanych butelek",
  "Geöffnet": "Otwarta",
  "Hinzufügen": "Dodaj",
  "Hoch": "Wysokie",
  "Ja": "Tak",
  "Jahre": "lat",
  "KI-Dienst momentan nicht erreichbar.": "Usługa AI jest obecnie niedostępna.",
  "Kamerazugriff verweigert — prüfe die Berechtigungen der Home-Assistant-App ": "Odmowa dostępu do aparatu — sprawdź uprawnienia aplikacji Home Assistant ",
  "Kaufdatum": "Data zakupu",
  "Kaufort": "Miejsce zakupu",
  "Kaufpreis": "Cena zakupu",
  "Kein Exemplar.": "Brak butelki.",
  "Kein KI-API-Key konfiguriert — hinterlege ihn in den Einstellungen der Integration oder gib die Daten von Hand ein.": "Brak skonfigurowanego klucza API dla AI — ustaw go w ustawieniach integracji lub wprowadź dane ręcznie.",
  "Kein Modell mit diesem API-Key erreichbar.": "Brak modelu dostępnego z tym kluczem API.",
  "Keine Einträge entsprechen diesen Filtern.": "Żaden wpis nie pasuje do tych filtrów.",
  "Kommentar": "Komentarz",
  "Kühlfiltration": "Filtrowanie na zimno",
  "Lagerort": "Miejsce przechowywania",
  "Land": "Kraj",
  "Leer": "Pusta",
  "Leer seit": "Pusta od",
  "Lieblinge": "Ulubione",
  "Lieblingsflasche": "Ulubiona butelka",
  "Limitierte Edition": "Edycja limitowana",
  "Marke": "Marka",
  "Mittel": "Średnie",
  "Nach Destillerie": "Według destylarni",
  "Nach Land": "Według kraju",
  "Nach Region": "Według regionu",
  "Nach Typ": "Według typu",
  "Name *": "Nazwa *",
  "Nase": "Nos",
  "Natürliche Farbe": "Naturalny kolor",
  "Nein": "Nie",
  "Nicht angegeben": "Nie podano",
  "Nicht einsortiert": "Nie umieszczona",
  "Niedrig": "Niskie",
  "Noch kein Whisky vorhanden — klicke auf ➕ Hinzufügen, um deine Sammlung zu starten.": "Nie ma jeszcze żadnej whisky — kliknij ➕ Dodaj, aby rozpocząć kolekcję.",
  "Noch keine getrunkenen Whiskys — markiere eine Flasche als leer oder füge eine Verkostung außerhalb der Sammlung hinzu.": "Nie ma jeszcze wypitych whisky — oznacz butelkę jako pustą lub dodaj degustację poza kolekcją.",
  "Ort der Verkostung": "Miejsce degustacji",
  "Persönliche Anmerkungen": "Uwagi osobiste",
  "Persönliche Bewertung (/5)": "Ocena osobista (/5)",
  "Phenole (ppm)": "Fenole (ppm)",
  "Platz": "Miejsce",
  "Regal": "Półka",
  "Region": "Region",
  "Reifungsdauer (Jahre)": "Czas leżakowania (lata)",
  "Reifungsübersicht": "Podsumowanie leżakowania",
  "Schließen": "Zamknij",
  "Speichern": "Zapisz",
  "Standort der Destillerie": "Lokalizacja destylarni",
  "Tageslimit des KI-Anbieters überschritten — versuch es morgen erneut oder gib die Daten von Hand ein.": "Dzienny limit dostawcy AI przekroczony — spróbuj jutro lub wprowadź dane ręcznie.",
  "Torfig": "Torfowy",
  "Torfigkeit": "Torfowość",
  "Typ": "Typ",
  "Unabhängige Abfüllung": "Niezależny rozlew",
  "Unabhängiger Abfüller": "Niezależny rozlewnia",
  "Unbekannt": "Nieznane",
  "Unbekannter Fehler.": "Nieznany błąd.",
  "Ungültiger Füllstand (0 bis 100).": "Nieprawidłowy poziom (0–100).",
  "Verbindungen (https) möglich. Das ist kein Fehler von WhiskyDB — ": "bezpieczne połączenie (https). To nie jest błąd WhiskyDB — ",
  "Verkostet am": "Degustowane",
  "Verkostung": "Degustacja",
  "Versiegelt": "Zakorkowana",
  "Verwaltung deiner Whisky-Sammlung: detaillierte Einträge, Fotoerkennung per KI, Statistiken.": "Zarządzaj swoją kolekcją whisky: szczegółowe wpisy, rozpoznawanie zdjęć przez AI, statystyki.",
  "Volumen (ml)": "Pojemność (ml)",
  "Wert (aktueller Bestand)": "Wartość (aktualne zapasy)",
  "Whisky bearbeiten": "Edytuj whisky",
  "Whisky hinzufügen": "Dodaj whisky",
  "Whisky(s) getrunken": "whisky wypity(ch)",
  "WhiskyDB — Sammlung": "WhiskyDB — Kolekcja",
  "Whiskybase-ID (optional)": "ID Whiskybase (opcjonalnie)",
  "Whiskybase-Link (optional)": "Link Whiskybase (opcjonalnie)",
  "Währung": "Waluta",
  "Zeitüberschreitung — bitte erneut versuchen.": "Przekroczono czas — spróbuj ponownie.",
  "Zur Sammlung hinzufügen": "Dodaj do kolekcji",
  "[WhiskyDB] getUserMedia nicht verfügbar:": "[WhiskyDB] getUserMedia niedostępne:",
  "aus der Sammlung,": "z kolekcji,",
  "außerhalb)": "poza)",
  "endgültig löschen — inklusive aller Exemplare?": "usunąć trwale — wraz ze wszystkimi butelkami?",
  "falls abweichend von der Destillerie": "jeśli różni się od destylarni",
  "geöffnet": "otwarta",
  "geöffnet am": "otwarta",
  "keine Flasche": "brak butelki",
  "leer": "pusta",
  "leer seit": "pusta od",
  "nicht torfig": "nietorfowy",
  "nimm das Foto mit deiner Kamera-App auf und wähle es dann in der Galerie, ": "zrób zdjęcie aplikacją aparatu, a potem wybierz je w galerii, ",
  "oder verbinde dich über https (externe URL / Nabu Casa) für die Direktaufnahme.": "albo połącz się przez https (zewnętrzny URL / Nabu Casa), aby zrobić zdjęcie bezpośrednio.",
  "torfig": "torfowy",
  "versiegelt": "zakorkowana",
  "von": "z",
  "z. B. 16 Year Old": "np. 16 Year Old",
  "z. B. 16, leer bei NAS": "np. 16, puste przy NAS",
  "z. B. Bar Le Malt": "np. Bar Le Malt",
  "z. B. Islay": "np. Islay",
  "z. B. Lagavulin": "np. Lagavulin",
  "z. B. Lagavulin 16 Years Old": "np. Lagavulin 16 Years Old",
  "z. B. Schottland": "np. Szkocja",
  "z. B. Talisker 18 Years Old": "np. Talisker 18 Years Old",
  "z. B. Wohnzimmerschrank": "np. szafka w salonie",
  "z. B. leicht, mittel, stark": "np. lekki, średni, mocny",
  "Öffnen": "Otwórz",
  "✏️ Bearbeiten": "✏️ Edytuj",
  "➕ Exemplar hinzufügen": "➕ Dodaj butelkę",
  "➕ Hinzufügen": "➕ Dodaj",
  "⭐ Notizen & Medien": "⭐ Notatki i multimedia",
  "🌍 Herkunft": "🌍 Pochodzenie",
  "🏷️ Klassifikation": "🏷️ Klasyfikacja",
  "👃 Verkostung": "👃 Degustacja",
  "💰 Persönliche Sammlung": "💰 Kolekcja osobista",
  "📊 Sammlungs-Statistiken": "📊 Statystyki kolekcji",
  "📊 Statistiken": "📊 Statystyki",
  "📥 Beim Anlegen": "📥 Przy dodawaniu",
  "📦 Abfüllung": "📦 Rozlew",
  "📷 Aufnehmen": "📷 Zrób zdjęcie",
  "📷 Foto aufnehmen": "📷 Zrób zdjęcie",
  "🔎 Foto wird analysiert…": "🔎 Analizowanie zdjęcia…",
  "🔎 Name, Destillerie, Region…": "🔎 Nazwa, destylarnia, region…",
  "🔗 Externe Referenzen": "🔗 Referencje zewnętrzne",
  "🔬 Eigenschaften": "🔬 Właściwości",
  "🖼️ Galerie": "🖼️ Galeria",
  "🗑️ Löschen": "🗑️ Usuń",
  "🛢️ Fassreifung": "🛢️ Leżakowanie w beczce",
  "🥂 Außerhalb der Sammlung": "🥂 Poza kolekcją",
  "🥂 Getrunkene": "🥂 Wypite",
  "🥂 Verkostung hinzufügen": "🥂 Dodaj degustację",
  "🥃 Identität": "🥃 Tożsamość",
  "🥃 Sammlung": "🥃 Kolekcja",
  "🥃 WhiskyDB — Sammlung": "🥃 WhiskyDB — Kolekcja"
},
"pt-BR": {
  "% verbleibend": "% restante",
  "(Einstellungen → Apps → Home Assistant → Berechtigungen → Kamera). ": "(Configurações → Apps → Home Assistant → Permissões → Câmera). ",
  "<em>Keine verwertbaren Felder.</em>": "<em>Nenhum campo utilizável.</em>",
  "API-Key ungültig oder vom Anbieter abgelehnt.": "Chave de API inválida ou rejeitada pelo provedor.",
  "Abbrechen": "Cancelar",
  "Abfülljahr": "Ano de engarrafamento",
  "Abgang": "Final",
  "Aktualisieren": "Atualizar",
  "Aktueller geschätzter Wert": "Valor atual estimado",
  "Alkoholgehalt (% vol)": "Teor alcoólico (% vol)",
  "Alle Status": "Todos os status",
  "Alle Typen": "Todos os tipos",
  "Allgemeine Notizen": "Notas gerais",
  "Als leer markieren": "Marcar como vazia",
  "Alter (Jahre)": "Idade (anos)",
  "Analysiert das Etikett per KI — prüfe die Ergebnisse, bevor du speicherst.": "Analisa o rótulo com IA — confira os resultados antes de salvar.",
  "Anfangsstatus": "Status inicial",
  "Antwort abgeschnitten — bitte mit einem schärferen Foto erneut versuchen.": "Resposta truncada — tente novamente com uma foto mais nítida.",
  "Antwort der KI nicht lesbar — bitte erneut versuchen.": "Resposta da IA ilegível — tente novamente.",
  "Anzahl": "Quantidade",
  "Auf dem Foto wurden keine verwertbaren Informationen erkannt — bitte von Hand ergänzen.": "Nenhuma informação utilizável reconhecida na foto — preencha manualmente.",
  "Ausgewählte Felder übernehmen": "Aplicar campos selecionados",
  "Barcode": "Código de barras",
  "Batch": "Lote",
  "Bewertung (/5)": "Avaliação (/5)",
  "Bis dahin funktioniert der Weg über die Galerie.": "Até lá, o caminho pela galeria continua funcionando.",
  "Datum": "Data",
  "Datum unbekannt": "Data desconhecida",
  "Der Name des Whiskys ist erforderlich.": "O nome do whisky é obrigatório.",
  "Destillationsjahr": "Ano de destilação",
  "Destillerie": "Destilaria",
  "Destillerien": "Destilarias",
  "Diese Verkostung löschen": "Excluir esta degustação",
  "Diese Verkostung löschen?": "Excluir esta degustação?",
  "Dieses Exemplar entfernen?": "Remover esta garrafa?",
  "Durchschnittsalter (Jahre)": "Idade média (anos)",
  "Edition": "Edição",
  "Einträge": "Registros",
  "Einträge,": "registros,",
  "Einträgen angezeigt (": "registros exibidos (",
  "Enddatum unbekannt": "Data de término desconhecida",
  "Entfernen": "Remover",
  "Ergebnisse der Erkennung": "Resultados do reconhecimento",
  "Etikettenfoto (URL)": "Foto do rótulo (URL)",
  "Expression / Cuvée": "Expression / Cuvée",
  "Externe ID": "ID externo",
  "Externer Link": "Link externo",
  "Fassnummer": "Número do barril",
  "Fasstyp": "Tipo de barril",
  "Fehler:": "Erro:",
  "Feld(er) erkannt und automatisch übernommen — bitte prüfen und speichern.": "campo(s) reconhecido(s) e aplicado(s) automaticamente — revise e salve.",
  "Feld(er) übernommen — bitte prüfen und speichern.": "campo(s) aplicado(s) — revise e salve.",
  "Felder werden automatisch in das Formular unten übernommen (außer bereits manuell ausgefüllte) — Häkchen anpassen, dann „Übernehmen“. Nichts wird gespeichert, bevor du das Formular abschickst.": "Os campos são aplicados automaticamente no formulário abaixo (exceto os já preenchidos manualmente) — ajuste as marcações e clique em «Aplicar». Nada é salvo antes de você enviar o formulário.",
  "Finish (Cask Finish)": "Finish (Cask Finish)",
  "Flaschen": "Garrafas",
  "Flaschen)": "garrafas)",
  "Flaschennummer": "Número da garrafa",
  "Foto (URL)": "Foto (URL)",
  "Foto aus der Galerie: Der direkte Kamerazugriff ist nur über sichere ": "Foto da galeria: o acesso direto à câmera só funciona com ",
  "Foto konnte nicht gelesen werden.": "Não foi possível ler a foto.",
  "Foto leer oder unlesbar.": "Foto vazia ou ilegível.",
  "Füllstand": "Nível",
  "Für einen nur verkosteten Whisky (Bar, bei Freunden, Tasting) — ohne ihn in die Sammlung aufzunehmen.": "Para um whisky apenas degustado (bar, na casa de amigos, tasting) — sem adicioná-lo à coleção.",
  "Gaumen": "Paladar",
  "Gesamtkonfidenz:": "Confiança geral:",
  "Gesamtzahl produzierter Flaschen": "Total de garrafas produzidas",
  "Geöffnet": "Aberta",
  "Hinzufügen": "Adicionar",
  "Hoch": "Alta",
  "Ja": "Sim",
  "Jahre": "anos",
  "KI-Dienst momentan nicht erreichbar.": "Serviço de IA momentaneamente indisponível.",
  "Kamerazugriff verweigert — prüfe die Berechtigungen der Home-Assistant-App ": "Acesso à câmera negado — verifique as permissões do app Home Assistant ",
  "Kaufdatum": "Data de compra",
  "Kaufort": "Local de compra",
  "Kaufpreis": "Preço de compra",
  "Kein Exemplar.": "Sem garrafa.",
  "Kein KI-API-Key konfiguriert — hinterlege ihn in den Einstellungen der Integration oder gib die Daten von Hand ein.": "Nenhuma chave de API de IA configurada — cadastre-a nas configurações da integração ou insira os dados manualmente.",
  "Kein Modell mit diesem API-Key erreichbar.": "Nenhum modelo acessível com esta chave de API.",
  "Keine Einträge entsprechen diesen Filtern.": "Nenhum registro corresponde a estes filtros.",
  "Kommentar": "Comentário",
  "Kühlfiltration": "Filtração a frio",
  "Lagerort": "Local de armazenamento",
  "Land": "País",
  "Leer": "Vazia",
  "Leer seit": "Vazia desde",
  "Lieblinge": "Favoritos",
  "Lieblingsflasche": "Garrafa favorita",
  "Limitierte Edition": "Edição limitada",
  "Marke": "Marca",
  "Mittel": "Média",
  "Nach Destillerie": "Por destilaria",
  "Nach Land": "Por país",
  "Nach Region": "Por região",
  "Nach Typ": "Por tipo",
  "Name *": "Nome *",
  "Nase": "Nariz",
  "Natürliche Farbe": "Cor natural",
  "Nein": "Não",
  "Nicht angegeben": "Não informado",
  "Nicht einsortiert": "Não alocada",
  "Niedrig": "Baixa",
  "Noch kein Whisky vorhanden — klicke auf ➕ Hinzufügen, um deine Sammlung zu starten.": "Ainda não há nenhum whisky — clique em ➕ Adicionar para começar sua coleção.",
  "Noch keine getrunkenen Whiskys — markiere eine Flasche als leer oder füge eine Verkostung außerhalb der Sammlung hinzu.": "Ainda não há whiskys concluídos — marque uma garrafa como vazia ou adicione uma degustação fora da coleção.",
  "Ort der Verkostung": "Local da degustação",
  "Persönliche Anmerkungen": "Observações pessoais",
  "Persönliche Bewertung (/5)": "Avaliação pessoal (/5)",
  "Phenole (ppm)": "Fenóis (ppm)",
  "Platz": "Posição",
  "Regal": "Estante",
  "Region": "Região",
  "Reifungsdauer (Jahre)": "Tempo de maturação (anos)",
  "Reifungsübersicht": "Resumo da maturação",
  "Schließen": "Fechar",
  "Speichern": "Salvar",
  "Standort der Destillerie": "Localização da destilaria",
  "Tageslimit des KI-Anbieters überschritten — versuch es morgen erneut oder gib die Daten von Hand ein.": "Limite diário do provedor de IA excedido — tente novamente amanhã ou insira os dados manualmente.",
  "Torfig": "Turfeado",
  "Torfigkeit": "Turfa",
  "Typ": "Tipo",
  "Unabhängige Abfüllung": "Engarrafamento independente",
  "Unabhängiger Abfüller": "Engarrafador independente",
  "Unbekannt": "Desconhecida",
  "Unbekannter Fehler.": "Erro desconhecido.",
  "Ungültiger Füllstand (0 bis 100).": "Nível inválido (0 a 100).",
  "Verbindungen (https) möglich. Das ist kein Fehler von WhiskyDB — ": "conexões seguras (https). Não é um defeito do WhiskyDB — ",
  "Verkostet am": "Degustado em",
  "Verkostung": "Degustação",
  "Versiegelt": "Selada",
  "Verwaltung deiner Whisky-Sammlung: detaillierte Einträge, Fotoerkennung per KI, Statistiken.": "Gerencie sua coleção de whiskys: registros detalhados, reconhecimento de foto por IA, estatísticas.",
  "Volumen (ml)": "Volume (ml)",
  "Wert (aktueller Bestand)": "Valor (estoque atual)",
  "Whisky bearbeiten": "Editar whisky",
  "Whisky hinzufügen": "Adicionar whisky",
  "Whisky(s) getrunken": "whisky(s) consumido(s)",
  "WhiskyDB — Sammlung": "WhiskyDB — Coleção",
  "Whiskybase-ID (optional)": "ID Whiskybase (opcional)",
  "Whiskybase-Link (optional)": "Link Whiskybase (opcional)",
  "Währung": "Moeda",
  "Zeitüberschreitung — bitte erneut versuchen.": "Tempo esgotado — tente novamente.",
  "Zur Sammlung hinzufügen": "Adicionar à coleção",
  "[WhiskyDB] getUserMedia nicht verfügbar:": "[WhiskyDB] getUserMedia indisponível:",
  "aus der Sammlung,": "da coleção,",
  "außerhalb)": "fora)",
  "endgültig löschen — inklusive aller Exemplare?": "excluir definitivamente — incluindo todas as garrafas?",
  "falls abweichend von der Destillerie": "se diferente da destilaria",
  "geöffnet": "aberta",
  "geöffnet am": "aberta em",
  "keine Flasche": "sem garrafa",
  "leer": "vazia",
  "leer seit": "vazia desde",
  "nicht torfig": "sem turfa",
  "nimm das Foto mit deiner Kamera-App auf und wähle es dann in der Galerie, ": "tire a foto com o app da câmera e depois selecione-a na galeria, ",
  "oder verbinde dich über https (externe URL / Nabu Casa) für die Direktaufnahme.": "ou acesse via https (URL externa / Nabu Casa) para captura direta.",
  "torfig": "turfeado",
  "versiegelt": "selada",
  "von": "de",
  "z. B. 16 Year Old": "ex.: 16 Year Old",
  "z. B. 16, leer bei NAS": "ex.: 16, vazio para NAS",
  "z. B. Bar Le Malt": "ex.: Bar Le Malt",
  "z. B. Islay": "ex.: Islay",
  "z. B. Lagavulin": "ex.: Lagavulin",
  "z. B. Lagavulin 16 Years Old": "ex.: Lagavulin 16 Years Old",
  "z. B. Schottland": "ex.: Escócia",
  "z. B. Talisker 18 Years Old": "ex.: Talisker 18 Years Old",
  "z. B. Wohnzimmerschrank": "ex.: armário da sala",
  "z. B. leicht, mittel, stark": "ex.: leve, médio, forte",
  "Öffnen": "Abrir",
  "✏️ Bearbeiten": "✏️ Editar",
  "➕ Exemplar hinzufügen": "➕ Adicionar garrafa",
  "➕ Hinzufügen": "➕ Adicionar",
  "⭐ Notizen & Medien": "⭐ Notas e mídia",
  "🌍 Herkunft": "🌍 Origem",
  "🏷️ Klassifikation": "🏷️ Classificação",
  "👃 Verkostung": "👃 Degustação",
  "💰 Persönliche Sammlung": "💰 Coleção pessoal",
  "📊 Sammlungs-Statistiken": "📊 Estatísticas da coleção",
  "📊 Statistiken": "📊 Estatísticas",
  "📥 Beim Anlegen": "📥 Ao criar",
  "📦 Abfüllung": "📦 Engarrafamento",
  "📷 Aufnehmen": "📷 Capturar",
  "📷 Foto aufnehmen": "📷 Tirar foto",
  "🔎 Foto wird analysiert…": "🔎 Analisando a foto…",
  "🔎 Name, Destillerie, Region…": "🔎 Nome, destilaria, região…",
  "🔗 Externe Referenzen": "🔗 Referências externas",
  "🔬 Eigenschaften": "🔬 Propriedades",
  "🖼️ Galerie": "🖼️ Galeria",
  "🗑️ Löschen": "🗑️ Excluir",
  "🛢️ Fassreifung": "🛢️ Maturação em barril",
  "🥂 Außerhalb der Sammlung": "🥂 Fora da coleção",
  "🥂 Getrunkene": "🥂 Whisky consumido",
  "🥂 Verkostung hinzufügen": "🥂 Adicionar degustação",
  "🥃 Identität": "🥃 Identidade",
  "🥃 Sammlung": "🥃 Coleção",
  "🥃 WhiskyDB — Sammlung": "🥃 WhiskyDB — Coleção"
},
"zh-Hans": {
  "% verbleibend": "剩余 %",
  "(Einstellungen → Apps → Home Assistant → Berechtigungen → Kamera). ": "(设置 → 应用 → Home Assistant → 权限 → 相机)。 ",
  "<em>Keine verwertbaren Felder.</em>": "<em>没有可用的字段。</em>",
  "API-Key ungültig oder vom Anbieter abgelehnt.": "API 密钥无效或被服务商拒绝。",
  "Abbrechen": "取消",
  "Abfülljahr": "装瓶年份",
  "Abgang": "尾韵",
  "Aktualisieren": "刷新",
  "Aktueller geschätzter Wert": "当前估算价值",
  "Alkoholgehalt (% vol)": "酒精度(% vol)",
  "Alle Status": "所有状态",
  "Alle Typen": "所有类型",
  "Allgemeine Notizen": "常规笔记",
  "Als leer markieren": "标记为已喝完",
  "Alter (Jahre)": "酒龄(年)",
  "Analysiert das Etikett per KI — prüfe die Ergebnisse, bevor du speicherst.": "通过 AI 分析酒标 — 保存前请核对结果。",
  "Anfangsstatus": "初始状态",
  "Antwort abgeschnitten — bitte mit einem schärferen Foto erneut versuchen.": "回复被截断 — 请用更清晰的照片重试。",
  "Antwort der KI nicht lesbar — bitte erneut versuchen.": "AI 回复无法读取 — 请重试。",
  "Anzahl": "数量",
  "Auf dem Foto wurden keine verwertbaren Informationen erkannt — bitte von Hand ergänzen.": "照片中未识别出可用信息 — 请手动补充。",
  "Ausgewählte Felder übernehmen": "应用所选字段",
  "Barcode": "条形码",
  "Batch": "批次",
  "Bewertung (/5)": "评分(/5)",
  "Bis dahin funktioniert der Weg über die Galerie.": "在此之前可以走相册这条路。",
  "Datum": "日期",
  "Datum unbekannt": "日期未知",
  "Der Name des Whiskys ist erforderlich.": "威士忌名称为必填项。",
  "Destillationsjahr": "蒸馏年份",
  "Destillerie": "蒸馏厂",
  "Destillerien": "蒸馏厂",
  "Diese Verkostung löschen": "删除此次品鉴",
  "Diese Verkostung löschen?": "删除此次品鉴?",
  "Dieses Exemplar entfernen?": "移除此瓶?",
  "Durchschnittsalter (Jahre)": "平均酒龄(年)",
  "Edition": "版本",
  "Einträge": "条目",
  "Einträge,": "个条目,",
  "Einträgen angezeigt (": "个条目已显示(",
  "Enddatum unbekannt": "结束日期未知",
  "Entfernen": "移除",
  "Ergebnisse der Erkennung": "识别结果",
  "Etikettenfoto (URL)": "酒标照片(URL)",
  "Expression / Cuvée": "Expression / Cuvée",
  "Externe ID": "外部 ID",
  "Externer Link": "外部链接",
  "Fassnummer": "桶号",
  "Fasstyp": "桶型",
  "Fehler:": "错误:",
  "Feld(er) erkannt und automatisch übernommen — bitte prüfen und speichern.": "个字段已识别并自动填入 — 请核对后保存。",
  "Feld(er) übernommen — bitte prüfen und speichern.": "个字段已填入 — 请核对后保存。",
  "Felder werden automatisch in das Formular unten übernommen (außer bereits manuell ausgefüllte) — Häkchen anpassen, dann „Übernehmen“. Nichts wird gespeichert, bevor du das Formular abschickst.": "字段会自动填入下方表单(已手动填写的除外)— 调整勾选后点击“应用”。提交表单前不会保存任何内容。",
  "Finish (Cask Finish)": "过桶(Finish)",
  "Flaschen": "瓶",
  "Flaschen)": "瓶)",
  "Flaschennummer": "瓶号",
  "Foto (URL)": "照片(URL)",
  "Foto aus der Galerie: Der direkte Kamerazugriff ist nur über sichere ": "相册选图:直接使用相机需要安全 ",
  "Foto konnte nicht gelesen werden.": "无法读取照片。",
  "Foto leer oder unlesbar.": "照片为空或无法读取。",
  "Füllstand": "液位",
  "Für einen nur verkosteten Whisky (Bar, bei Freunden, Tasting) — ohne ihn in die Sammlung aufzunehmen.": "用于仅品鉴过的威士忌(酒吧、朋友家、品鉴会)— 不收入收藏。",
  "Gaumen": "口感",
  "Gesamtkonfidenz:": "总体置信度:",
  "Gesamtzahl produzierter Flaschen": "生产总量(瓶)",
  "Geöffnet": "已开瓶",
  "Hinzufügen": "添加",
  "Hoch": "高",
  "Ja": "是",
  "Jahre": "年",
  "KI-Dienst momentan nicht erreichbar.": "AI 服务暂时不可用。",
  "Kamerazugriff verweigert — prüfe die Berechtigungen der Home-Assistant-App ": "相机访问被拒绝 — 请检查 Home Assistant 应用的权限 ",
  "Kaufdatum": "购买日期",
  "Kaufort": "购买地点",
  "Kaufpreis": "购买价格",
  "Kein Exemplar.": "暂无瓶记录。",
  "Kein KI-API-Key konfiguriert — hinterlege ihn in den Einstellungen der Integration oder gib die Daten von Hand ein.": "未配置 AI API 密钥 — 请在集成设置中填写,或手动输入数据。",
  "Kein Modell mit diesem API-Key erreichbar.": "该 API 密钥无法访问任何模型。",
  "Keine Einträge entsprechen diesen Filtern.": "没有条目符合这些筛选条件。",
  "Kommentar": "备注",
  "Kühlfiltration": "冷凝过滤",
  "Lagerort": "存放位置",
  "Land": "国家",
  "Leer": "已喝完",
  "Leer seit": "喝完日期",
  "Lieblinge": "最爱",
  "Lieblingsflasche": "最爱瓶",
  "Limitierte Edition": "限量版",
  "Marke": "品牌",
  "Mittel": "中",
  "Nach Destillerie": "按蒸馏厂",
  "Nach Land": "按国家",
  "Nach Region": "按产区",
  "Nach Typ": "按类型",
  "Name *": "名称 *",
  "Nase": "闻香",
  "Natürliche Farbe": "自然色",
  "Nein": "否",
  "Nicht angegeben": "未注明",
  "Nicht einsortiert": "未分类",
  "Niedrig": "低",
  "Noch kein Whisky vorhanden — klicke auf ➕ Hinzufügen, um deine Sammlung zu starten.": "还没有威士忌 — 点击 ➕ 添加,开启你的收藏。",
  "Noch keine getrunkenen Whiskys — markiere eine Flasche als leer oder füge eine Verkostung außerhalb der Sammlung hinzu.": "还没有喝过的威士忌 — 把一瓶标记为已喝完,或添加一次收藏之外的品鉴。",
  "Ort der Verkostung": "品鉴地点",
  "Persönliche Anmerkungen": "个人备注",
  "Persönliche Bewertung (/5)": "个人评分(/5)",
  "Phenole (ppm)": "泥煤酚含量(ppm)",
  "Platz": "格位",
  "Regal": "酒架",
  "Region": "产区",
  "Reifungsdauer (Jahre)": "熟成时长(年)",
  "Reifungsübersicht": "熟成概览",
  "Schließen": "关闭",
  "Speichern": "保存",
  "Standort der Destillerie": "蒸馏厂所在地",
  "Tageslimit des KI-Anbieters überschritten — versuch es morgen erneut oder gib die Daten von Hand ein.": "已超出 AI 服务商的每日限额 — 请明天再试,或手动输入数据。",
  "Torfig": "泥煤",
  "Torfigkeit": "泥煤度",
  "Typ": "类型",
  "Unabhängige Abfüllung": "独立装瓶",
  "Unabhängiger Abfüller": "独立装瓶商",
  "Unbekannt": "未知",
  "Unbekannter Fehler.": "未知错误。",
  "Ungültiger Füllstand (0 bis 100).": "液位无效(0 到 100)。",
  "Verbindungen (https) möglich. Das ist kein Fehler von WhiskyDB — ": "连接(https)。这不是 WhiskyDB 的问题 — ",
  "Verkostet am": "品鉴日期",
  "Verkostung": "品鉴",
  "Versiegelt": "未开封",
  "Verwaltung deiner Whisky-Sammlung: detaillierte Einträge, Fotoerkennung per KI, Statistiken.": "管理你的威士忌收藏:详细条目、AI 照片识别、统计数据。",
  "Volumen (ml)": "容量(ml)",
  "Wert (aktueller Bestand)": "价值(当前库存)",
  "Whisky bearbeiten": "编辑威士忌",
  "Whisky hinzufügen": "添加威士忌",
  "Whisky(s) getrunken": "瓶威士忌已喝完",
  "WhiskyDB — Sammlung": "WhiskyDB — 收藏",
  "Whiskybase-ID (optional)": "Whiskybase ID(可选)",
  "Whiskybase-Link (optional)": "Whiskybase 链接(可选)",
  "Währung": "货币",
  "Zeitüberschreitung — bitte erneut versuchen.": "请求超时 — 请重试。",
  "Zur Sammlung hinzufügen": "加入收藏",
  "[WhiskyDB] getUserMedia nicht verfügbar:": "[WhiskyDB] getUserMedia 不可用:",
  "aus der Sammlung,": "来自收藏,",
  "außerhalb)": "收藏之外)",
  "endgültig löschen — inklusive aller Exemplare?": " — 永久删除,包括所有瓶记录?",
  "falls abweichend von der Destillerie": "如与蒸馏厂不同",
  "geöffnet": "已开瓶",
  "geöffnet am": "开瓶日期",
  "keine Flasche": "无瓶记录",
  "leer": "已喝完",
  "leer seit": "喝完于",
  "nicht torfig": "非泥煤",
  "nimm das Foto mit deiner Kamera-App auf und wähle es dann in der Galerie, ": "请改用相机应用拍照,然后从相册选择, ",
  "oder verbinde dich über https (externe URL / Nabu Casa) für die Direktaufnahme.": "或通过 https(外部 URL / Nabu Casa)连接进行直接拍摄。",
  "torfig": "泥煤",
  "versiegelt": "未开封",
  "von": "/",
  "z. B. 16 Year Old": "如 16 Year Old",
  "z. B. 16, leer bei NAS": "如 16,NAS 留空",
  "z. B. Bar Le Malt": "如 Bar Le Malt",
  "z. B. Islay": "如 Islay",
  "z. B. Lagavulin": "如 Lagavulin",
  "z. B. Lagavulin 16 Years Old": "如 Lagavulin 16 Years Old",
  "z. B. Schottland": "如苏格兰",
  "z. B. Talisker 18 Years Old": "如 Talisker 18 Years Old",
  "z. B. Wohnzimmerschrank": "如客厅酒柜",
  "z. B. leicht, mittel, stark": "如轻柔、中等、强劲",
  "Öffnen": "开瓶",
  "✏️ Bearbeiten": "✏️ 编辑",
  "➕ Exemplar hinzufügen": "➕ 添加一瓶",
  "➕ Hinzufügen": "➕ 添加",
  "⭐ Notizen & Medien": "⭐ 笔记与媒体",
  "🌍 Herkunft": "🌍 产地",
  "🏷️ Klassifikation": "🏷️ 分类",
  "👃 Verkostung": "👃 品鉴",
  "💰 Persönliche Sammlung": "💰 个人收藏",
  "📊 Sammlungs-Statistiken": "📊 收藏统计",
  "📊 Statistiken": "📊 统计",
  "📥 Beim Anlegen": "📥 新建时",
  "📦 Abfüllung": "📦 装瓶信息",
  "📷 Aufnehmen": "📷 拍摄",
  "📷 Foto aufnehmen": "📷 拍摄照片",
  "🔎 Foto wird analysiert…": "🔎 照片分析中…",
  "🔎 Name, Destillerie, Region…": "🔎 名称、蒸馏厂、产区…",
  "🔗 Externe Referenzen": "🔗 外部参考",
  "🔬 Eigenschaften": "🔬 特性",
  "🖼️ Galerie": "🖼️ 图库",
  "🗑️ Löschen": "🗑️ 删除",
  "🛢️ Fassreifung": "🛢️ 桶陈",
  "🥂 Außerhalb der Sammlung": "🥂 收藏之外",
  "🥂 Getrunkene": "🥂 喝过的",
  "🥂 Verkostung hinzufügen": "🥂 添加品鉴",
  "🥃 Identität": "🥃 基本信息",
  "🥃 Sammlung": "🥃 收藏",
  "🥃 WhiskyDB — Sammlung": "🥃 WhiskyDB — 收藏"
},
"zh-Hant": {
  "% verbleibend": "剩餘 %",
  "(Einstellungen → Apps → Home Assistant → Berechtigungen → Kamera). ": "(設定 → 應用程式 → Home Assistant → 權限 → 相機)。 ",
  "<em>Keine verwertbaren Felder.</em>": "<em>沒有可用的欄位。</em>",
  "API-Key ungültig oder vom Anbieter abgelehnt.": "API 金鑰無效或被服務商拒絕。",
  "Abbrechen": "取消",
  "Abfülljahr": "裝瓶年份",
  "Abgang": "尾韻",
  "Aktualisieren": "重新整理",
  "Aktueller geschätzter Wert": "目前估計價值",
  "Alkoholgehalt (% vol)": "酒精濃度(% vol)",
  "Alle Status": "所有狀態",
  "Alle Typen": "所有類型",
  "Allgemeine Notizen": "一般筆記",
  "Als leer markieren": "標記為已喝完",
  "Alter (Jahre)": "酒齡(年)",
  "Analysiert das Etikett per KI — prüfe die Ergebnisse, bevor du speicherst.": "透過 AI 分析酒標 — 儲存前請核對結果。",
  "Anfangsstatus": "初始狀態",
  "Antwort abgeschnitten — bitte mit einem schärferen Foto erneut versuchen.": "回覆被截斷 — 請用更清晰的照片再試一次。",
  "Antwort der KI nicht lesbar — bitte erneut versuchen.": "AI 回覆無法讀取 — 請再試一次。",
  "Anzahl": "數量",
  "Auf dem Foto wurden keine verwertbaren Informationen erkannt — bitte von Hand ergänzen.": "照片中未辨識出可用資訊 — 請手動補充。",
  "Ausgewählte Felder übernehmen": "套用所選欄位",
  "Barcode": "條碼",
  "Batch": "批次",
  "Bewertung (/5)": "評分(/5)",
  "Bis dahin funktioniert der Weg über die Galerie.": "在此之前可以先透過相簿的方式。",
  "Datum": "日期",
  "Datum unbekannt": "日期未知",
  "Der Name des Whiskys ist erforderlich.": "威士忌名稱為必填欄位。",
  "Destillationsjahr": "蒸餾年份",
  "Destillerie": "蒸餾廠",
  "Destillerien": "蒸餾廠",
  "Diese Verkostung löschen": "刪除此次品嚐",
  "Diese Verkostung löschen?": "刪除此次品嚐?",
  "Dieses Exemplar entfernen?": "移除此瓶?",
  "Durchschnittsalter (Jahre)": "平均酒齡(年)",
  "Edition": "版本",
  "Einträge": "條目",
  "Einträge,": "個條目,",
  "Einträgen angezeigt (": "個條目已顯示(",
  "Enddatum unbekannt": "結束日期未知",
  "Entfernen": "移除",
  "Ergebnisse der Erkennung": "辨識結果",
  "Etikettenfoto (URL)": "酒標照片(URL)",
  "Expression / Cuvée": "Expression / Cuvée",
  "Externe ID": "外部 ID",
  "Externer Link": "外部連結",
  "Fassnummer": "桶號",
  "Fasstyp": "桶型",
  "Fehler:": "錯誤:",
  "Feld(er) erkannt und automatisch übernommen — bitte prüfen und speichern.": "個欄位已辨識並自動帶入 — 請核對後儲存。",
  "Feld(er) übernommen — bitte prüfen und speichern.": "個欄位已帶入 — 請核對後儲存。",
  "Felder werden automatisch in das Formular unten übernommen (außer bereits manuell ausgefüllte) — Häkchen anpassen, dann „Übernehmen“. Nichts wird gespeichert, bevor du das Formular abschickst.": "欄位會自動帶入下方表單(已手動填寫的除外)— 調整勾選後點選「套用」。送出表單前不會儲存任何內容。",
  "Finish (Cask Finish)": "過桶(Finish)",
  "Flaschen": "瓶",
  "Flaschen)": "瓶)",
  "Flaschennummer": "瓶號",
  "Foto (URL)": "照片(URL)",
  "Foto aus der Galerie: Der direkte Kamerazugriff ist nur über sichere ": "從相簿選圖:直接使用相機需要安全 ",
  "Foto konnte nicht gelesen werden.": "無法讀取照片。",
  "Foto leer oder unlesbar.": "照片為空或無法讀取。",
  "Füllstand": "液位",
  "Für einen nur verkosteten Whisky (Bar, bei Freunden, Tasting) — ohne ihn in die Sammlung aufzunehmen.": "用於僅品嚐過的威士忌(酒吧、朋友家、品嚐會)— 不納入收藏。",
  "Gaumen": "口感",
  "Gesamtkonfidenz:": "整體信心度:",
  "Gesamtzahl produzierter Flaschen": "生產總量(瓶)",
  "Geöffnet": "已開瓶",
  "Hinzufügen": "新增",
  "Hoch": "高",
  "Ja": "是",
  "Jahre": "年",
  "KI-Dienst momentan nicht erreichbar.": "AI 服務暫時無法連線。",
  "Kamerazugriff verweigert — prüfe die Berechtigungen der Home-Assistant-App ": "相機存取被拒絕 — 請檢查 Home Assistant 應用程式的權限 ",
  "Kaufdatum": "購買日期",
  "Kaufort": "購買地點",
  "Kaufpreis": "購買價格",
  "Kein Exemplar.": "暫無瓶紀錄。",
  "Kein KI-API-Key konfiguriert — hinterlege ihn in den Einstellungen der Integration oder gib die Daten von Hand ein.": "尚未設定 AI API 金鑰 — 請在整合設定中填寫,或手動輸入資料。",
  "Kein Modell mit diesem API-Key erreichbar.": "此 API 金鑰無法連上任何模型。",
  "Keine Einträge entsprechen diesen Filtern.": "沒有條目符合這些篩選條件。",
  "Kommentar": "備註",
  "Kühlfiltration": "冷凝過濾",
  "Lagerort": "存放位置",
  "Land": "國家",
  "Leer": "已喝完",
  "Leer seit": "喝完日期",
  "Lieblinge": "最愛",
  "Lieblingsflasche": "最愛瓶",
  "Limitierte Edition": "限量版",
  "Marke": "品牌",
  "Mittel": "中",
  "Nach Destillerie": "按蒸餾廠",
  "Nach Land": "按國家",
  "Nach Region": "按產區",
  "Nach Typ": "按類型",
  "Name *": "名稱 *",
  "Nase": "聞香",
  "Natürliche Farbe": "自然色",
  "Nein": "否",
  "Nicht angegeben": "未註明",
  "Nicht einsortiert": "未分類",
  "Niedrig": "低",
  "Noch kein Whisky vorhanden — klicke auf ➕ Hinzufügen, um deine Sammlung zu starten.": "還沒有威士忌 — 點選 ➕ 新增,開始你的收藏。",
  "Noch keine getrunkenen Whiskys — markiere eine Flasche als leer oder füge eine Verkostung außerhalb der Sammlung hinzu.": "還沒有喝過的威士忌 — 將一瓶標記為已喝完,或新增一次收藏之外的品嚐。",
  "Ort der Verkostung": "品嚐地點",
  "Persönliche Anmerkungen": "個人備註",
  "Persönliche Bewertung (/5)": "個人評分(/5)",
  "Phenole (ppm)": "泥煤酚含量(ppm)",
  "Platz": "格位",
  "Regal": "酒架",
  "Region": "產區",
  "Reifungsdauer (Jahre)": "熟成時長(年)",
  "Reifungsübersicht": "熟成概覽",
  "Schließen": "關閉",
  "Speichern": "儲存",
  "Standort der Destillerie": "蒸餾廠所在地",
  "Tageslimit des KI-Anbieters überschritten — versuch es morgen erneut oder gib die Daten von Hand ein.": "已超過 AI 服務商的每日限額 — 請明天再試,或手動輸入資料。",
  "Torfig": "泥煤",
  "Torfigkeit": "泥煤度",
  "Typ": "類型",
  "Unabhängige Abfüllung": "獨立裝瓶",
  "Unabhängiger Abfüller": "獨立裝瓶商",
  "Unbekannt": "未知",
  "Unbekannter Fehler.": "未知錯誤。",
  "Ungültiger Füllstand (0 bis 100).": "液位無效(0 到 100)。",
  "Verbindungen (https) möglich. Das ist kein Fehler von WhiskyDB — ": "連線(https)。這不是 WhiskyDB 的問題 — ",
  "Verkostet am": "品嚐日期",
  "Verkostung": "品嚐",
  "Versiegelt": "未開封",
  "Verwaltung deiner Whisky-Sammlung: detaillierte Einträge, Fotoerkennung per KI, Statistiken.": "管理你的威士忌收藏:詳細條目、AI 照片辨識、統計資料。",
  "Volumen (ml)": "容量(ml)",
  "Wert (aktueller Bestand)": "價值(目前庫存)",
  "Whisky bearbeiten": "編輯威士忌",
  "Whisky hinzufügen": "新增威士忌",
  "Whisky(s) getrunken": "瓶威士忌已喝完",
  "WhiskyDB — Sammlung": "WhiskyDB — 收藏",
  "Whiskybase-ID (optional)": "Whiskybase ID(選填)",
  "Whiskybase-Link (optional)": "Whiskybase 連結(選填)",
  "Währung": "貨幣",
  "Zeitüberschreitung — bitte erneut versuchen.": "請求逾時 — 請再試一次。",
  "Zur Sammlung hinzufügen": "加入收藏",
  "[WhiskyDB] getUserMedia nicht verfügbar:": "[WhiskyDB] getUserMedia 無法使用:",
  "aus der Sammlung,": "來自收藏,",
  "außerhalb)": "收藏之外)",
  "endgültig löschen — inklusive aller Exemplare?": " — 永久刪除,包含所有瓶紀錄?",
  "falls abweichend von der Destillerie": "如與蒸餾廠不同",
  "geöffnet": "已開瓶",
  "geöffnet am": "開瓶日期",
  "keine Flasche": "無瓶紀錄",
  "leer": "已喝完",
  "leer seit": "喝完於",
  "nicht torfig": "非泥煤",
  "nimm das Foto mit deiner Kamera-App auf und wähle es dann in der Galerie, ": "請改用相機 App 拍照,然後從相簿選擇, ",
  "oder verbinde dich über https (externe URL / Nabu Casa) für die Direktaufnahme.": "或透過 https(外部 URL / Nabu Casa)連線進行直接拍攝。",
  "torfig": "泥煤",
  "versiegelt": "未開封",
  "von": "/",
  "z. B. 16 Year Old": "如 16 Year Old",
  "z. B. 16, leer bei NAS": "如 16,NAS 留空",
  "z. B. Bar Le Malt": "如 Bar Le Malt",
  "z. B. Islay": "如 Islay",
  "z. B. Lagavulin": "如 Lagavulin",
  "z. B. Lagavulin 16 Years Old": "如 Lagavulin 16 Years Old",
  "z. B. Schottland": "如蘇格蘭",
  "z. B. Talisker 18 Years Old": "如 Talisker 18 Years Old",
  "z. B. Wohnzimmerschrank": "如客廳酒櫃",
  "z. B. leicht, mittel, stark": "如輕柔、中等、強勁",
  "Öffnen": "開瓶",
  "✏️ Bearbeiten": "✏️ 編輯",
  "➕ Exemplar hinzufügen": "➕ 新增一瓶",
  "➕ Hinzufügen": "➕ 新增",
  "⭐ Notizen & Medien": "⭐ 筆記與媒體",
  "🌍 Herkunft": "🌍 產地",
  "🏷️ Klassifikation": "🏷️ 分類",
  "👃 Verkostung": "👃 品嚐",
  "💰 Persönliche Sammlung": "💰 個人收藏",
  "📊 Sammlungs-Statistiken": "📊 收藏統計",
  "📊 Statistiken": "📊 統計",
  "📥 Beim Anlegen": "📥 新增時",
  "📦 Abfüllung": "📦 裝瓶資訊",
  "📷 Aufnehmen": "📷 拍攝",
  "📷 Foto aufnehmen": "📷 拍攝照片",
  "🔎 Foto wird analysiert…": "🔎 照片辨識中…",
  "🔎 Name, Destillerie, Region…": "🔎 名稱、蒸餾廠、產區…",
  "🔗 Externe Referenzen": "🔗 外部參考",
  "🔬 Eigenschaften": "🔬 特性",
  "🖼️ Galerie": "🖼️ 圖庫",
  "🗑️ Löschen": "🗑️ 刪除",
  "🛢️ Fassreifung": "🛢️ 桶陳",
  "🥂 Außerhalb der Sammlung": "🥂 收藏之外",
  "🥂 Getrunkene": "🥂 喝過的",
  "🥂 Verkostung hinzufügen": "🥂 新增品嚐",
  "🥃 Identität": "🥃 基本資訊",
  "🥃 Sammlung": "🥃 收藏",
  "🥃 WhiskyDB — Sammlung": "🥃 WhiskyDB — 收藏"
}
};

let CARD_LANG = "de";

// Normalisiert HA-Sprach-Tags ("pt-br" -> "pt-BR", "zh" -> "zh-Hans", ...).
function _cardNormalizeLang(tag) {
  if (!tag) return "";
  const t = String(tag).toLowerCase().replace(/_/g, "-");
  return {"pt-br": "pt-BR", "zh-cn": "zh-Hans", "zh-sg": "zh-Hans", "zh-my": "zh-Hans", "zh": "zh-Hans", "zh-tw": "zh-Hant", "zh-hk": "zh-Hant", "zh-mo": "zh-Hant", "zh-hans": "zh-Hans", "zh-hant": "zh-Hant", "es-419": "es", "es-mx": "es", "es-ar": "es", "es-co": "es", "es-cl": "es", "en-us": "en", "en-gb": "en", "en-au": "en", "en-ca": "en", "de-at": "de", "de-ch": "de", "de-lu": "de", "fr-ca": "fr", "fr-be": "fr", "fr-ch": "fr", "nl-be": "nl", "it-ch": "it", "pt-pt": "pt-BR", "pt": "pt-BR"}[t] || t;
}

// Wählt die Kartensprache: config.language überschreibt, sonst HA-Sprache.
function _cardResolveLang(hass, config) {
  const override = config && config.language && String(config.language).toLowerCase() !== "auto"
    ? _cardNormalizeLang(config.language) : "";
  if (override) {
    if (override === "de" || CARD_I18N[override]) return override;
    return "en";
  }
  const tag = hass && hass.locale && hass.locale.language
    ? _cardNormalizeLang(hass.locale.language) : "";
  if (!tag) return "de";
  if (tag === "de" || CARD_I18N[tag]) return tag;
  return "en";
}

// Übersetzt einen deutschen Quell-String in die aktuelle Kartensprache.
function tr(s) {
  if (CARD_LANG === "de") return s;
  const d = CARD_I18N[CARD_LANG];
  if (d && d[s] !== undefined) return d[s];
  const e = CARD_I18N.en;
  if (e && e[s] !== undefined) return e[s];
  return s;
}

// ── Ende i18n ──


// Doit rester synchronisé avec WHISKY_TYPE_VALUES dans __init__.py.
const WHISKY_TYPE_VALUES = [
  "Single Malt", "Blended Malt", "Blended Whisky", "Single Grain",
  "Bourbon", "Rye", "Tennessee Whiskey", "Corn Whiskey",
  "Irish Single Malt", "Irish Pot Still", "Japanese Whisky",
  "World Whisky", "Other",
];

// Doit rester synchronisé avec CASK_TYPE_SUGGESTIONS dans __init__.py.
const CASK_TYPE_SUGGESTIONS = [
  "Bourbon", "First Fill Bourbon", "Refill Bourbon", "Sherry", "Oloroso",
  "PX", "Port", "Madeira", "Wine", "Virgin Oak", "Mizunara",
  "Multiple Casks", "Other",
];

const BOTTLE_STATUS_LABELS = { sealed: tr("Versiegelt"), opened: tr("Geöffnet"), finished: tr("Leer") };

const ERROR_MESSAGES = {
  no_key: tr("Kein KI-API-Key konfiguriert — hinterlege ihn in den Einstellungen der Integration oder gib die Daten von Hand ein."),
  invalid_key: tr("API-Key ungültig oder vom Anbieter abgelehnt."),
  quota_exceeded: tr("Tageslimit des KI-Anbieters überschritten — versuch es morgen erneut oder gib die Daten von Hand ein."),
  service_unavailable: tr("KI-Dienst momentan nicht erreichbar."),
  timeout: tr("Zeitüberschreitung — bitte erneut versuchen."),
  no_model: tr("Kein Modell mit diesem API-Key erreichbar."),
  truncated: tr("Antwort abgeschnitten — bitte mit einem schärferen Foto erneut versuchen."),
  parse_error: tr("Antwort der KI nicht lesbar — bitte erneut versuchen."),
};

// ── Champs du formulaire, groupés par section (brief §2 et §6) ──────────────
// type: "text" | "number" | "tri" | "select" | "textarea" | "checkbox"
const FORM_SECTIONS = [
  {
    title: tr("🥃 Identität"), key: "identity",
    fields: [
      { key: "name", label: tr("Name *"), type: "text", required: true, placeholder: tr("z. B. Lagavulin 16 Years Old") },
      { key: "distillery", label: tr("Destillerie"), type: "text", placeholder: tr("z. B. Lagavulin") },
      { key: "bottler", label: tr("Unabhängiger Abfüller"), type: "text", placeholder: tr("falls abweichend von der Destillerie") },
      { key: "brand", label: tr("Marke"), type: "text" },
      { key: "expression", label: tr("Expression / Cuvée"), type: "text", placeholder: tr("z. B. 16 Year Old") },
    ],
  },
  {
    title: tr("🌍 Herkunft"), key: "origin",
    fields: [
      { key: "country", label: tr("Land"), type: "text", placeholder: tr("z. B. Schottland") },
      { key: "region", label: tr("Region"), type: "text", placeholder: tr("z. B. Islay") },
      { key: "distillery_location", label: tr("Standort der Destillerie"), type: "text" },
    ],
  },
  {
    title: tr("🏷️ Klassifikation"), key: "classification",
    fields: [
      { key: "whisky_type", label: tr("Typ"), type: "select", options: WHISKY_TYPE_VALUES },
    ],
  },
  {
    title: tr("🔬 Eigenschaften"), key: "characteristics",
    fields: [
      { key: "age", label: tr("Alter (Jahre)"), type: "text", placeholder: tr("z. B. 16, leer bei NAS") },
      { key: "vintage", label: tr("Destillationsjahr"), type: "text" },
      { key: "bottling_year", label: tr("Abfülljahr"), type: "text" },
      { key: "abv", label: tr("Alkoholgehalt (% vol)"), type: "number", step: "0.1" },
      { key: "volume_ml", label: tr("Volumen (ml)"), type: "number", placeholder: "700" },
      { key: "chill_filtered", label: tr("Kühlfiltration"), type: "tri" },
      { key: "natural_colour", label: tr("Natürliche Farbe"), type: "tri" },
      { key: "peated", label: tr("Torfig"), type: "tri" },
      { key: "peat_level", label: tr("Torfigkeit"), type: "text", placeholder: tr("z. B. leicht, mittel, stark") },
      { key: "ppm", label: tr("Phenole (ppm)"), type: "number" },
    ],
  },
  {
    title: tr("🛢️ Fassreifung"), key: "maturation",
    fields: [
      { key: "maturation", label: tr("Reifungsübersicht"), type: "text" },
      { key: "cask_type", label: tr("Fasstyp"), type: "text", list: "whisky-cask-types" },
      { key: "cask_number", label: tr("Fassnummer"), type: "text" },
      { key: "finish", label: tr("Finish (Cask Finish)"), type: "text" },
      { key: "maturation_years", label: tr("Reifungsdauer (Jahre)"), type: "text" },
    ],
  },
  {
    title: tr("📦 Abfüllung"), key: "bottling",
    fields: [
      { key: "batch", label: tr("Batch"), type: "text" },
      { key: "edition", label: tr("Edition"), type: "text" },
      { key: "bottle_number", label: tr("Flaschennummer"), type: "text" },
      { key: "number_of_bottles", label: tr("Gesamtzahl produzierter Flaschen"), type: "text" },
      { key: "limited_edition", label: tr("Limitierte Edition"), type: "tri" },
      { key: "independent_bottler", label: tr("Unabhängige Abfüllung"), type: "tri" },
    ],
  },
  {
    title: tr("👃 Verkostung"), key: "tasting",
    fields: [
      { key: "tasting_notes", label: tr("Allgemeine Notizen"), type: "textarea" },
      { key: "nose_notes", label: tr("Nase"), type: "textarea" },
      { key: "palate_notes", label: tr("Gaumen"), type: "textarea" },
      { key: "finish_notes", label: tr("Abgang"), type: "textarea" },
    ],
  },
  {
    title: tr("💰 Persönliche Sammlung"), key: "collection",
    fields: [
      { key: "price", label: tr("Kaufpreis"), type: "number", step: "0.01" },
      { key: "current_value", label: tr("Aktueller geschätzter Wert"), type: "number", step: "0.01" },
      { key: "currency", label: tr("Währung"), type: "text", placeholder: "EUR" },
      { key: "purchase_date", label: tr("Kaufdatum"), type: "date" },
      { key: "purchase_location", label: tr("Kaufort"), type: "text" },
      { key: "storage_location", label: tr("Lagerort"), type: "text", placeholder: tr("z. B. Wohnzimmerschrank") },
    ],
  },
  {
    title: tr("⭐ Notizen & Medien"), key: "notes",
    fields: [
      { key: "rating", label: tr("Persönliche Bewertung (/5)"), type: "number", step: "0.5", min: "0", max: "5" },
      { key: "favorite", label: tr("Lieblingsflasche"), type: "checkbox" },
      { key: "notes", label: tr("Persönliche Anmerkungen"), type: "textarea" },
      { key: "image_url", label: tr("Foto (URL)"), type: "text" },
      { key: "label_image_url", label: tr("Etikettenfoto (URL)"), type: "text" },
    ],
  },
  {
    title: tr("🔗 Externe Referenzen"), key: "external",
    fields: [
      { key: "barcode", label: tr("Barcode"), type: "text" },
      { key: "external_id", label: tr("Externe ID"), type: "text" },
      { key: "external_url", label: tr("Externer Link"), type: "text" },
      { key: "whiskybase_id", label: tr("Whiskybase-ID (optional)"), type: "text" },
      { key: "whiskybase_url", label: tr("Whiskybase-Link (optional)"), type: "text" },
    ],
  },
];

// Champs uniquement présents à la CRÉATION (pas de sens en édition, où l'état
// physique se gère bouteille par bouteille depuis la fiche détail — commit 7).
const CREATE_ONLY_SECTION = {
  title: tr("📥 Beim Anlegen"), key: "creation",
  fields: [
    { key: "quantity", label: tr("Anzahl"), type: "number", min: "1", placeholder: "1" },
    { key: "initial_status", label: tr("Anfangsstatus"), type: "select", options: ["sealed", "opened", "finished"], optionLabels: BOTTLE_STATUS_LABELS },
  ],
};

// ── Fonctions pures (testables sans DOM — voir export en fin de fichier) ────

function triStateToPayload(value) {
  // "" (non renseigné) -> undefined : le champ n'est PAS envoyé, la valeur
  // par défaut (null côté backend) reste en place. "true"/"false" -> booléen.
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function triStateFromValue(value) {
  if (value === true) return "true";
  if (value === false) return "false";
  return "";
}

function numberOrUndefined(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === "") return undefined;
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

const TRI_FIELDS = new Set(["chill_filtered", "natural_colour", "peated", "limited_edition", "independent_bottler"]);
const NUMBER_FIELDS = new Set(["abv", "volume_ml", "ppm", "price", "current_value", "rating", "quantity"]);

/**
 * Construit le payload d'appel de service (add_whisky / update_whisky) à
 * partir des valeurs BRUTES du formulaire (toutes des chaînes, comme le
 * rendrait une lecture de <input>.value). Ne renvoie QUE les champs
 * effectivement renseignés : un champ vide n'écrase jamais une valeur
 * existante côté backend (voir svc_update_whisky, qui ne touche que les
 * clés présentes dans call.data).
 */
function buildWhiskyPayload(raw) {
  const payload = {};
  for (const key of Object.keys(raw)) {
    const v = raw[key];
    if (TRI_FIELDS.has(key)) {
      const tv = triStateToPayload(v);
      if (tv !== undefined) payload[key] = tv;
    } else if (key === "favorite") {
      payload[key] = !!v;
    } else if (NUMBER_FIELDS.has(key)) {
      const n = numberOrUndefined(v);
      if (n !== undefined) payload[key] = n;
    } else if (v !== undefined && v !== null && String(v).trim() !== "") {
      payload[key] = String(v).trim();
    }
  }
  return payload;
}

const CONFIDENCE_TIERS = [
  { min: 0.8, label: tr("Hoch"), cls: "conf-high" },
  { min: 0.5, label: tr("Mittel"), cls: "conf-mid" },
  { min: 0, label: tr("Niedrig"), cls: "conf-low" },
];

function confidenceTier(score) {
  if (score === undefined || score === null) return { label: tr("Unbekannt"), cls: "conf-none" };
  for (const t of CONFIDENCE_TIERS) if (score >= t.min) return t;
  return CONFIDENCE_TIERS[CONFIDENCE_TIERS.length - 1];
}

/**
 * Liste des champs exploitables d'un résultat de reconnaissance (non null),
 * avec leur confiance — sert à construire l'écran de validation (brief §3 :
 * toujours présenter à l'utilisateur avant tout enregistrement).
 */
function recognitionFieldList(result) {
  if (!result) return [];
  const skip = new Set(["confidence_score", "field_confidence"]);
  const conf = result.field_confidence || {};
  return Object.keys(result)
    .filter((k) => !skip.has(k) && result[k] !== null && result[k] !== undefined && result[k] !== "")
    .map((k) => ({ key: k, value: result[k], confidence: conf[k] }));
}

/**
 * Applique les champs SÉLECTIONNÉS d'un résultat de reconnaissance à un jeu
 * de valeurs de formulaire existant, SANS jamais écraser un champ déjà
 * rempli par l'utilisateur sauf si explicitement sélectionné.
 */
function applyRecognitionSelection(currentValues, result, selectedKeys) {
  const next = { ...currentValues };
  for (const key of selectedKeys) {
    if (result[key] !== null && result[key] !== undefined) {
      next[key] = TRI_FIELDS.has(key) ? triStateFromValue(result[key]) : String(result[key]);
    }
  }
  return next;
}

// ── Fonctions pures : liste & fiche détail (commit 7) ───────────────────────

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

const STATUS_ORDER = ["sealed", "opened", "finished"];
const STATUS_DOT = { sealed: "●", opened: "◐", finished: "○" };

/** {sealed: n, opened: n, finished: n} à partir des emplacements d'une fiche. */
function statusBreakdown(slots) {
  const counts = { sealed: 0, opened: 0, finished: 0 };
  for (const s of slots || []) {
    const st = counts.hasOwnProperty(s.bottle_status) ? s.bottle_status : "sealed";
    counts[st] += 1;
  }
  return counts;
}

/** Résumé court des statuts pour l'affichage tuile, ex. "2 scellées · 1 ouverte". */
function statusSummary(slots) {
  const counts = statusBreakdown(slots);
  const labels = { sealed: tr("versiegelt"), opened: tr("geöffnet"), finished: tr("leer") };
  return STATUS_ORDER.filter((k) => counts[k] > 0)
    .map((k) => `${STATUS_DOT[k]} ${counts[k]} ${labels[k]}`)
    .join(" · ") || tr("keine Flasche");
}

/** "★★★★☆" pour une note 0-5 (arrondie à l'entier le plus proche pour l'affichage). */
function ratingStars(rating) {
  const n = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

/** Ligne "Islay · Single Malt" / "16 ans · 43 %" pour la tuile, en omettant les champs absents. */
function metaLine(parts) {
  return parts.filter((p) => p !== null && p !== undefined && String(p).trim() !== "").join(" · ");
}

function tileHTML(w) {
  const meta = w.whisky_meta || {};
  const line1 = metaLine([meta.region || meta.country, meta.whisky_type]);
  const line2 = metaLine([meta.age ? `${meta.age} ${tr("Jahre")}` : null, meta.abv ? `${meta.abv} %` : null]);
  const img = w.image_url
    ? `<img class="wc-tile-img" src="${escapeHtml(w.image_url)}" alt="" />`
    : `<div class="wc-tile-img wc-tile-img-placeholder">🥃</div>`;
  return `
    <div class="wc-tile" data-whisky-id="${escapeHtml(w.id)}">
      ${img}
      <div class="wc-tile-body">
        <div class="wc-tile-name">${w.favorite ? "★ " : ""}${escapeHtml(w.name)}</div>
        ${meta.expression ? `<div class="wc-tile-sub">${escapeHtml(meta.expression)}</div>` : ""}
        ${line1 ? `<div class="wc-tile-sub">${escapeHtml(line1)}</div>` : ""}
        ${line2 ? `<div class="wc-tile-sub">${escapeHtml(line2)}</div>` : ""}
        <div class="wc-tile-status">${escapeHtml(statusSummary(w.slots))}</div>
        ${w.rating ? `<div class="wc-tile-rating">${ratingStars(w.rating)}</div>` : ""}
      </div>
    </div>`;
}

/**
 * Aplatit tous les exemplaires TERMINÉS de la collection en une liste plate
 * {whisky, slot, slotIdx}, triée par date de fin décroissante (les exemplaires
 * sans date connue sont relégués en fin de liste). Alimente l'onglet
 * "🥂 Whisky bu" — un journal des bouteilles terminées, distinct de la vue
 * "Collection" qui mélange tous les statuts.
 */
function finishedEntries(whiskies) {
  const out = [];
  for (const w of whiskies || []) {
    (w.slots || []).forEach((slot, slotIdx) => {
      if ((slot.bottle_status || "sealed") === "finished") out.push({ w, slot, slotIdx });
    });
  }
  out.sort((a, b) => String(b.slot.finished_date || "").localeCompare(String(a.slot.finished_date || "")));
  return out;
}

function finishedRowHTML(entry) {
  const { w, slot, slotIdx } = entry;
  const meta = w.whisky_meta || {};
  const line = metaLine([meta.region || meta.country, meta.whisky_type, meta.age ? `${meta.age} ${tr("Jahre")}` : null]);
  const date = slot.finished_date ? `${tr("Leer seit")} ${escapeHtml(slot.finished_date)}` : tr("Enddatum unbekannt");
  const img = w.image_url
    ? `<img class="wc-fin-img" src="${escapeHtml(w.image_url)}" alt="" />`
    : `<div class="wc-fin-img wc-fin-img-placeholder">🥃</div>`;
  return `
    <div class="wc-fin-row" data-whisky-id="${escapeHtml(w.id)}" data-slot-idx="${slotIdx}">
      ${img}
      <div class="wc-fin-body">
        <div class="wc-fin-name">${w.favorite ? "★ " : ""}${escapeHtml(w.name)}</div>
        ${line ? `<div class="wc-fin-sub">${escapeHtml(line)}</div>` : ""}
        <div class="wc-fin-date">${date}</div>
        ${slot.comment ? `<div class="wc-fin-comment">${escapeHtml(slot.comment)}</div>` : ""}
      </div>
      ${w.rating ? `<div class="wc-fin-rating">${ratingStars(w.rating)}</div>` : ""}
    </div>`;
}

function tastingRowHTML(t) {
  const line = metaLine([t.region || t.country, t.whisky_type]);
  const date = t.tasted_date ? `${tr("Verkostet am")} ${escapeHtml(t.tasted_date)}` : tr("Datum unbekannt");
  const badge = `${tr("🥂 Außerhalb der Sammlung")}${t.place ? ` · ${escapeHtml(t.place)}` : ""}`;
  return `
    <div class="wc-fin-row wc-tasting-row" data-tasting-id="${escapeHtml(t.id)}">
      <div class="wc-fin-img wc-fin-img-placeholder">🥂</div>
      <div class="wc-fin-body">
        <div class="wc-fin-name">${escapeHtml(t.name)}</div>
        ${line ? `<div class="wc-fin-sub">${escapeHtml(line)}</div>` : ""}
        <div class="wc-fin-sub wc-tasting-badge">${badge}</div>
        <div class="wc-fin-date">${date}</div>
        ${t.comment ? `<div class="wc-fin-comment">${escapeHtml(t.comment)}</div>` : ""}
      </div>
      ${t.rating ? `<div class="wc-fin-rating">${ratingStars(t.rating)}</div>` : ""}
      <button type="button" class="wc-btn wc-tasting-remove" data-tasting-id="${escapeHtml(t.id)}" title="${tr("Diese Verkostung löschen")}">🗑️</button>
    </div>`;
}

/**
 * Fusionne, pour l'onglet "🥂 Whisky bu", les bouteilles TERMINÉES de la
 * collection (`finishedEntries`) et les dégustations hors collection
 * (`tasting_log` — whiskies simplement goûtés, jamais possédés), triées
 * ensemble du plus récent au plus ancien. Chaque entrée porte un
 * discriminant `kind` ("finished" | "tasting") pour choisir le bon rendu.
 */
function mergedTastingEntries(whiskies, tastingLog) {
  const finished = finishedEntries(whiskies).map((e) => ({ kind: "finished", date: e.slot.finished_date || "", entry: e }));
  const tastings = (tastingLog || []).map((t) => ({ kind: "tasting", date: t.tasted_date || "", entry: t }));
  return [...finished, ...tastings].sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

/** Regroupe les champs whisky_meta en lignes label/valeur par section détail (commit 6/7 partagent FORM_SECTIONS). */
function detailRows(w) {
  const meta = w.whisky_meta || {};
  const get = (k) => (k in w ? w[k] : meta[k]);
  return FORM_SECTIONS
    .filter((s) => s.key !== "tasting")  // la dégustation a sa propre mise en page (texte long)
    .map((s) => ({
      title: s.title,
      rows: s.fields
        .map((f) => {
          let v = get(f.key);
          if (f.type === "tri") v = v === true ? tr("Ja") : v === false ? tr("Nein") : "";
          if (f.type === "checkbox") v = v ? tr("Ja") : "";
          return { label: f.label.replace(" *", ""), value: v };
        })
        .filter((r) => r.value !== "" && r.value !== null && r.value !== undefined),
    }))
    .filter((s) => s.rows.length > 0);
}

// ── Fonctions pures : recherche, filtres & statistiques (commit 8) ─────────

/** Vrai si le texte libre `q` correspond à un champ identitaire de la fiche. */
function matchesQuery(w, q) {
  const needle = String(q || "").trim().toLowerCase();
  if (!needle) return true;
  const meta = w.whisky_meta || {};
  const haystack = [w.name, meta.distillery, meta.bottler, meta.brand, meta.expression, meta.region, meta.country]
    .filter((v) => v !== null && v !== undefined && v !== "")
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

/** Vrai si la fiche possède au moins un exemplaire dans le statut demandé (ou si aucun statut n'est demandé). */
function matchesStatusFilter(w, status) {
  if (!status) return true;
  return (w.slots || []).some((s) => (s.bottle_status || "sealed") === status);
}

/**
 * Filtre la liste des fiches whisky selon {q, whisky_type, status, favorite}.
 * Filtre purement côté client (les données sont déjà toutes chargées en
 * mémoire via whisky/get_data) — aucun filtre non renseigné n'exclut rien.
 */
function filterWhiskies(whiskies, filters) {
  const f = filters || {};
  return (whiskies || []).filter((w) => {
    if (f.favorite && !w.favorite) return false;
    if (f.whisky_type && ((w.whisky_meta || {}).whisky_type || "") !== f.whisky_type) return false;
    if (!matchesStatusFilter(w, f.status)) return false;
    if (!matchesQuery(w, f.q)) return false;
    return true;
  });
}

/** Répartition {clé -> nombre de bouteilles} triée par fréquence décroissante (miroir de sensor.py _breakdown). */
function breakdownJS(whiskies, keyFn) {
  const counts = {};
  for (const w of whiskies || []) {
    const key = keyFn(w);
    if (!key) continue;
    const n = (w.slots || []).length;
    counts[key] = (counts[key] || 0) + n;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

/**
 * Statistiques agrégées de la collection (ou d'un sous-ensemble filtré) —
 * mêmes définitions que les capteurs HA (sensor.py), recalculées côté carte
 * pour permettre un panneau de statistiques sans dépendre d'entités HA
 * exposées sur un tableau de bord.
 */
function computeStats(whiskies) {
  const list = whiskies || [];
  const allSlots = list.flatMap((w) => w.slots || []);
  const countByStatus = (status) => allSlots.filter((s) => (s.bottle_status || "sealed") === status).length;
  const distilleries = new Set(
    list.map((w) => ((w.whisky_meta || {}).distillery || "").trim().toLowerCase()).filter(Boolean)
  );
  let value = 0;
  for (const w of list) {
    const unit = Number(w.current_value) || Number(w.price) || 0;
    if (unit <= 0) continue;
    const n = (w.slots || []).filter((s) => (s.bottle_status || "sealed") !== "finished").length;
    value += unit * n;
  }
  const ages = [];
  for (const w of list) {
    const raw = (w.whisky_meta || {}).age;
    const age = Number(String(raw === null || raw === undefined ? "" : raw).trim().replace(",", "."));
    if (Number.isFinite(age) && age > 0) ages.push(age);
  }
  const avgAge = ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
  return {
    total: allSlots.length,
    references: list.length,
    sealed: countByStatus("sealed"),
    opened: countByStatus("opened"),
    finished: countByStatus("finished"),
    distilleries: distilleries.size,
    collectionValue: Math.round(value * 100) / 100,
    averageAge: Math.round(avgAge * 10) / 10,
    byCountry: breakdownJS(list, (w) => (w.whisky_meta || {}).country),
    byRegion: breakdownJS(list, (w) => (w.whisky_meta || {}).region),
    byDistillery: breakdownJS(list, (w) => (w.whisky_meta || {}).distillery),
    byType: breakdownJS(list, (w) => (w.whisky_meta || {}).whisky_type),
    byPeat: breakdownJS(list, (w) => {
      const p = (w.whisky_meta || {}).peated;
      return p === true ? tr("torfig") : p === false ? tr("nicht torfig") : null;
    }),
  };
}

/** Réduit une répartition [ [label, count], ... ] aux `limit` premières entrées avec un pourcentage de barre relatif au maximum affiché. */
function topBreakdown(entries, limit = 8) {
  const top = (entries || []).slice(0, limit);
  const max = top.reduce((m, [, n]) => Math.max(m, n), 0) || 1;
  return top.map(([label, count]) => ({ label, count, pct: Math.round((count / max) * 100) }));
}

// ── Composant carte ───────────────────────────────────────────────────────

class WhiskyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._data = { cellars: [], whiskies: [], tasting_log: [] };
    this._filters = { q: "", whisky_type: "", status: "", favorite: false };
    this._view = "collection"; // "collection" | "finished" (onglet "🥂 Whisky bu")
  }

  setConfig(config) {
    this._config = config || {};
    CARD_LANG = _cardResolveLang(this._hass, this._config);
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    CARD_LANG = _cardResolveLang(this._hass, this._config);
    if (first) this._init();
  }

  getCardSize() {
    return 4;
  }

  connectedCallback() {
    if (this._hass && !this._inited) this._init();
  }

  disconnectedCallback() {
    if (this._unsubUpdated) { this._unsubUpdated(); this._unsubUpdated = null; }
  }

  async _init() {
    if (this._inited) return;
    this._inited = true;
    await this._fetchData();
    try {
      this._unsubUpdated = await this._hass.connection.subscribeEvents(
        () => this._fetchData(), `${DOMAIN}_updated`
      );
    } catch (e) {
      // Abonnement optionnel : la carte reste utilisable sans rafraîchissement auto.
    }
  }

  async _fetchData() {
    try {
      this._data = await this._hass.connection.sendMessagePromise({ type: `${DOMAIN}/get_data` });
    } catch (e) {
      this._data = { cellars: [], whiskies: [], tasting_log: [] };
    }
    this._render();
  }

  // ── Rendu principal : recherche/filtres + liste des fiches ────────────────

  _render() {
    const root = this.shadowRoot;

    // Préserve le focus/la sélection d'un champ de la barre d'outils (ex. la
    // recherche) à travers le innerHTML complet ci-dessous — sans ça, chaque
    // frappe au clavier ferait perdre le focus du champ de recherche.
    const active = root.activeElement;
    const activeId = active && active.id;
    const selStart = active && typeof active.selectionStart === "number" ? active.selectionStart : null;
    const selEnd = active && typeof active.selectionEnd === "number" ? active.selectionEnd : null;

    const allWhiskies = (this._data && this._data.whiskies) || [];
    const filters = this._filters;
    const view = this._view;
    // Sur l'onglet "Whisky bu", le filtre de statut n'a pas de sens (la vue
    // ne montre que les exemplaires terminés) : on l'ignore pour ne pas
    // masquer des fiches qui possèdent un exemplaire terminé mais dont un
    // AUTRE exemplaire ne correspond pas au statut sélectionné.
    const whiskies = filterWhiskies(allWhiskies, view === "finished" ? { ...filters, status: "" } : filters);
    const total = whiskies.reduce((n, w) => n + ((w.slots && w.slots.length) || 0), 0);
    const filtered = whiskies.length !== allWhiskies.length;

    // Onglet "Whisky bu" : mélange les bouteilles terminées de la collection
    // ET les dégustations hors collection (tasting_log), avec les mêmes
    // filtres texte/type que la collection (le filtre "Coups de cœur" ne
    // s'applique qu'aux bouteilles réellement possédées, donc masque les
    // dégustations hors collection quand il est actif).
    const allTastings = (this._data && this._data.tasting_log) || [];
    const tastingMatches = (t) => {
      if (filters.favorite) return false;
      if (filters.whisky_type && (t.whisky_type || "") !== filters.whisky_type) return false;
      const needle = String(filters.q || "").trim().toLowerCase();
      if (!needle) return true;
      const haystack = [t.name, t.distillery, t.region, t.country, t.place].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(needle);
    };
    const tastings = view === "finished" ? allTastings.filter(tastingMatches) : [];
    const merged = view === "finished" ? mergedTastingEntries(whiskies, tastings) : [];
    const finishedCount = merged.filter((m) => m.kind === "finished").length;

    const hint = view === "finished"
      ? `${merged.length} ${tr("Whisky(s) getrunken")}${merged.length ? ` (${finishedCount} ${tr("aus der Sammlung,")} ${tastings.length} ${tr("außerhalb)")}` : ""}`
      : filtered
        ? `${whiskies.length} ${tr("von")} ${allWhiskies.length} ${tr("Einträgen angezeigt (")}${total} ${tr("Flaschen)")}`
        : `${whiskies.length} ${tr("Einträge,")} ${total} ${tr("Flaschen")}`;

    const body = view === "finished"
      ? (merged.length
          ? `<div class="wc-fin-list">${merged.map((m) => (m.kind === "finished" ? finishedRowHTML(m.entry) : tastingRowHTML(m.entry))).join("")}</div>`
          : `<div class="wc-empty">${tr("Noch keine getrunkenen Whiskys — markiere eine Flasche als leer oder füge eine Verkostung außerhalb der Sammlung hinzu.")}</div>`)
      : (allWhiskies.length === 0
          ? `<div class="wc-empty">${tr("Noch kein Whisky vorhanden — klicke auf ➕ Hinzufügen, um deine Sammlung zu starten.")}</div>`
          : whiskies.length
            ? `<div class="wc-grid-tiles">${whiskies.map((w) => tileHTML(w)).join("")}</div>`
            : `<div class="wc-empty">${tr("Keine Einträge entsprechen diesen Filtern.")}</div>`);

    const typeOptions = WHISKY_TYPE_VALUES.map((t) =>
      `<option value="${t}" ${filters.whisky_type === t ? "selected" : ""}>${t}</option>`).join("");
    const statusOptions = STATUS_ORDER.map((s) =>
      `<option value="${s}" ${filters.status === s ? "selected" : ""}>${BOTTLE_STATUS_LABELS[s]}</option>`).join("");

    root.innerHTML = `
      <style>${CARD_CSS}</style>
      <div class="wc-card">
        <div class="wc-header">
          <div class="wc-title">${tr("🥃 WhiskyDB — Sammlung")}</div>
          <div class="wc-header-actions">
            <button class="wc-btn" id="wc-stats-btn">${tr("📊 Statistiken")}</button>
            ${view === "finished" ? `<button class="wc-btn" id="wc-add-tasting">${tr("🥂 Verkostung hinzufügen")}</button>` : ""}
            <button class="wc-btn wc-btn-primary" id="wc-add">${tr("➕ Hinzufügen")}</button>
          </div>
        </div>
        <div class="wc-tabs">
          <button type="button" class="wc-tab ${view === "collection" ? "wc-tab-active" : ""}" id="wc-tab-collection">${tr("🥃 Sammlung")}</button>
          <button type="button" class="wc-tab ${view === "finished" ? "wc-tab-active" : ""}" id="wc-tab-finished">${tr("🥂 Getrunkene")}</button>
        </div>
        <div class="wc-toolbar">
          <input type="search" id="wc-search" class="wc-search" placeholder="${tr("🔎 Name, Destillerie, Region…")}" value="${escapeHtml(filters.q)}" />
          <select id="wc-filter-type"><option value="">${tr("Alle Typen")}</option>${typeOptions}</select>
          ${view === "finished" ? "" : `<select id="wc-filter-status"><option value="">${tr("Alle Status")}</option>${statusOptions}</select>`}
          <label class="wc-filter-fav"><input type="checkbox" id="wc-filter-fav" ${filters.favorite ? "checked" : ""} /> ${tr("Lieblinge")}</label>
        </div>
        <div class="wc-hint">${hint}</div>
        ${body}
      </div>
    `;

    const addBtn = root.getElementById("wc-add");
    if (addBtn) addBtn.addEventListener("click", () => this._openForm(null));
    const statsBtn = root.getElementById("wc-stats-btn");
    if (statsBtn) statsBtn.addEventListener("click", () => this._openStats());
    const addTastingBtn = root.getElementById("wc-add-tasting");
    if (addTastingBtn) addTastingBtn.addEventListener("click", () => this._openTastingForm());
    const tabCollectionEl = root.getElementById("wc-tab-collection");
    if (tabCollectionEl) tabCollectionEl.addEventListener("click", () => { this._view = "collection"; this._render(); });
    const tabFinishedEl = root.getElementById("wc-tab-finished");
    if (tabFinishedEl) tabFinishedEl.addEventListener("click", () => { this._view = "finished"; this._render(); });
    root.querySelectorAll("[data-whisky-id]").forEach((el) => {
      el.addEventListener("click", () => {
        const w = whiskies.find((x) => x.id === el.dataset.whiskyId);
        if (w) this._openDetail(w);
      });
    });
    root.querySelectorAll(".wc-tasting-remove").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm(tr("Diese Verkostung löschen?"))) return;
        try {
          await this._hass.callService(DOMAIN, "remove_tasting", { tasting_id: btn.dataset.tastingId });
        } catch (err) {
          alert(`${tr("Fehler:")} ${(err && err.message) || err}`);
        }
      });
    });

    const searchEl = root.getElementById("wc-search");
    if (searchEl) searchEl.addEventListener("input", (e) => { this._filters.q = e.target.value; this._render(); });
    const typeEl = root.getElementById("wc-filter-type");
    if (typeEl) typeEl.addEventListener("change", (e) => { this._filters.whisky_type = e.target.value; this._render(); });
    const statusEl = root.getElementById("wc-filter-status");
    if (statusEl) statusEl.addEventListener("change", (e) => { this._filters.status = e.target.value; this._render(); });
    const favEl = root.getElementById("wc-filter-fav");
    if (favEl) favEl.addEventListener("change", (e) => { this._filters.favorite = e.target.checked; this._render(); });

    if (activeId) {
      const el = root.getElementById(activeId);
      if (el) {
        el.focus();
        if (selStart !== null && el.setSelectionRange) {
          try { el.setSelectionRange(selStart, selEnd); } catch (e) { /* type d'input sans sélection (ex. number) */ }
        }
      }
    }
  }

  // ── Statistiques (commit 8) ────────────────────────────────────────────────

  _openStats() {
    const box = this._openModal(this._statsHTML());
    const closeBtn = box.querySelector("#wc-stats-close");
    if (closeBtn) closeBtn.addEventListener("click", () => this._closeModal());
  }

  _statsHTML() {
    const allWhiskies = (this._data && this._data.whiskies) || [];
    const s = computeStats(allWhiskies);
    const barsBlock = (title, entries) => {
      const top = topBreakdown(entries, 8);
      if (!top.length) return "";
      return `
        <fieldset class="wc-section">
          <legend>${escapeHtml(title)}</legend>
          ${top.map((e) => `
            <div class="wc-stat-bar-row">
              <span class="wc-stat-bar-label">${escapeHtml(e.label)}</span>
              <span class="wc-stat-bar-track"><span class="wc-stat-bar-fill" style="width:${e.pct}%"></span></span>
              <span class="wc-stat-bar-count">${e.count}</span>
            </div>`).join("")}
        </fieldset>`;
    };
    return `
      <h2 class="wc-modal-title">${tr("📊 Sammlungs-Statistiken")}</h2>
      <div class="wc-stat-grid">
        <div class="wc-stat-tile"><div class="wc-stat-num">${s.total}</div><div class="wc-stat-label">${tr("Flaschen")}</div></div>
        <div class="wc-stat-tile"><div class="wc-stat-num">${s.references}</div><div class="wc-stat-label">${tr("Einträge")}</div></div>
        <div class="wc-stat-tile"><div class="wc-stat-num">${s.sealed}</div><div class="wc-stat-label">${tr("Versiegelt")}</div></div>
        <div class="wc-stat-tile"><div class="wc-stat-num">${s.opened}</div><div class="wc-stat-label">${tr("Geöffnet")}</div></div>
        <div class="wc-stat-tile"><div class="wc-stat-num">${s.finished}</div><div class="wc-stat-label">${tr("Leer")}</div></div>
        <div class="wc-stat-tile"><div class="wc-stat-num">${s.distilleries}</div><div class="wc-stat-label">${tr("Destillerien")}</div></div>
        <div class="wc-stat-tile"><div class="wc-stat-num">${s.collectionValue} €</div><div class="wc-stat-label">${tr("Wert (aktueller Bestand)")}</div></div>
        <div class="wc-stat-tile"><div class="wc-stat-num">${s.averageAge || "—"}</div><div class="wc-stat-label">${tr("Durchschnittsalter (Jahre)")}</div></div>
      </div>
      ${barsBlock(tr("Nach Land"), s.byCountry)}
      ${barsBlock(tr("Nach Region"), s.byRegion)}
      ${barsBlock(tr("Nach Destillerie"), s.byDistillery)}
      ${barsBlock(tr("Nach Typ"), s.byType)}
      ${barsBlock(tr("Torfigkeit"), s.byPeat)}
      <div class="wc-actions"><button type="button" class="wc-btn" id="wc-stats-close">${tr("Schließen")}</button></div>
    `;
  }

  // ── Modale (hors shadow root, comme Millésime — un formulaire doit rester
  //    utilisable même si la carte est petite/en colonne latérale) ──────────

  _openModal(html) {
    this._closeModal();
    const overlay = document.createElement("div");
    overlay.className = "wc-overlay";
    overlay.innerHTML = `<style>${MODAL_CSS}</style><div class="wc-modal-box">${html}</div>`;
    overlay.addEventListener("click", (e) => { if (e.target === overlay) this._closeModal(); });
    document.body.appendChild(overlay);
    this._overlay = overlay;
    return overlay.querySelector(".wc-modal-box");
  }

  _closeModal() {
    if (this._overlay) { this._overlay.remove(); this._overlay = null; }
  }

  // ── Fiche détail ───────────────────────────────────────────────────────────

  _openDetail(w) {
    const box = this._openModal(this._detailHTML(w));
    this._bindDetail(box, w);
  }

  _detailHTML(w) {
    const meta = w.whisky_meta || {};
    const sections = detailRows(w);
    const img = w.image_url
      ? `<img class="wc-detail-img" src="${escapeHtml(w.image_url)}" alt="" />`
      : "";
    const slotsHTML = (w.slots || []).map((s, idx) => {
      const place = s.rack_id
        ? `${tr("Regal")} ${escapeHtml(s.rack_id)} · ${tr("Platz")} ${Number(s.slot) + 1}`
        : tr("Nicht einsortiert");
      const status = s.bottle_status || "sealed";
      const extra = [];
      if (status === "opened" && s.opened_date) extra.push(`${tr("geöffnet am")} ${escapeHtml(s.opened_date)}`);
      if (status === "opened") extra.push(`${s.remaining_percent != null ? s.remaining_percent : 100}${tr("% verbleibend")}`);
      if (status === "finished" && s.finished_date) extra.push(`${tr("leer seit")} ${escapeHtml(s.finished_date)}`);
      if (s.comment) extra.push(escapeHtml(s.comment));
      const actions = [];
      if (status === "sealed") actions.push(`<button type="button" class="wc-btn wc-slot-open" data-idx="${idx}">${tr("Öffnen")}</button>`);
      if (status === "opened") actions.push(`<button type="button" class="wc-btn wc-slot-finish" data-idx="${idx}">${tr("Als leer markieren")}</button>`);
      actions.push(`<button type="button" class="wc-btn wc-slot-remove" data-idx="${idx}">${tr("Entfernen")}</button>`);
      // Suivi manuel du niveau restant (commit 9 : svc_update_remaining) —
      // uniquement pour un exemplaire ouvert, déclenche whisky_bottle_low
      // côté backend au franchissement du seuil bas.
      const remainingRow = status === "opened" ? `
        <div class="wc-slot-remaining-row">
          <label class="wc-slot-remaining-label">${tr("Füllstand")}
            <input type="number" min="0" max="100" step="5" class="wc-slot-remaining-input"
              data-idx="${idx}" value="${s.remaining_percent != null ? s.remaining_percent : 100}" />%
          </label>
          <button type="button" class="wc-btn wc-slot-remaining-save" data-idx="${idx}">${tr("Aktualisieren")}</button>
        </div>` : "";
      return `
        <div class="wc-slot">
          <div class="wc-slot-row">
            <span class="wc-slot-dot">${STATUS_DOT[status] || "●"}</span>
            <span class="wc-slot-place">${place}</span>
            <span class="wc-slot-status">${escapeHtml(BOTTLE_STATUS_LABELS[status] || status)}${extra.length ? " · " + extra.join(" · ") : ""}</span>
            <span class="wc-slot-actions">${actions.join("")}</span>
          </div>
          ${remainingRow}
        </div>`;
    }).join("") || `<div class="wc-slot wc-slot-empty">${tr("Kein Exemplar.")}</div>`;

    const tastingFields = [
      [tr("Allgemeine Notizen"), meta.tasting_notes], [tr("Nase"), meta.nose_notes],
      [tr("Gaumen"), meta.palate_notes], [tr("Abgang"), meta.finish_notes],
    ].filter(([, v]) => v);
    const tastingHTML = tastingFields.length
      ? `<fieldset class="wc-section"><legend>${tr("👃 Verkostung")}</legend>
          ${tastingFields.map(([l, v]) => `<div class="wc-detail-row"><span class="wc-detail-label">${l}</span><span class="wc-detail-value">${escapeHtml(v)}</span></div>`).join("")}
        </fieldset>`
      : "";

    const sectionsHTML = sections.map((s) => `
      <fieldset class="wc-section">
        <legend>${s.title}</legend>
        ${s.rows.map((r) => `<div class="wc-detail-row"><span class="wc-detail-label">${escapeHtml(r.label)}</span><span class="wc-detail-value">${escapeHtml(r.value)}</span></div>`).join("")}
      </fieldset>
    `).join("");

    return `
      <div class="wc-detail-header">
        <h2 class="wc-modal-title">${w.favorite ? "★ " : ""}${escapeHtml(w.name)}</h2>
        <div class="wc-detail-actions">
          <button type="button" class="wc-btn" id="wc-detail-edit">${tr("✏️ Bearbeiten")}</button>
          <button type="button" class="wc-btn" id="wc-detail-delete">${tr("🗑️ Löschen")}</button>
        </div>
      </div>
      ${img}
      <div class="wc-slot-summary">${escapeHtml(statusSummary(w.slots))}</div>
      <div class="wc-slots">${slotsHTML}</div>
      <button type="button" class="wc-btn" id="wc-detail-add-slot">${tr("➕ Exemplar hinzufügen")}</button>
      ${sectionsHTML}
      ${tastingHTML}
    `;
  }

  _bindDetail(box, w) {
    const refresh = async () => {
      await this._fetchData();
      const updated = (this._data.whiskies || []).find((x) => x.id === w.id);
      if (!updated) { this._closeModal(); return; }
      box.innerHTML = this._detailHTML(updated);
      this._bindDetail(box, updated);
    };
    box.querySelector("#wc-detail-edit").addEventListener("click", () => {
      this._closeModal();
      this._openForm(w);
    });
    box.querySelector("#wc-detail-delete").addEventListener("click", async () => {
      if (!confirm(`${w.name} ${tr("endgültig löschen — inklusive aller Exemplare?")}`)) return;
      try {
        await this._hass.callService(DOMAIN, "remove_whisky", { whisky_id: w.id });
        this._closeModal();
      } catch (err) {
        this._toast(box, `${tr("Fehler:")} ${(err && err.message) || err}`);
      }
    });
    box.querySelector("#wc-detail-add-slot").addEventListener("click", async () => {
      try {
        await this._hass.callService(DOMAIN, "add_slot", { whisky_id: w.id });
        await refresh();
      } catch (err) {
        this._toast(box, `${tr("Fehler:")} ${(err && err.message) || err}`);
      }
    });
    box.querySelectorAll(".wc-slot-open").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await this._hass.callService(DOMAIN, "open_bottle", { whisky_id: w.id, slot_idx: Number(btn.dataset.idx) });
          await refresh();
        } catch (err) {
          this._toast(box, `${tr("Fehler:")} ${(err && err.message) || err}`);
        }
      });
    });
    box.querySelectorAll(".wc-slot-finish").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await this._hass.callService(DOMAIN, "finish_bottle", { whisky_id: w.id, slot_idx: Number(btn.dataset.idx) });
          await refresh();
        } catch (err) {
          this._toast(box, `${tr("Fehler:")} ${(err && err.message) || err}`);
        }
      });
    });
    box.querySelectorAll(".wc-slot-remaining-save").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const idx = Number(btn.dataset.idx);
        const input = box.querySelector(`.wc-slot-remaining-input[data-idx="${idx}"]`);
        const pct = input ? Number(input.value) : NaN;
        if (!Number.isFinite(pct)) { this._toast(box, tr("Ungültiger Füllstand (0 bis 100).")); return; }
        try {
          await this._hass.callService(DOMAIN, "update_remaining", { whisky_id: w.id, slot_idx: idx, remaining_percent: pct });
          await refresh();
        } catch (err) {
          this._toast(box, `${tr("Fehler:")} ${(err && err.message) || err}`);
        }
      });
    });
    box.querySelectorAll(".wc-slot-remove").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm(tr("Dieses Exemplar entfernen?"))) return;
        try {
          await this._hass.callService(DOMAIN, "remove_slot", { whisky_id: w.id, slot_idx: Number(btn.dataset.idx) });
          await refresh();
        } catch (err) {
          this._toast(box, `${tr("Fehler:")} ${(err && err.message) || err}`);
        }
      });
    });
  }

  // ── Formulaire d'ajout / édition ─────────────────────────────────────────

  _openForm(existing) {
    const box = this._openModal(this._formHTML(existing));
    this._bindForm(box, existing);
  }

  _formHTML(existing) {
    const meta = (existing && existing.whisky_meta) || {};
    const val = (key) => {
      if (existing) {
        if (key in existing) return existing[key];
        if (key in meta) return meta[key];
      }
      return "";
    };
    const sections = existing ? FORM_SECTIONS : [...FORM_SECTIONS];
    const extra = existing ? [] : [CREATE_ONLY_SECTION];
    const renderField = (f) => {
      const current = val(f.key);
      const id = `wc-f-${f.key}`;
      if (f.type === "select") {
        const labels = f.optionLabels || {};
        const opts = f.options.map((o) =>
          `<option value="${o}" ${String(current) === o ? "selected" : ""}>${labels[o] || o}</option>`
        ).join("");
        return `<label class="wc-field"><span>${f.label}</span>
          <select id="${id}" data-key="${f.key}"><option value="">—</option>${opts}</select></label>`;
      }
      if (f.type === "tri") {
        const cur = triStateFromValue(current);
        return `<label class="wc-field"><span>${f.label}</span>
          <select id="${id}" data-key="${f.key}">
            <option value="" ${cur === "" ? "selected" : ""}>${tr("Nicht angegeben")}</option>
            <option value="true" ${cur === "true" ? "selected" : ""}>${tr("Ja")}</option>
            <option value="false" ${cur === "false" ? "selected" : ""}>${tr("Nein")}</option>
          </select></label>`;
      }
      if (f.type === "textarea") {
        return `<label class="wc-field wc-field-wide"><span>${f.label}</span>
          <textarea id="${id}" data-key="${f.key}" rows="2">${current || ""}</textarea></label>`;
      }
      if (f.type === "checkbox") {
        return `<label class="wc-field wc-field-checkbox">
          <input type="checkbox" id="${id}" data-key="${f.key}" ${current ? "checked" : ""} />
          <span>${f.label}</span></label>`;
      }
      const listAttr = f.list ? `list="${f.list}"` : "";
      return `<label class="wc-field"><span>${f.label}</span>
        <input type="${f.type}" id="${id}" data-key="${f.key}" ${listAttr}
          step="${f.step || ""}" min="${f.min || ""}" max="${f.max || ""}"
          placeholder="${f.placeholder || ""}" value="${current === 0 ? 0 : (current || "")}" /></label>`;
    };
    const sectionsHTML = [...sections, ...extra].map((s) => `
      <fieldset class="wc-section">
        <legend>${s.title}</legend>
        <div class="wc-grid">${s.fields.map(renderField).join("")}</div>
      </fieldset>
    `).join("");

    return `
      <h2 class="wc-modal-title">${existing ? tr("Whisky bearbeiten") : tr("Whisky hinzufügen")}</h2>
      <div class="wc-photo-row">
        <button type="button" class="wc-btn" id="wc-photo-cam">${tr("📷 Foto aufnehmen")}</button>
        <button type="button" class="wc-btn" id="wc-photo-lib">${tr("🖼️ Galerie")}</button>
        <span class="wc-photo-hint">${tr("Analysiert das Etikett per KI — prüfe die Ergebnisse, bevor du speicherst.")}</span>
        <!-- Deux inputs statiques distincts : l'attribut capture doit être présent dès la
             création (comme dans millesime-card.js) pour que l'appareil photo direct
             fonctionne de façon fiable sur Android — un seul input avec capture="environment"
             se rabat silencieusement sur la galerie sur certaines WebView. -->
        <input type="file" id="wc-photo-input" accept="image/*" hidden />
        <input type="file" id="wc-photo-input-cam" accept="image/*" capture="environment" hidden />
      </div>
      <div id="wc-recognition-panel"></div>
      <datalist id="whisky-cask-types">${CASK_TYPE_SUGGESTIONS.map((c) => `<option value="${c}">`).join("")}</datalist>
      <form id="wc-form">
        ${sectionsHTML}
        <div class="wc-actions">
          <button type="button" class="wc-btn" id="wc-cancel">${tr("Abbrechen")}</button>
          <button type="submit" class="wc-btn wc-btn-primary">${existing ? tr("Speichern") : tr("Zur Sammlung hinzufügen")}</button>
        </div>
      </form>
    `;
  }

  _bindForm(box, existing) {
    box.querySelector("#wc-cancel").addEventListener("click", () => this._closeModal());

    const fileInput = box.querySelector("#wc-photo-input");
    const fileInputCam = box.querySelector("#wc-photo-input-cam");
    box.querySelector("#wc-photo-cam").addEventListener("click", async () => {
      // Appareil photo direct tenté en premier via getUserMedia (fiable sur
      // Android, contrairement au seul attribut capture) ; repli sur l'input
      // statique avec capture si getUserMedia est indisponible/refusé.
      const shot = await this._captureViaCamera(box);
      if (shot instanceof File) { this._onScanFile(box, shot); return; }
      if (shot === "cancel") return;
      fileInputCam.click();
    });
    box.querySelector("#wc-photo-lib").addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => this._onScanFile(box, e.target));
    fileInputCam.addEventListener("change", (e) => this._onScanFile(box, e.target));

    box.querySelector("#wc-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const raw = {};
      box.querySelectorAll("[data-key]").forEach((el) => {
        raw[el.dataset.key] = el.type === "checkbox" ? el.checked : el.value;
      });
      if (!raw.name || !String(raw.name).trim()) {
        this._toast(box, tr("Der Name des Whiskys ist erforderlich."));
        return;
      }
      const payload = buildWhiskyPayload(raw);
      try {
        if (existing) {
          await this._hass.callService(DOMAIN, "update_whisky", { whisky_id: existing.id, ...payload });
        } else {
          await this._hass.callService(DOMAIN, "add_whisky", payload);
        }
        this._closeModal();
      } catch (err) {
        this._toast(box, `${tr("Fehler:")} ${(err && err.message) || err}`);
      }
    });
  }

  // ── Dégustation hors collection (onglet "🥂 Whisky bu") ───────────────────
  // Formulaire volontairement plus léger que _formHTML : un whisky simplement
  // goûté (bar, chez un ami, dégustation) n'a ni bouteille ni emplacement —
  // svc_add_tasting alimente tasting_log, jamais whiskies[].

  _openTastingForm() {
    const box = this._openModal(this._tastingFormHTML());
    this._bindTastingForm(box);
  }

  _tastingFormHTML() {
    const today = new Date().toISOString().slice(0, 10);
    const typeOptions = WHISKY_TYPE_VALUES.map((t) => `<option value="${t}">${t}</option>`).join("");
    return `
      <h2 class="wc-modal-title">${tr("🥂 Verkostung hinzufügen")}</h2>
      <p class="wc-photo-hint">${tr("Für einen nur verkosteten Whisky (Bar, bei Freunden, Tasting) — ohne ihn in die Sammlung aufzunehmen.")}</p>
      <form id="wc-tasting-form">
        <fieldset class="wc-section">
          <legend>${tr("Verkostung")}</legend>
          <div class="wc-grid">
            <label class="wc-field"><span>${tr("Name *")}</span>
              <input type="text" id="wc-t-name" required placeholder="${tr("z. B. Talisker 18 Years Old")}" /></label>
            <label class="wc-field"><span>${tr("Destillerie")}</span>
              <input type="text" id="wc-t-distillery" /></label>
            <label class="wc-field"><span>${tr("Typ")}</span>
              <select id="wc-t-type"><option value="">—</option>${typeOptions}</select></label>
            <label class="wc-field"><span>${tr("Region")}</span>
              <input type="text" id="wc-t-region" /></label>
            <label class="wc-field"><span>${tr("Land")}</span>
              <input type="text" id="wc-t-country" /></label>
            <label class="wc-field"><span>${tr("Ort der Verkostung")}</span>
              <input type="text" id="wc-t-place" placeholder="${tr("z. B. Bar Le Malt")}" /></label>
            <label class="wc-field"><span>${tr("Datum")}</span>
              <input type="date" id="wc-t-date" value="${today}" /></label>
            <label class="wc-field"><span>${tr("Bewertung (/5)")}</span>
              <input type="number" id="wc-t-rating" step="0.5" min="0" max="5" /></label>
            <label class="wc-field wc-field-wide"><span>${tr("Kommentar")}</span>
              <textarea id="wc-t-comment" rows="2"></textarea></label>
          </div>
        </fieldset>
        <div class="wc-actions">
          <button type="button" class="wc-btn" id="wc-t-cancel">${tr("Abbrechen")}</button>
          <button type="submit" class="wc-btn wc-btn-primary">${tr("Hinzufügen")}</button>
        </div>
      </form>
    `;
  }

  _bindTastingForm(box) {
    box.querySelector("#wc-t-cancel").addEventListener("click", () => this._closeModal());
    box.querySelector("#wc-tasting-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = box.querySelector("#wc-t-name").value.trim();
      if (!name) { this._toast(box, tr("Der Name des Whiskys ist erforderlich.")); return; }
      const payload = { name };
      const distillery = box.querySelector("#wc-t-distillery").value.trim();
      if (distillery) payload.distillery = distillery;
      const whiskyType = box.querySelector("#wc-t-type").value;
      if (whiskyType) payload.whisky_type = whiskyType;
      const region = box.querySelector("#wc-t-region").value.trim();
      if (region) payload.region = region;
      const country = box.querySelector("#wc-t-country").value.trim();
      if (country) payload.country = country;
      const place = box.querySelector("#wc-t-place").value.trim();
      if (place) payload.place = place;
      const date = box.querySelector("#wc-t-date").value;
      if (date) payload.tasted_date = date;
      const ratingRaw = box.querySelector("#wc-t-rating").value;
      if (ratingRaw !== "") payload.rating = Number(ratingRaw);
      const comment = box.querySelector("#wc-t-comment").value.trim();
      if (comment) payload.comment = comment;
      try {
        await this._hass.callService(DOMAIN, "add_tasting", payload);
        this._closeModal();
      } catch (err) {
        this._toast(box, `${tr("Fehler:")} ${(err && err.message) || err}`);
      }
    });
  }

  _toast(box, message) {
    let t = box.querySelector(".wc-toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "wc-toast";
      box.prepend(t);
    }
    t.textContent = message;
  }

  // ── Reconnaissance photo ──────────────────────────────────────────────────

  // Accepte soit un <input type=file> (parcours galerie / input statique
  // avec capture), soit directement un File (photo issue du modal caméra
  // getUserMedia — voir _captureViaCamera).
  _onScanFile(box, inputOrFile) {
    const file = inputOrFile instanceof File ? inputOrFile : (inputOrFile.files && inputOrFile.files[0]);
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => this._toast(box, tr("Foto konnte nicht gelesen werden."));
    reader.onload = async () => {
      const dataUrl = String(reader.result || "");
      const b64 = dataUrl.split(",")[1] || "";
      const mime = file.type || "image/jpeg";
      if (!b64) { this._toast(box, tr("Foto leer oder unlesbar.")); return; }
      this._showRecognitionLoading(box);
      try {
        const resp = await this._hass.connection.sendMessagePromise({
          type: `${DOMAIN}/analyze_photo`, image_b64: b64, mime_type: mime, language: (this._hass.locale && this._hass.locale.language) || this._hass.selectedLanguage || "de",
        });
        this._showRecognitionResult(box, resp);
      } catch (err) {
        this._showRecognitionError(box, "service_unavailable");
      }
    };
    reader.readAsDataURL(file);
    if (!(inputOrFile instanceof File)) inputOrFile.value = "";
  }

  // ── Repli caméra via getUserMedia (Android) ─────────────────────────────
  // Sur certains appareils Android, la WebView ouvre la galerie même avec un
  // input statique portant l'attribut capture. getUserMedia est donc tenté
  // en premier — c'est le seul chemin qui garantit l'ouverture de l'appareil
  // photo. L'API n'existe qu'en contexte sécurisé (HTTPS / app compagnon en
  // URL externe / localhost) : en HTTP local, on prévient explicitement
  // l'utilisateur avant le repli galerie. (Porté de millesime-card.js,
  // même correctif que l'issue #7 de Millésime.)
  _cameraSupported() {
    return !!navigator.mediaDevices?.getUserMedia;
  }

  _cameraFallbackNotice(box, reason) {
    if (reason === "insecure") {
      this._toast(box,
        tr("Foto aus der Galerie: Der direkte Kamerazugriff ist nur über sichere ") +
        tr("Verbindungen (https) möglich. Das ist kein Fehler von WhiskyDB — ") +
        tr("nimm das Foto mit deiner Kamera-App auf und wähle es dann in der Galerie, ") +
        tr("oder verbinde dich über https (externe URL / Nabu Casa) für die Direktaufnahme."));
    } else if (reason === "denied") {
      this._toast(box,
        tr("Kamerazugriff verweigert — prüfe die Berechtigungen der Home-Assistant-App ") +
        tr("(Einstellungen → Apps → Home Assistant → Berechtigungen → Kamera). ") +
        tr("Bis dahin funktioniert der Weg über die Galerie."));
    }
  }

  // Résout avec : File (photo capturée) | "cancel" (fermé par l'utilisateur)
  // | null (échec technique → l'appelant retombe sur l'input statique).
  async _captureViaCamera(box) {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      this._cameraFallbackNotice(box, "insecure");
      return null;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
    } catch (err) {
      console.warn(tr("[WhiskyDB] getUserMedia nicht verfügbar:"), err);
      this._cameraFallbackNotice(box,
        (err && (err.name === "NotAllowedError" || err.name === "SecurityError")) ? "denied" : "insecure");
      return null;
    }
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.style.cssText = "position:fixed;inset:0;z-index:100000;background:#000;display:flex;flex-direction:column;";
      const video = document.createElement("video");
      video.autoplay = true; video.playsInline = true; video.muted = true;
      video.style.cssText = "flex:1;min-height:0;width:100%;object-fit:contain;background:#000;";
      video.srcObject = stream;
      const bar = document.createElement("div");
      bar.style.cssText = "display:flex;gap:14px;justify-content:center;align-items:center;background:#111;" +
        "padding:16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px);";
      const mkBtn = (txt, primary) => {
        const b = document.createElement("button");
        b.type = "button"; b.textContent = txt;
        b.style.cssText = "border:none;border-radius:999px;padding:14px 26px;font-size:1em;cursor:pointer;" +
          (primary ? "background:linear-gradient(135deg,#d97706,#92400e);color:#fff;font-weight:600;" : "background:#333;color:#ddd;");
        return b;
      };
      const btnShot = mkBtn(tr("📷 Aufnehmen"), true);
      const btnCancel = mkBtn(tr("Abbrechen"), false);
      const done = (result) => {
        try { stream.getTracks().forEach((t) => t.stop()); } catch (err) { /* déjà arrêté */ }
        overlay.remove();
        resolve(result);
      };
      btnShot.addEventListener("click", () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          done(blob ? new File([blob], "capture.jpg", { type: "image/jpeg" }) : null);
        }, "image/jpeg", 0.92);
      });
      btnCancel.addEventListener("click", () => done("cancel"));
      bar.appendChild(btnCancel);
      bar.appendChild(btnShot);
      overlay.appendChild(video);
      overlay.appendChild(bar);
      document.body.appendChild(overlay);
    });
  }

  _showRecognitionLoading(box) {
    box.querySelector("#wc-recognition-panel").innerHTML =
      `<div class="wc-recog-panel wc-recog-loading">${tr("🔎 Foto wird analysiert…")}</div>`;
  }

  _showRecognitionError(box, code) {
    const msg = ERROR_MESSAGES[code] || tr("Unbekannter Fehler.");
    box.querySelector("#wc-recognition-panel").innerHTML =
      `<div class="wc-recog-panel wc-recog-error">⚠️ ${msg}</div>`;
  }

  _showRecognitionResult(box, resp) {
    const panel = box.querySelector("#wc-recognition-panel");
    if (resp.error) { this._showRecognitionError(box, resp.error); return; }
    if (!resp.result) {
      panel.innerHTML = `<div class="wc-recog-panel wc-recog-empty">${tr("Auf dem Foto wurden keine verwertbaren Informationen erkannt — bitte von Hand ergänzen.")}</div>`;
      return;
    }
    // Les champs du VRAI formulaire (data-key) vivent dans <form id="wc-form">,
    // un frère du panneau de reconnaissance — jamais à l'intérieur. On y
    // scope systématiquement les lookups [data-key] ci-dessous : sans ça,
    // box.querySelector('[data-key=...]') matche EN PREMIER la case à cocher
    // du panneau (qui porte elle aussi data-key, et précède le formulaire
    // dans le DOM), et écrit silencieusement la valeur sur cette case au
    // lieu du champ visible — c'est ce qui rendait l'application (auto ou
    // via le bouton) totalement invisible à l'écran.
    const formEl = box.querySelector("#wc-form");
    const result = resp.result;
    const fields = recognitionFieldList(result);
    const globalConf = confidenceTier(result.confidence_score);
    const rows = fields.map((f) => {
      const tier = confidenceTier(f.confidence);
      const currentEl = formEl && formEl.querySelector(`[data-key="${f.key}"]`);
      const alreadyFilled = currentEl && (currentEl.type === "checkbox" ? currentEl.checked : String(currentEl.value || "").trim() !== "");
      return `
        <label class="wc-recog-row">
          <input type="checkbox" class="wc-recog-check" data-key="${f.key}" data-value="${String(f.value).replace(/"/g, "&quot;")}" ${alreadyFilled ? "" : "checked"} />
          <span class="wc-recog-field">${f.key}</span>
          <span class="wc-recog-value">${f.value}</span>
          <span class="wc-conf-badge ${tier.cls}">${tier.label}</span>
        </label>`;
    }).join("");
    panel.innerHTML = `
      <div class="wc-recog-panel">
        <div class="wc-recog-title">${tr("Ergebnisse der Erkennung")}
          <span class="wc-conf-badge ${globalConf.cls}">${tr("Gesamtkonfidenz:")} ${globalConf.label}</span>
        </div>
        <p class="wc-recog-note">${tr("Felder werden automatisch in das Formular unten übernommen (außer bereits manuell ausgefüllte) — Häkchen anpassen, dann „Übernehmen“. Nichts wird gespeichert, bevor du das Formular abschickst.")}</p>
        <div class="wc-recog-rows">${rows || tr("<em>Keine verwertbaren Felder.</em>")}</div>
        ${fields.length ? `<button type="button" class="wc-btn wc-btn-primary" id="wc-recog-apply">${tr("Ausgewählte Felder übernehmen")}</button>` : ""}
      </div>
    `;
    // Applique dans le formulaire les champs actuellement cochés dans le
    // panneau (clé → valeur du résultat Gemini). Utilisé une première fois
    // automatiquement ci-dessous (dès que le résultat arrive, sans action de
    // l'utilisateur), puis à nouveau à chaque clic sur « Appliquer » si la
    // sélection de cases a changé entre-temps.
    const applySelected = (silent) => {
      const selected = [...panel.querySelectorAll(".wc-recog-check:checked")].map((c) => c.dataset.key);
      for (const key of selected) {
        const el = formEl && formEl.querySelector(`[data-key="${key}"]`);
        if (!el) continue;
        const value = result[key];
        if (TRI_FIELDS.has(key)) el.value = triStateFromValue(value);
        else el.value = value;
      }
      if (!silent) this._toast(box, `${selected.length} ${tr("Feld(er) übernommen — bitte prüfen und speichern.")}`);
      return selected.length;
    };
    // Application automatique immédiate (fix : jusqu'ici rien n'était copié
    // dans le formulaire tant que l'utilisateur ne cliquait pas explicitement
    // sur « Appliquer », ce qui donnait l'impression que la reconnaissance ne
    // servait à rien).
    const appliedCount = applySelected(true);
    if (appliedCount > 0) {
      this._toast(box, `${appliedCount} ${tr("Feld(er) erkannt und automatisch übernommen — bitte prüfen und speichern.")}`);
    }
    const applyBtn = panel.querySelector("#wc-recog-apply");
    if (applyBtn) {
      applyBtn.addEventListener("click", () => applySelected(false));
    }
  }
}

const CARD_CSS = `
  :host { display: block; }
  .wc-card {
    position: relative;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color, #000);
    border-radius: var(--ha-card-border-radius, 12px);
    padding: 16px;
    padding-top: 20px;
    font-family: var(--paper-font-body1_-_font-family, sans-serif);
    container-type: inline-size;
    overflow: hidden;
  }
  .wc-card::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0; height: 4px;
    background: linear-gradient(90deg, #f2b84b, #d97706 45%, #92400e);
  }
  .wc-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
  .wc-header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .wc-title { font-size: 1.15em; font-weight: 700; letter-spacing: .01em; }
  .wc-tabs { display: flex; gap: 4px; margin-top: 12px; border-bottom: 1px solid var(--divider-color, #ddd); }
  .wc-tab {
    border: none; background: none; color: var(--primary-text-color, #000); opacity: .65; cursor: pointer;
    padding: 8px 4px; font-size: .95em; font-weight: 600; border-bottom: 2px solid transparent; margin-bottom: -1px;
    transition: opacity .15s ease, border-color .15s ease;
  }
  .wc-tab:hover { opacity: .9; }
  .wc-tab-active { opacity: 1; border-bottom-color: #d97706; color: #b45309; }
  .wc-hint { opacity: .75; font-size: .9em; margin-top: 8px; }
  .wc-btn {
    border: 1px solid var(--divider-color, #ccc); background: var(--secondary-background-color, #f2f2f2);
    color: var(--primary-text-color, #000); border-radius: 8px; padding: 8px 14px; cursor: pointer; font-size: .95em;
    transition: border-color .15s ease, background .15s ease;
  }
  .wc-btn:hover { border-color: #d97706; }
  .wc-btn-primary {
    background: linear-gradient(135deg, #d97706, #92400e); color: #fff; border-color: transparent;
    box-shadow: 0 1px 4px rgba(146, 64, 14, .35);
  }
  .wc-btn-primary:hover { background: linear-gradient(135deg, #f2a638, #b45309); }
  .wc-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
  .wc-toolbar .wc-search { flex: 1 1 200px; }
  .wc-toolbar input, .wc-toolbar select {
    border: 1px solid var(--divider-color, #ccc); border-radius: 8px; padding: 6px 10px; font: inherit;
    background: var(--card-background-color, #fff); color: inherit;
  }
  .wc-toolbar input:focus, .wc-toolbar select:focus { outline: none; border-color: #d97706; }
  .wc-filter-fav { display: flex; align-items: center; gap: 6px; font-size: .9em; white-space: nowrap; }
  .wc-empty { opacity: .7; padding: 24px 8px; text-align: center; font-size: .95em; }
  .wc-grid-tiles {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-top: 14px;
  }
  @container (max-width: 380px) {
    .wc-grid-tiles { grid-template-columns: 1fr; }
  }
  .wc-tile {
    display: flex; flex-direction: column; border: 1px solid var(--divider-color, #ddd); border-radius: 10px;
    overflow: hidden; cursor: pointer; background: var(--secondary-background-color, #fafafa);
    transition: box-shadow .15s ease, transform .15s ease, border-color .15s ease;
  }
  .wc-tile:hover { box-shadow: 0 3px 12px rgba(146, 64, 14, .25); transform: translateY(-1px); border-color: #d97706; }
  .wc-tile-img { width: 100%; height: 120px; object-fit: cover; display: block; background: var(--divider-color, #eee); }
  .wc-tile-img-placeholder {
    display: flex; align-items: center; justify-content: center; font-size: 2.4em;
    background: linear-gradient(135deg, #f2c675, #b45309 65%, #6b3410);
  }
  .wc-tile-body { padding: 8px 10px 10px; display: flex; flex-direction: column; gap: 2px; }
  .wc-tile-name { font-weight: 600; font-size: .95em; }
  .wc-tile-sub { font-size: .82em; opacity: .75; }
  .wc-tile-status { font-size: .78em; opacity: .8; margin-top: 4px; }
  .wc-tile-rating { font-size: .85em; color: #d97706; margin-top: 2px; }

  .wc-fin-list { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
  .wc-fin-row {
    display: flex; align-items: center; gap: 10px; border: 1px solid var(--divider-color, #ddd); border-radius: 10px;
    padding: 8px 10px; cursor: pointer; background: var(--secondary-background-color, #fafafa);
    transition: box-shadow .15s ease, border-color .15s ease;
  }
  .wc-fin-row:hover { box-shadow: 0 2px 10px rgba(146, 64, 14, .18); border-color: #d97706; }
  .wc-fin-img { width: 46px; height: 46px; border-radius: 8px; object-fit: cover; flex: 0 0 auto; }
  .wc-fin-img-placeholder {
    display: flex; align-items: center; justify-content: center; font-size: 1.4em;
    background: linear-gradient(135deg, #f2c675, #b45309 65%, #6b3410);
  }
  .wc-fin-body { flex: 1 1 auto; min-width: 0; }
  .wc-fin-name { font-weight: 600; font-size: .95em; }
  .wc-fin-sub { font-size: .82em; opacity: .75; }
  .wc-fin-date { font-size: .8em; opacity: .8; margin-top: 2px; }
  .wc-fin-comment { font-size: .8em; opacity: .7; font-style: italic; margin-top: 2px; }
  .wc-fin-rating { font-size: .85em; color: #d97706; flex: 0 0 auto; white-space: nowrap; }
  .wc-tasting-badge { color: #b45309; opacity: .85; }
  .wc-tasting-remove {
    flex: 0 0 auto; padding: 4px 8px; font-size: .9em; line-height: 1; background: none; border-color: transparent;
  }
  .wc-tasting-remove:hover { border-color: #a33; background: rgba(170, 51, 51, .08); }
`;

const MODAL_CSS = `
  * { box-sizing: border-box; }
  .wc-modal-box {
    background: var(--card-background-color, #fff); color: var(--primary-text-color, #000);
    border-radius: 12px; padding: 20px; max-width: 720px; width: 100%; max-height: 90vh; overflow: auto;
    font-family: var(--paper-font-body1_-_font-family, sans-serif);
    border-top: 4px solid #d97706;
  }
  .wc-modal-title { margin: 0 0 12px; font-size: 1.2em; }
  .wc-section { border: 1px solid var(--divider-color, #ddd); border-radius: 10px; margin-bottom: 12px; padding: 10px 14px; }
  .wc-section legend { font-weight: 600; padding: 0 6px; color: #b45309; }
  .wc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
  .wc-field { display: flex; flex-direction: column; gap: 4px; font-size: .85em; }
  .wc-field span { opacity: .8; }
  .wc-field input, .wc-field select, .wc-field textarea {
    border: 1px solid var(--divider-color, #ccc); border-radius: 6px; padding: 6px 8px; font: inherit;
    background: var(--card-background-color, #fff); color: inherit;
  }
  .wc-field input:focus, .wc-field select:focus, .wc-field textarea:focus { outline: none; border-color: #d97706; }
  .wc-field-wide { grid-column: 1 / -1; }
  .wc-field-checkbox { flex-direction: row; align-items: center; gap: 8px; }
  .wc-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; }
  .wc-photo-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
  .wc-photo-hint { font-size: .8em; opacity: .7; }
  .wc-recog-panel { border: 1px dashed #b45309; border-radius: 10px; padding: 10px 12px; margin-bottom: 14px; font-size: .88em; background: rgba(217, 119, 6, .06); }
  .wc-recog-title { font-weight: 600; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .wc-recog-note { opacity: .75; margin: 6px 0; }
  .wc-recog-row { display: grid; grid-template-columns: auto 140px 1fr auto; align-items: center; gap: 8px; padding: 4px 0; }
  .wc-recog-field { opacity: .7; }
  .wc-conf-badge { font-size: .75em; padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
  .conf-high { background: #1e7e34; color: #fff; }
  .conf-mid { background: #b8860b; color: #fff; }
  .conf-low { background: #a33; color: #fff; }
  .conf-none { background: #888; color: #fff; }
  .wc-toast { background: #a33; color: #fff; border-radius: 8px; padding: 8px 12px; margin-bottom: 10px; font-size: .9em; }
  .wc-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 16px;
  }
  .wc-detail-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .wc-detail-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .wc-detail-img { width: 100%; max-height: 220px; object-fit: cover; border-radius: 10px; margin: 10px 0; display: block; }
  .wc-slot-summary { opacity: .8; font-size: .9em; margin: 6px 0; }
  .wc-slots { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
  .wc-slot {
    border: 1px solid var(--divider-color, #ddd); border-radius: 8px; padding: 6px 10px; font-size: .85em;
  }
  .wc-slot.wc-slot-empty { opacity: .7; border-style: dashed; }
  .wc-slot-row { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px; }
  .wc-slot-dot { color: #d97706; font-weight: 700; }
  .wc-slot-place { grid-column: 2; }
  .wc-slot-status { grid-column: 1 / -1; opacity: .75; font-size: .92em; }
  .wc-slot-actions { grid-column: 3; display: flex; gap: 6px; flex-wrap: wrap; justify-self: end; }
  .wc-slot-actions .wc-btn { padding: 4px 10px; font-size: .85em; }
  .wc-slot-remaining-row {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 6px; padding-top: 6px;
    border-top: 1px dashed var(--divider-color, #ddd); font-size: .88em;
  }
  .wc-slot-remaining-label { display: flex; align-items: center; gap: 6px; opacity: .85; }
  .wc-slot-remaining-input { width: 4.5em; padding: 3px 6px; }
  .wc-slot-remaining-save { padding: 3px 10px; font-size: .85em; }
  .wc-detail-row { display: flex; justify-content: space-between; gap: 12px; padding: 3px 0; font-size: .88em; }
  .wc-detail-label { opacity: .7; }
  .wc-detail-value { text-align: right; }
  .wc-stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; margin: 14px 0; }
  .wc-stat-tile {
    border: 1px solid var(--divider-color, #ddd); border-radius: 10px; padding: 10px; text-align: center;
    background: var(--secondary-background-color, #fafafa);
  }
  .wc-stat-num { font-size: 1.4em; font-weight: 700; color: #b45309; }
  .wc-stat-label { font-size: .78em; opacity: .75; margin-top: 2px; }
  .wc-stat-bar-row { display: grid; grid-template-columns: 130px 1fr auto; align-items: center; gap: 8px; padding: 3px 0; font-size: .85em; }
  .wc-stat-bar-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .wc-stat-bar-track { height: 8px; border-radius: 999px; background: var(--divider-color, #eee); overflow: hidden; }
  .wc-stat-bar-fill { display: block; height: 100%; background: linear-gradient(90deg, #f2b84b, #92400e); }
  .wc-stat-bar-count { opacity: .75; min-width: 2ch; text-align: right; }
`;

if (typeof customElements !== "undefined") {
  customElements.define("whisky-card", WhiskyCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "whisky-card",
    name: tr("WhiskyDB — Sammlung"),
    description: tr("Verwaltung deiner Whisky-Sammlung: detaillierte Einträge, Fotoerkennung per KI, Statistiken."),
  });
}

// ── Export pour les tests Node (voir tests/) — sans effet en navigateur ────
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    WHISKY_TYPE_VALUES, CASK_TYPE_SUGGESTIONS, TRI_FIELDS, NUMBER_FIELDS,
    triStateToPayload, triStateFromValue, numberOrUndefined,
    buildWhiskyPayload, confidenceTier, recognitionFieldList,
    applyRecognitionSelection, FORM_SECTIONS, CREATE_ONLY_SECTION,
    escapeHtml, STATUS_ORDER, STATUS_DOT, statusBreakdown, statusSummary,
    ratingStars, metaLine, tileHTML, detailRows,
    matchesQuery, matchesStatusFilter, filterWhiskies, breakdownJS,
    computeStats, topBreakdown, finishedEntries, finishedRowHTML,
    tastingRowHTML, mergedTastingEntries,
  };
}
