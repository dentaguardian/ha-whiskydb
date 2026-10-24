# WhiskyDB — Deine Whisky-Sammlung in Home Assistant 🥃

**WhiskyDB** ist eine deutschsprachige Home-Assistant-Integration samt eigener
Lovelace-Karte zur Verwaltung deiner Whisky-Sammlung: Regale und Sammlungen,
Flaschen mit Status (versiegelt / geöffnet / leer), Füllstands-Verfolgung,
Verkostungstagebuch, Statistik-Sensoren — und optional KI-Unterstützung für
Etikett-Erkennung und Whisky-Suche über jeden OpenAI-kompatiblen Endpunkt
(Standard: **Mistral**, alternativ Ollama, LM Studio, OpenRouter …).

Deutsche Fork-Edition von [ha-whisky](https://github.com/silventjeremie-lgtm/ha-whisky)
(Jérémie Silvent), das seinerseits aus
[Millésime](https://github.com/Redsklns/millesime) (Redsklns) hervorgegangen ist.
Siehe [LICENSE](LICENSE) — alle ursprünglichen Urheber bleiben genannt.

## Was macht WhiskyDB anders als das Original?

| | ha-whisky (Original) | WhiskyDB (dieser Fork) |
|---|---|---|
| Oberfläche (Integration + Karte) | Französisch | **Komplett Deutsch** |
| KI-Backend | Google Gemini (nur Gemini-Key) | **OpenAI-kompatibel** — Standard Mistral, konfigurierbarer Endpunkt (Ollama, LM Studio, OpenRouter …) |
| Domain / Entitäten | `whisky` | `whiskydb` (`sensor.whiskydb_total`, …) |
| Daten-Datei | `whisky_data.json` | `whiskydb_data.json` |
| Services | 18 (französische Beschreibungen) | dieselben 18, deutsche Beschreibungen |
| Sensornamen | „Whisky Ouvertes“ & Co. | „WhiskyDB Geöffnet“ & Co. |

## Funktionen

- 📦 **Sammlungen & Regale** – mehrere Schränke, Regale mit Spalten/Böden/Ebenen, visuelle Platzierung in der Karte
- 🍾 **Flaschen-Verwaltung** – mehrere Exemplare pro Whisky-Eintrag, Status sealed/opened/finished, Öffnungsdaten, Füllstand in %
- 🥂 **Verkostungstagebuch** – probierte Whiskies ohne eigenen Flaschenbesitz (Bar, Freunde, Tasting)
- 🤖 **KI-Unterstützung** (optional) – Etikett-Foto hochladen → Datenblatt automatisch ausfüllen; freie Textsuche („Islay, torfig, um 60 €“)
- 📊 **7 Sensoren** – `whiskydb_total`, `_opened`, `_sealed`, `_finished`, `_distilleries`, `_collection_value`, `_average_age` inkl. Aufteilungs-Attributen (Land, Region, Destillerie, Typ, Torfigkeit)
- ⚡ **Ereignisse für Automatisierungen** – `whiskydb_bottle_opened`, `whiskydb_bottle_finished`, `whiskydb_bottle_low` (Füllstand unter Schwellwert), `whiskydb_tasting_added`, `whiskydb_updated`
- 🃏 **Lovelace-Karte** – wird von der Integration automatisch als Ressource registriert (`/whiskydb/whisky-card.js`)

## Installation

### Variante A — Manuell (empfohlen bei HACS-Problemen)

1. Lade das Repository als ZIP herunter (grüner **Code**-Button → **Download ZIP**) und entpacke es.
2. Kopiere den Ordner `custom_components/whiskydb/` per Samba (z. B. `\\homeassistant.local\config\`) oder SFTP nach `/config/custom_components/whiskydb/`.
3. Home Assistant neu starten (Einstellungen → System → Neu starten).
4. Einstellungen → Geräte & Dienste → **Integration hinzufügen** → „WhiskyDB“ suchen und einrichten.

### Variante B — HACS (Custom Repository)

1. HACS → drei Punkte oben rechts → **Benutzerdefinierte Repositories**.
2. `dentaguardian/ha-whiskydb` als Typ **Integration** hinzufügen.
3. WhiskyDB in HACS installieren, Home Assistant neu starten, dann Integration hinzufügen wie oben.

> **Hinweis:** Schlägt der HACS-Download mit einem `aiohttp`-Fehler fehl
> (zu große GitHub-Header beim Download), bleibt Variante A — sie funktioniert
> immer.

### Alte ha-whisky-Installation ersetzen

1. Alte Daten sichern: `/config/whisky_data.json` → nach `/config/whiskydb_data.json` **umbenennen/kopieren** (optional, wenn schon Einträge existieren).
2. Alte Integration entfernen: Einstellungen → Integrationen → **Whisky** entfernen, dann den Ordner `/config/custom_components/whisky/` löschen.
3. WhiskyDB wie oben installieren, neu starten, Karte im Dashboard anlegen.

## Konfiguration

Bei der Einrichtung wählst du den Namen der Sammlung und optional:

- **API-Key** – z. B. kostenlos auf [console.mistral.ai](https://console.mistral.ai/)
  (Abschnitt *API Keys*). Ohne Key funktioniert die manuelle Verwaltung komplett —
  nur Etikett-Erkennung und KI-Suche entfallen.
- **KI-Endpunkt** – Standard `https://api.mistral.ai/v1`. Alternativ z. B.:
  - Ollama: `http://localhost:11434/v1`
  - LM Studio: `http://localhost:1234/v1`
  - OpenRouter: `https://openrouter.ai/api/v1`

Beides lässt sich später jederzeit über *Konfigurieren* in den Integrationseinstellungen ändern.

## Lovelace-Karte

Die Karte wird automatisch als Ressource registriert — im Dashboard:

```yaml
type: custom:whisky-card
```

Oder im UI-Editor: Karte hinzufügen → **Benutzerdefiniert: Whisky Card**.

## Services

18 Services unter `whiskydb.*` — z. B.:

```yaml
service: whiskydb.open_bottle
data:
  whisky_id: "wx-0001"
  slot_idx: 0
```

Übersicht aller Services: `whiskydb.add_rack`, `whiskydb.add_whisky`,
`whiskydb.open_bottle`, `whiskydb.finish_bottle`, `whiskydb.update_remaining`,
`whiskydb.add_tasting` und weitere (siehe services.yaml bzw. Entwicklerwerkzeuge → Services in Home Assistant).

## Attribution

- Basierend auf **ha-whisky** von Jérémie Silvent (MIT)
- ha-whisky basiert auf **Millésime** von Redsklns (MIT)
- Diese Edition: dentaguardian — MIT, siehe [LICENSE](LICENSE)

## Lizenz

MIT — siehe [LICENSE](LICENSE).
