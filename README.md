# WhiskyDB — Your whisky collection in Home Assistant 🥃

**WhiskyDB** is a multilingual Home Assistant integration with its own Lovelace
card for managing your whisky collection: collections and racks, bottles with a
status (sealed / opened / finished), fill-level tracking, a tasting journal,
statistics sensors — and optional AI support for label recognition and whisky
search via any OpenAI-compatible endpoint (default: **Mistral**; alternatives:
Ollama, LM Studio, OpenRouter …).

International fork of [ha-whisky](https://github.com/silventjeremie-lgtm/ha-whisky)
(Jérémie Silvent), which itself derives from
[Millésime](https://github.com/Redsklns/millesime) (Redsklns).
See [LICENSE](LICENSE) — all original authors remain credited.

## What makes WhiskyDB different from the original?

| | ha-whisky (original) | WhiskyDB (this fork) |
|---|---|---|
| UI (integration + card) | French | **12 languages** — follows the Home Assistant language automatically |
| AI backend | Google Gemini (Gemini key only) | **OpenAI-compatible** — default Mistral, configurable endpoint (Ollama, LM Studio, OpenRouter …) |
| Domain / entities | `whisky` | `whiskydb` (`sensor.whiskydb_total`, …) |
| Data file | `whisky_data.json` | `whiskydb_data.json` |
| Services | 18 (French descriptions) | the same 18, translated (English source + 11 translations) |
| Sensor names | "Whisky Ouvertes" etc. | "WhiskyDB Opened" etc. |

## Features

- 📦 **Collections & racks** – multiple cabinets, racks with columns/shelves/levels, visual placement in the card
- 🍾 **Bottle management** – multiple bottles per whisky record, status sealed/opened/finished, opening dates, fill level in %
- 🥂 **Tasting journal** – whiskies you merely tasted, without owning a bottle (bar, friends, tastings)
- 🤖 **AI support** (optional) – upload a label photo → the data sheet is filled in automatically; free-text search ("Islay, peated, around €60")
- 📊 **7 sensors** – `whiskydb_total`, `_opened`, `_sealed`, `_finished`, `_distilleries`, `_collection_value`, `_average_age`, including breakdown attributes (country, region, distillery, type, peat)
- ⚡ **Events for automations** – `whiskydb_bottle_opened`, `whiskydb_bottle_finished`, `whiskydb_bottle_low` (fill level below threshold), `whiskydb_tasting_added`, `whiskydb_updated`
- 🃏 **Lovelace card** – registered automatically as a resource by the integration (`/whiskydb/whisky-card.js`)

## Installation

### Option A — Manual (recommended if HACS gives you trouble)

1. Download the repository as a ZIP (green **Code** button → **Download ZIP**) and extract it.
2. Copy the folder `custom_components/whiskydb/` via Samba (e.g. `\\homeassistant.local\config\`) or SFTP to `/config/custom_components/whiskydb/`.
3. Restart Home Assistant (Settings → System → Restart).
4. Settings → Devices & Services → **Add Integration** → search for "WhiskyDB" and set it up.

### Option B — HACS (custom repository)

1. HACS → three dots at the top right → **Custom repositories**.
2. Add `dentaguardian/ha-whiskydb` with type **Integration**.
3. Install WhiskyDB in HACS, restart Home Assistant, then add the integration as above.

> **Note:** If the HACS download fails with an `aiohttp` error (GitHub headers
> too large during download), fall back to option A — it always works.

### Replacing an old ha-whisky installation

1. Back up your old data: rename/copy `/config/whisky_data.json` to `/config/whiskydb_data.json` (optional, if you already have entries).
2. Remove the old integration: Settings → Integrations → remove **Whisky**, then delete the folder `/config/custom_components/whisky/`.
3. Install WhiskyDB as above, restart, add the card to your dashboard.

## Configuration

During setup you choose the collection name and, optionally:

- **API key** – e.g. for free on [console.mistral.ai](https://console.mistral.ai/)
  (section *API Keys*). Without a key, manual management works completely —
  only label recognition and AI search are unavailable.
- **AI endpoint** – default `https://api.mistral.ai/v1`. Alternatives, e.g.:
  - Ollama: `http://localhost:11434/v1`
  - LM Studio: `http://localhost:1234/v1`
  - OpenRouter: `https://openrouter.ai/api/v1`

Both can be changed at any time later via *Configure* in the integration settings.

**AI answer language:** label recognition and AI search respond automatically
in the language set in Home Assistant under *Settings → General → Language*.

## Languages

WhiskyDB speaks 12 languages — the config dialog, the sensor names, all 18
services and (since v2.1.1) the complete Lovelace card follow your Home
Assistant language automatically:

| Language | File | Language | File |
|---|---|---|---|
| German | `de.json` | Chinese (Traditional) | `zh-Hant.json` |
| English | `en.json` | Japanese | `ja.json` |
| French | `fr.json` | Korean | `ko.json` |
| Spanish | `es.json` | Polish | `pl.json` |
| Italian | `it.json` | Dutch | `nl.json` |
| Chinese (Simplified) | `zh-Hans.json` | Portuguese (Brazil) | `pt-BR.json` |

A language missing? The files live under `custom_components/whiskydb/translations/` —
copy one, translate it and contribute a PR. 🙌

## Lovelace card

The card is registered automatically as a resource — in your dashboard:

```yaml
type: custom:whisky-card
```

Or in the UI editor: Add card → **Custom: Whisky Card**.

**Change the card language** (optional):

```yaml
type: custom:whisky-card
language: auto   # default: follows the HA language — or set directly: de, en, fr, es,
                 # it, nl, pl, pt-BR, ja, ko, zh-Hans, zh-Hant
```

The card follows the Home Assistant language by default (`auto`); unknown
languages fall back to English, missing texts fall back to English or German.

## Services

18 services under `whiskydb.*` — e.g.:

```yaml
service: whiskydb.open_bottle
data:
  whisky_id: "wx-0001"
  slot_idx: 0
```

Overview of all services: `whiskydb.add_rack`, `whiskydb.add_whisky`,
`whiskydb.open_bottle`, `whiskydb.finish_bottle`, `whiskydb.update_remaining`,
`whiskydb.add_tasting` and more (see `services.yaml` or Developer Tools →
Actions in Home Assistant).

## What changed in v2.2.0

The repository was internationalized to English:

- `strings.json` and `services.yaml` now use **English as the source language**
  (German users still see German via `de.json` — the UI is unchanged).
- Integration log messages and error messages are now English.
- Sensor attributes were renamed to English: `nach_land` → `by_country`,
  `nach_region` → `by_region`, `nach_destillerie` → `by_distillery`,
  `nach_typ` → `by_type`, `torfigkeit` → `by_peat`,
  `durchschnittspreis` → `average_price`; units are now `bottles` / `years`.
  **Update any templates or automations that read these attributes.**
- New installations get English default names ("Collection", "Rack 1");
  existing data is untouched.

## Attribution

- Based on **ha-whisky** by Jérémie Silvent (MIT)
- ha-whisky is based on **Millésime** by Redsklns (MIT)
- This edition: dentaguardian — MIT, see [LICENSE](LICENSE)

## License

MIT — see [LICENSE](LICENSE).
