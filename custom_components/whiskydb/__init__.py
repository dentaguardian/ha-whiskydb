"""WhiskyDB — a whisky collection for Home Assistant.

WhiskyDB — international rework of ha-whisky (github.com/silventjeremie-lgtm/
ha-whisky), which itself derives from Millésime (github.com/Redsklns/ha-millesime,
MIT). Same architecture (local JSON storage, content-agnostic racks/slots,
self-served Lovelace card), own domain "whiskydb", a multilingual UI (12
languages, German as source language) and an OpenAI-compatible AI backend
(default: Mistral) instead of Gemini.

No 3D visualisation and no AI sommelier. No dependency on Whiskybase or any
other closed database — without an AI API key everything is manual entry,
no automatic fallback (documented limitation).
"""
from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
import re
import uuid
from datetime import datetime

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.aiohttp_client import async_get_clientsession

_LOGGER = logging.getLogger(__name__)

DOMAIN    = "whiskydb"
PLATFORMS = ["sensor"]
DATA_FILE = "whiskydb_data.json"


def _read_manifest_version() -> str:
    """Reads the version from manifest.json — the SINGLE source of truth for
    the card's cache-busting (see _async_register_card, url = .../whisky-
    card.js?v=VERSION). REGRESSION FIXED HERE: a hand-duplicated VERSION
    constant was stuck at "1.0.0" while manifest.json and whisky-card.js
    moved on with every release (1.0.1, 1.0.2, 1.1.0, 1.2.0) — so the
    Lovelace resource URL never changed and the browser kept serving the
    very first cached whisky-card.js indefinitely, no matter which update
    was actually installed. By deriving VERSION from manifest.json, a single
    value bumped per release (already done for every release) is enough."""
    try:
        manifest_path = os.path.join(os.path.dirname(__file__), "manifest.json")
        with open(manifest_path, "r", encoding="utf-8") as f:
            return json.load(f).get("version") or "0.0.0"
    except Exception:
        return "0.0.0"


VERSION = _read_manifest_version()

# ── Whisky classification ─────────────────────────────────────────────────────
# Closed list used to validate whisky_meta.whisky_type. "Other" covers any
# unlisted style without blocking input.
WHISKY_TYPE_VALUES = [
    "Single Malt", "Blended Malt", "Blended Whisky", "Single Grain",
    "Bourbon", "Rye", "Tennessee Whiskey", "Corn Whiskey",
    "Irish Single Malt", "Irish Pot Still", "Japanese Whisky",
    "World Whisky", "Other",
]

# Cask examples — INDICATIVE only: the cask_type field stays a free string
# (too many real-world variants for a closed list, e.g. "2nd Fill Oloroso
# Sherry Hogshead"); this list only feeds the card's autocomplete.
CASK_TYPE_SUGGESTIONS = [
    "Bourbon", "First Fill Bourbon", "Refill Bourbon", "Sherry", "Oloroso",
    "PX", "Port", "Madeira", "Wine", "Virgin Oak", "Mizunara",
    "Multiple Casks", "Other",
]

# State of a PHYSICAL bottle (carried by each slot, not by the record —
# see _mk_slot below: you can own several bottles of the same whisky in
# different states).
BOTTLE_STATUS_VALUES = ("sealed", "opened", "finished")

# ── Fields editable via the add_whisky/update_whisky services ───────────────
# Split into two groups: COMMON (record level, shared with any future
# beverage) and META (whisky_meta only). Service calls stay FLAT
# (as in Millésime): add_whisky(distillery=..., cask_type=...) instead of
# requiring a nested dict — easier to fill in from Developer Tools → Actions.
# Routing to whisky_meta is internal.
COMMON_FIELDS = [
    "image_url", "label_image_url", "price", "current_value", "currency",
    "purchase_date", "purchase_location", "storage_location", "notes",
    "favorite", "rating", "barcode", "external_id", "external_url",
]
META_FIELDS = [
    "distillery", "bottler", "brand", "expression",
    "country", "region", "distillery_location",
    "whisky_type",
    "age", "vintage", "bottling_year", "abv", "volume_ml",
    "chill_filtered", "natural_colour", "peated", "peat_level", "ppm",
    "maturation", "cask_type", "cask_number", "finish", "maturation_years",
    "batch", "edition", "bottle_number", "number_of_bottles",
    "limited_edition", "independent_bottler",
    "tasting_notes", "nose_notes", "palate_notes", "finish_notes",
    "whiskybase_id", "whiskybase_url",
]

# ── Data model ───────────────────────────────────────────────────────────────
# cellars[] : storage collections (physical structure, reused as-is from the
#             Millésime fork — already content-agnostic).
# whiskies[]: whisky records. One record = one product; slots[] = its
#             physical bottles (like wines[]/slots[] in Millésime).
DEFAULT_DATA: dict = {
    "cellars": [{"id": "main", "name": "Collection", "racks": []}],
    "whiskies": [],
    "tasting_log": [],
}


def _path(hass: HomeAssistant) -> str:
    return hass.config.path(DATA_FILE)


def _load(hass: HomeAssistant) -> dict:
    try:
        p = _path(hass)
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as exc:
        _LOGGER.error("WhiskyDB — Lesefehler: %s", exc)
    return json.loads(json.dumps(DEFAULT_DATA))


def _save(hass: HomeAssistant, data: dict) -> None:
    try:
        with open(_path(hass), "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as exc:
        _LOGGER.error("WhiskyDB — Speicherfehler: %s", exc)


def _uid() -> str:
    return str(uuid.uuid4())[:8]


# ── Collection/slot helpers (taken verbatim from Millésime: the physical
#    storage structure is already content-agnostic) ──────────────────────────

def _cellars(d: dict) -> list[dict]:
    """List of collections/cabinets; guarantees that one always exists."""
    cs = d.setdefault("cellars", [])
    if not cs:
        cs.append({"id": "main", "name": "Collection", "racks": []})
    return cs


def _cellar(d: dict, cellar_id: str | None = None) -> dict:
    """Collection with the given ID, or the first one by default."""
    cs = _cellars(d)
    if cellar_id:
        for c in cs:
            if c.get("id") == cellar_id:
                return c
    return cs[0]


def _all_racks(d: dict) -> list[dict]:
    """All racks across all collections (rack_id stays unique)."""
    return [r for c in _cellars(d) for r in c.get("racks", [])]


def _rack_capacity(rk: dict) -> int:
    """Capacity of a rack: columns × shelves × levels (stacked)."""
    levels = max(1, min(4, int(rk.get("levels", 1) or 1)))
    return rk.get("columns", 8) * rk.get("shelves", 2) * levels


def _slot_taken(d: dict, rack_id: str, slot: int,
                exclude_whisky_id: str | None = None,
                exclude_slot_idx: int | None = None) -> bool:
    """Returns True if the slot is already occupied in this rack.

    An empty/falsy rack_id means "no assigned slot" (bottle counted in the
    collection without a physical placement — the card's v1 form does not
    offer a rack selector yet, see commit 6): such bottles can never collide
    with each other, otherwise only a single "unplaced" bottle could exist
    in the whole collection before the service refuses the following ones.
    """
    if not rack_id:
        return False
    for w in d.get("whiskies", []):
        for i, s in enumerate(w.get("slots", [])):
            if s["rack_id"] == rack_id and s["slot"] == slot:
                if w["id"] == exclude_whisky_id and exclude_slot_idx is not None and i == exclude_slot_idx:
                    continue
                return True
    return False


def _mk_slot(rack_id: str, slot: int, comment=None, size=None,
             bottle_status: str = "sealed") -> dict:
    """Builds a slot = ONE physical bottle.

    bottle_status/opened_date/remaining_percent live HERE (per bottle),
    not on the whisky record: you can own several bottles of the same
    whisky in different states (one opened, two sealed).
    """
    s: dict = {
        "rack_id": rack_id,
        "slot": slot,
        "bottle_status": bottle_status if bottle_status in BOTTLE_STATUS_VALUES else "sealed",
    }
    if comment:
        s["comment"] = str(comment)
    if size:
        s["size"] = str(size)
    return s


def _new_whisky_record(name: str, whisky_meta: dict | None = None, **fields) -> dict:
    """Builds a blank whisky record (common fields + nested whisky_meta).

    Used by the services (commit 3) and by the tests (commit 10) —
    centralises the exact shape of the object to avoid divergence.
    """
    record = {
        "id":               _uid(),
        "beverage_type":    "whisky",
        "name":             name,
        "image_url":        fields.get("image_url", ""),
        "label_image_url":  fields.get("label_image_url", ""),
        "price":            float(fields.get("price", 0) or 0),
        "current_value":    float(fields.get("current_value", 0) or 0),
        "currency":         fields.get("currency", "EUR"),
        "purchase_date":    fields.get("purchase_date", ""),
        "purchase_location":fields.get("purchase_location", ""),
        "storage_location": fields.get("storage_location", ""),
        "notes":            fields.get("notes", ""),
        "favorite":         bool(fields.get("favorite", False)),
        "rating":           float(fields.get("rating", 0) or 0),
        "barcode":          fields.get("barcode", ""),
        "external_id":      fields.get("external_id", ""),
        "external_url":     fields.get("external_url", ""),
        "added_date":       fields.get("added_date") or datetime.now().strftime("%Y-%m-%d"),
        "slots":            fields.get("slots", []),
        "whisky_meta": {
            "distillery":          "",
            "bottler":              "",
            "brand":                "",
            "expression":           "",
            "country":              "",
            "region":               "",
            "distillery_location":  "",
            "whisky_type":          "",
            "age":                  "",
            "vintage":              "",
            "bottling_year":        "",
            "abv":                  0.0,
            "volume_ml":            700,
            "chill_filtered":       None,
            "natural_colour":       None,
            "peated":               None,
            "peat_level":           "",
            "ppm":                  0,
            "maturation":           "",
            "cask_type":            "",
            "cask_number":          "",
            "finish":               "",
            "maturation_years":     "",
            "batch":                "",
            "edition":              "",
            "bottle_number":        "",
            "number_of_bottles":    "",
            "limited_edition":      False,
            "independent_bottler":  False,
            "tasting_notes":        "",
            "nose_notes":           "",
            "palate_notes":         "",
            "finish_notes":         "",
            "whiskybase_id":        "",
            "whiskybase_url":       "",
            **(whisky_meta or {}),
        },
    }
    return record


# ── AI backend: OpenAI-compatible endpoint (Mistral, Ollama, LM Studio …) ───
# Instead of a proprietary Gemini call, WhiskyDB uses a generic
# OpenAI-compatible chat-completions endpoint. The default is Mistral
# (La Plateforme, https://console.mistral.ai) — any provider with
# /v1/chat/completions works (Ollama, LM Studio, OpenRouter, …).

AI_BASE_URL_DEFAULT = "https://api.mistral.ai/v1"
AI_TEXT_MODEL       = "mistral-small-latest"
AI_VISION_MODEL     = "pixtral-12b-latest"
AI_TEXT_FALLBACK    = "open-mistral-nemo"
AI_VISION_FALLBACK  = "pixtral-12b-latest"

# Preferred models (in this order), once discovery has run:
_PREF_TEXT = [
    "mistral-small-latest", "mistral-medium-latest", "mistral-large-latest",
    "open-mistral-nemo", "mistral-tiny",
]
_PREF_VISION = [
    "pixtral-12b-latest", "pixtral-12b", "mistral-medium-latest",
    "mistral-small-latest", "open-mistral-nemo",
]
_AI_MODELS: dict = {"text": None, "vision": None, "discovered": False}

ERR_QUOTA_EXCEEDED = "quota_exceeded"
ERR_INVALID_KEY    = "invalid_key"
ERR_UNAVAILABLE    = "service_unavailable"
ERR_PARSE_ERROR    = "parse_error"
ERR_NO_MODEL       = "no_model"
ERR_TIMEOUT        = "timeout"
ERR_TRUNCATED      = "truncated"
ERR_NO_KEY         = "no_key"


def _base_url(api_base: str) -> str:
    """Normalises the base URL: no trailing slash, no stale endpoint."""
    b = (api_base or AI_BASE_URL_DEFAULT).strip().rstrip("/")
    if b.endswith("/chat/completions"):
        b = b[: -len("/chat/completions")]
    return b


async def _discover_ai_models(hass: HomeAssistant, api_key: str, api_base: str) -> None:
    """Picks the actually available text/vision models via
    GET {base}/models (OpenAI-compatible: {"data": [{"id": ...}]}).
    Silent and non-blocking: on failure the stable fallbacks stay active."""
    if not api_key:
        return
    session = async_get_clientsession(hass)
    try:
        async with session.get(
            f"{_base_url(api_base)}/models",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=15,
        ) as resp:
            if resp.status != 200:
                _LOGGER.warning("WhiskyDB — Modell-Discovery: HTTP %s, Fallback aktiv", resp.status)
                return
            data = await resp.json(content_type=None)
    except Exception as exc:
        _LOGGER.warning("WhiskyDB — model discovery failed (%s), fallbacks active", exc)
        return

    available: set[str] = set()
    for m in data.get("data", []):
        mid = m.get("id") or ""
        if mid:
            available.add(mid)
    if not available:
        _LOGGER.warning("WhiskyDB — Modell-Discovery: leere Liste, Fallback aktiv")
        return

    def _pick(prefs: list[str], fallback: str) -> list[str]:
        chosen = [m for m in prefs if m in available]
        if fallback in available and fallback not in chosen:
            chosen.append(fallback)
        if not chosen:
            chosen = sorted(available)[:2]
        return chosen

    _AI_MODELS["text"] = _pick(_PREF_TEXT, AI_TEXT_FALLBACK)
    _AI_MODELS["vision"] = _pick(_PREF_VISION, AI_VISION_FALLBACK)
    _AI_MODELS["discovered"] = True
    _LOGGER.info("WhiskyDB — Modelle entdeckt: text=%s | vision=%s",
                 _AI_MODELS["text"], _AI_MODELS["vision"])


def _text_models() -> list[str]:
    return _AI_MODELS["text"] or [AI_TEXT_MODEL, AI_TEXT_FALLBACK]


def _vision_models() -> list[str]:
    return _AI_MODELS["vision"] or [AI_VISION_MODEL, AI_VISION_FALLBACK]


def _ai_error_code(status: int) -> str:
    if status == 429:
        return ERR_QUOTA_EXCEEDED
    if status in (401, 403):
        return ERR_INVALID_KEY
    return ERR_UNAVAILABLE


async def _ai_call(
    hass: HomeAssistant, api_key: str, api_base: str, models: list[str],
    messages: list[dict], timeout: int, label: str,
    temperature: float = 0.1, session=None,
) -> tuple[dict | None, str | None]:
    """Unified OpenAI-compatible chat-completions call: model fallback on
    404/5xx, one retry without response_format on 400, immediate abort on
    429/401/403."""
    session = session or async_get_clientsession(hass)
    saw_404 = saw_timeout = saw_other = False

    for model in models:
        for attempt in (0, 1):
            body: dict = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": 2048,
            }
            if attempt == 0:
                body["response_format"] = {"type": "json_object"}
            try:
                async with session.post(
                    f"{_base_url(api_base)}/chat/completions",
                    json=body,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    timeout=timeout,
                ) as resp:
                    status = resp.status
                    if status == 200:
                        data = await resp.json(content_type=None)
                        _LOGGER.debug("%s: Antwort von %s", label, model)
                        return data, None
                    if status == 400 and attempt == 0:
                        _LOGGER.warning(
                            "%s: HTTP 400 with response_format (%s) → retrying without JSON mode",
                            label, model)
                        continue
                    if status == 404:
                        saw_404 = True
                        _LOGGER.warning("%s: model %s unavailable (404), falling back", label, model)
                        break
                    if status in (429, 401, 403):
                        saw_other = True
                        _LOGGER.warning("%s: HTTP %s bei %s", label, status, model)
                        return None, _ai_error_code(status)
                    saw_other = True
                    _LOGGER.warning("%s: HTTP %s bei %s, Fallback", label, status, model)
                    break
            except asyncio.TimeoutError:
                saw_timeout = True
                _LOGGER.warning("%s: timeout (%s, %ss)", label, model, timeout)
                break
            except Exception as exc:
                saw_other = True
                _LOGGER.warning("%s: error (%s) %s", label, model, exc)
                break

    if saw_404 and not saw_other and not saw_timeout:
        _LOGGER.error(
            "%s: NO usable model (%s). Check the API key and the endpoint's models.",
            label, ", ".join(models))
        if not _AI_MODELS["discovered"] and api_key:
            hass.async_create_task(_discover_ai_models(hass, api_key, api_base))
        return None, ERR_NO_MODEL
    if saw_timeout and not saw_other:
        return None, ERR_TIMEOUT
    return None, ERR_UNAVAILABLE


def _ai_text(data: dict) -> tuple[str, str]:
    """Usable answer of a chat-completions response + finish_reason
    ('length' = truncated because of the token limit)."""
    choice = (data.get("choices") or [{}])[0] or {}
    finish = choice.get("finish_reason") or ""
    msg = choice.get("message") or {}
    content = msg.get("content")
    if isinstance(content, list):  # some providers return content parts
        content = "".join(p.get("text", "") for p in content if isinstance(p, dict))
    return (content or "").strip(), finish


def _json_salvage(txt: str):
    """Rescues complete JSON objects from a response truncated by the
    token limit, instead of discarding everything because of one
    truncated trailing object."""
    if not txt:
        return None
    s = txt.strip()
    if s.startswith("["):
        objs, depth, start, in_str, esc = [], 0, None, False, False
        for i, ch in enumerate(s):
            if in_str:
                if esc:
                    esc = False
                elif ch == "\\":
                    esc = True
                elif ch == '"':
                    in_str = False
                continue
            if ch == '"':
                in_str = True
            elif ch == "{":
                if depth == 0:
                    start = i
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0 and start is not None:
                    frag = s[start:i + 1]
                    try:
                        objs.append(json.loads(frag))
                    except Exception:
                        pass
                    start = None
        return objs or None
    if s.startswith("{"):
        for cut in range(len(s), 0, -1):
            frag = s[:cut].rstrip().rstrip(",")
            for suffix in ("", "}", '"}', "]}", '"]}'):
                try:
                    return json.loads(frag + suffix)
                except Exception:
                    continue
            if len(s) - cut > 4000:
                break
    return None


def _ai_payload(data: dict):
    """JSON from an AI answer, tolerant of ```json wrappers, noise and
    responses truncated by the token limit."""
    raw, finish = _ai_text(data)
    if not raw.strip():
        raise ValueError(f"leere Antwort (finish_reason={finish or '?'})")
    txt = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    txt = re.sub(r"\s*```$", "", txt).strip()
    try:
        return json.loads(txt)
    except Exception:
        pass
    for op, cl in (("{", "}"), ("[", "]")):
        i, j = txt.find(op), txt.rfind(cl)
        if i != -1 and j > i:
            try:
                return json.loads(txt[i:j + 1])
            except Exception:
                continue
    salvaged = _json_salvage(txt)
    if salvaged:
        _LOGGER.warning("WhiskyDB — Antwort abgeschnitten (finish_reason=%s), Teilinhalt gerettet", finish or "?")
        return salvaged
    raise ValueError(f"JSON not found (finish_reason={finish or '?'}, {len(raw)} characters)")


# ── AI system prompt WHISKY (deliberately kept German — functional) ──────────
# Critical point (inherited from the original): an independent bottler
# (Signatory Vintage, Gordon & MacPhail, Cadenhead's, Douglas Laing, Berry
# Bros. & Rudd, That Boutique-y Whisky Company ...) is NOT the distillery.
# The prompt names explicit examples to avoid this common confusion on
# independent-bottler labels.
_AI_SYSTEM_WHISKY = """\
Du bist ein weltweit erfahrener Whisky-Experte (Single Malt, Blended, Bourbon, \
Rye, japanischer Whisky ...) und kannst Flaschenetiketten lesen.

Analysiere die bereitgestellten Fotos: Vorderetikett, Rückenetikett, \
Kapsel/Verschluss, Tube oder Schachtel, falls sichtbar. Gib AUSSCHLIESSLICH \
ein gültiges JSON-Objekt {} zurück — ohne Markdown, ohne Backticks — mit \
genau diesen Feldern:
  name, distillery, bottler, brand, expression,
  country, region, whisky_type,
  age, vintage, bottling_year, abv, volume_ml,
  cask_type, finish, batch, edition, cask_number, bottle_number,
  limited_edition, peated,
  confidence_score, field_confidence

ABSOLUTE REGEL — NIE ETWAS ERFINDEN: Für JEDES Feld, das du nicht mit \
Sicherheit vom Bild ablesen oder zweifelsfrei herleiten kannst, gib JSON \
null zurück. Null ist immer besser als eine Vermutung. Nutze NIEMALS einen \
plausiblen, aber nicht ablesbaren Wert.

KRITISCHE UNTERSCHEIDUNG distillery / bottler — bei unabhängigen Abfüllungen \
steht der Name des Abfüllers meist viel größer auf dem Etikett als die \
Ursprungsdestillerie (die mitunter gar nicht auftaucht). Setze NIEMALS \
automatisch den auffälligsten Namen als Destillerie an. Bekannte \
unabhängige Abfüller — immer in "bottler", NIEMALS in "distillery": \
Signatory Vintage, Gordon & MacPhail, Cadenhead's, Douglas Laing \
(Old Particular, Xtra Old Particular ...), Berry Bros. & Rudd, That \
Boutique-y Whisky Company, Hunter Laing, The Single Cask, Adelphi. \
Beispiel: Ein Etikett "Signatory Vintage — Caol Ila 2012, 11 Year Old" \
ergibt bottler="Signatory Vintage" und distillery="Caol Ila" — niemals \
umgekehrt. Ist kein Destilleriename erkennbar, aber ein Abfüller, dann \
lasse "distillery" null, statt den Abfüllernamen zu übernehmen.

Feldregeln:
- name: vollständiger Name, wie er zu einem Sammlungseintrag passt \
  (z. B. "Caol Ila 11 Year Old — Signatory Vintage"), nie null, wenn ein \
  Etikett lesbar ist
- whisky_type: AUSSCHLIESSLICH einer dieser Werte, sonst null: \
  "Single Malt", "Blended Malt", "Blended Whisky", "Single Grain", \
  "Bourbon", "Rye", "Tennessee Whiskey", "Corn Whiskey", \
  "Irish Single Malt", "Irish Pot Still", "Japanese Whisky", \
  "World Whisky", "Other"
- age: Alter in Jahren als Zeichenkette (z. B. "16"), null bei NAS \
  (ohne Altersangabe)
- vintage / bottling_year: vierstellige Jahreszahl als Zeichenkette, oder null
- abv: Dezimalzahl (% vol, z. B. 43.0), null falls unlesbar
- volume_ml: Ganzzahl (meist 700), null falls unlesbar
- cask_type: Fasstyp als freier Text (z. B. "First Fill Oloroso Sherry \
  Butt"), null falls nicht angegeben
- peated: true/false nur wenn angegeben oder sicher ableitbar (z. B. \
  notorisch torfige Destillerie UND nichts widerspricht dem); im Zweifel \
  null — NICHT nur anhand des Destillerienamens raten
- limited_edition: true wenn "limited edition"/"limitierte Auflage"/\
sichtbare Nummerierung erkennbar, sonst null
- confidence_score: Dezimalzahl 0.0 bis 1.0 — GLOBALE Konfidenz der \
  Erkennung
- field_confidence: Objekt {"feld": 0.0-1.0, ...} — Konfidenz nur für die \
  tatsächlich ausgefüllten (nicht-null) Felder; null-Felder weglassen

Falls das Bild erkennbar KEINE Whiskyflasche zeigt, gib \
{"name": null, "confidence_score": 0.0, "field_confidence": {}} zurück und \
lasse alle anderen Felder null.\
"""

# ── Language switch: the AI answers in the user's HA language (i18n v2.1.0) ──
_AI_LANGUAGE_NAMES = {
    "de": "Deutsch", "en": "Englisch", "fr": "Französisch", "es": "Spanisch",
    "it": "Italienisch", "nl": "Niederländisch", "pt": "Portugiesisch",
    "zh": "Chinesisch", "ja": "Japanisch", "ko": "Koreanisch", "pl": "Polnisch",
}


def _ai_system_for(language: str) -> str:
    """System prompt + instruction for the user's answer language.

    The procedural prompt stays German (its JSON keys are fixed data-model
    identifiers); the answer language is set via instruction — LLMs follow
    this instruction reliably.
    """
    base = (language or "de").split("-")[0].lower()
    name = _AI_LANGUAGE_NAMES.get(base, "Deutsch")
    return _AI_SYSTEM_WHISKY + (
        f"\n\nSPRACHE DER ANTWORT: Antworte AUSSCHLIESSLICH auf {name}. "
        f"Beschreibende Textwerte (z. B. region) auf {name}; Eigennamen "
        "(Destillerie, Marke, Produktname) bleiben wie auf dem Etikett. "
        "JSON-Schlüssel und JSON-Struktur bleiben unverändert."
    )


def _safe_float_or_none(value):
    if value is None:
        return None
    try:
        return float(str(value).replace(",", "."))
    except (TypeError, ValueError):
        return None


def _safe_bool_or_none(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return None
    s = str(value).strip().lower()
    if s in ("true", "1", "oui", "yes", "ja"):
        return True
    if s in ("false", "0", "non", "no", "nein"):
        return False
    return None


def _clean_str_or_none(value) -> str | None:
    if value is None:
        return None
    s = str(value).strip()
    return s or None


_WHISKY_RESULT_FIELDS = (
    "name", "distillery", "bottler", "brand", "expression",
    "country", "region", "whisky_type",
    "age", "vintage", "bottling_year",
    "cask_type", "finish", "batch", "edition", "cask_number", "bottle_number",
)
_WHISKY_RESULT_FLOAT_FIELDS = ("abv",)
_WHISKY_RESULT_INT_FIELDS = ("volume_ml",)
_WHISKY_RESULT_BOOL_FIELDS = ("limited_edition", "peated")


def _parse_ai_whisky_response(raw: str, source: str, finish: str = "") -> tuple[dict | None, str | None]:
    """Parses the whisky AI's JSON answer.

    Every field stays None when the AI answered null or omitted the field —
    a value is never invented to make it look "nice" (null instead of
    hallucination). Gaps are shown by the card's validation screen, not by
    this parser.

    Returns: (result | None, error code | None).
    """
    if not raw:
        _LOGGER.warning("WhiskyDB — leere Antwort (%s, finish_reason=%s)", source, finish or "?")
        return None, ERR_TRUNCATED if finish == "length" else ERR_PARSE_ERROR

    txt = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    txt = re.sub(r"\s*```$", "", txt)

    try:
        parsed = json.loads(txt)
    except json.JSONDecodeError:
        parsed = _json_salvage(txt)
        if not parsed:
            _LOGGER.warning(
                "WhiskyDB — JSON unlesbar (%s, finish_reason=%s, %d Zeichen): %.200s",
                source, finish or "?", len(txt), txt,
            )
            return None, ERR_TRUNCATED if finish == "length" else ERR_PARSE_ERROR

    if isinstance(parsed, list):
        parsed = parsed[0] if parsed else {}
    if not isinstance(parsed, dict):
        return None, ERR_PARSE_ERROR

    result: dict = {}
    for f in _WHISKY_RESULT_FIELDS:
        result[f] = _clean_str_or_none(parsed.get(f))
    for f in _WHISKY_RESULT_FLOAT_FIELDS:
        result[f] = _safe_float_or_none(parsed.get(f))
    for f in _WHISKY_RESULT_INT_FIELDS:
        v = _safe_float_or_none(parsed.get(f))
        result[f] = int(v) if v is not None else None
    for f in _WHISKY_RESULT_BOOL_FIELDS:
        result[f] = _safe_bool_or_none(parsed.get(f))

    if result.get("whisky_type") and result["whisky_type"] not in WHISKY_TYPE_VALUES:
        # Lenient normalization (case, whitespace)
        match = next((v for v in WHISKY_TYPE_VALUES
                      if v.lower() == result["whisky_type"].strip().lower()), None)
        result["whisky_type"] = match  # None if no match: "Other" is not forced

    score = _safe_float_or_none(parsed.get("confidence_score"))
    result["confidence_score"] = max(0.0, min(1.0, score)) if score is not None else None

    field_conf = parsed.get("field_confidence")
    result["field_confidence"] = (
        {k: max(0.0, min(1.0, v)) for k, v in field_conf.items() if isinstance(v, (int, float))}
        if isinstance(field_conf, dict) else {}
    )

    if not result.get("name") and not any(
        result.get(f) for f in _WHISKY_RESULT_FIELDS if f != "name"
    ):
        # Nothing usable: image not recognized as a whisky, or empty
        return None, None

    return result, None


async def _ai_analyze_whisky_photo(
    hass: HomeAssistant, image_b64: str, mime_type: str, api_key: str, api_base: str, language: str = "de"
) -> tuple[dict | None, str | None]:
    """Analyses a whisky label photo using a vision-capable model."""
    messages = [
        {"role": "system", "content": _ai_system_for(language)},
        {"role": "user", "content": [
            {"type": "text", "text": "Identifiziere diesen Whisky anhand dieses Fotos."},
            {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{image_b64}"}},
        ]},
    ]
    data, last_code = None, ERR_UNAVAILABLE
    for attempt in range(2):
        data, last_code = await _ai_call(
            hass, api_key, api_base, _vision_models(), messages, 45, "WhiskyDB Foto",
        )
        if data is not None or last_code not in (ERR_UNAVAILABLE, ERR_TIMEOUT):
            break
        if attempt == 0:
            await asyncio.sleep(3.0)

    if data is None:
        _LOGGER.warning("WhiskyDB photo: no model succeeded (%s)", last_code)
        return None, last_code or ERR_UNAVAILABLE

    raw, finish = _ai_text(data)
    try:
        result, err = _parse_ai_whisky_response(raw, "photo", finish)
    except Exception as exc:
        _LOGGER.warning("WhiskyDB Foto: Lesefehler (%s)", exc)
        return None, ERR_TRUNCATED if finish == "length" else ERR_PARSE_ERROR
    _LOGGER.info("WhiskyDB photo: %s", "result found" if result else "nothing usable")
    return result, err


async def _ai_search_whisky_text(
    hass: HomeAssistant, query: str, api_key: str, api_base: str, language: str = "de"
) -> tuple[dict | None, str | None]:
    """AI search by name (without an API key this function is never
    called, see the WebSocket handler)."""
    messages = [
        {"role": "system", "content": _ai_system_for(language)},
        {"role": "user", "content": f'Identifiziere diesen Whisky: "{query}"'},
    ]
    data, code = await _ai_call(
        hass, api_key, api_base, _text_models(), messages, 30,
        f"WhiskyDB Text '{query}'", temperature=0.2,
    )
    if data is None:
        return None, code or ERR_UNAVAILABLE
    raw, finish = _ai_text(data)
    try:
        result, err = _parse_ai_whisky_response(raw, f"text:'{query}'", finish)
        return result, err
    except Exception as exc:
        _LOGGER.warning("WhiskyDB text error for '%s': %s", query, exc)
        return None, ERR_UNAVAILABLE


# ── Lovelace card: self-served (taken verbatim from the Millésime fork) ─────

_CARD_URL_PATH = "/whiskydb/whisky-card.js"


async def _async_register_card(hass: HomeAssistant) -> None:
    """Serves whisky-card.js from the integration and adds it to the Lovelace resources."""
    card_path = os.path.join(os.path.dirname(__file__), "whisky-card.js")
    if not os.path.exists(card_path):
        _LOGGER.error("WhiskyDB: whisky-card.js NICHT GEFUNDEN (%s)", card_path)
        return

    url = f"{_CARD_URL_PATH}?v={VERSION}"

    served = hass.data[DOMAIN].get("_card_http_done")
    if not served:
        ok = False
        try:
            from homeassistant.components.http import HomeAssistantView
            from aiohttp import web

            class _WhiskyCardView(HomeAssistantView):
                url = _CARD_URL_PATH
                name = "whiskydb:card"
                requires_auth = False

                async def get(self, request):
                    return web.FileResponse(card_path)

            hass.http.register_view(_WhiskyCardView())
            ok = True
            _LOGGER.warning("WhiskyDB: card served via HTTP view: %s", _CARD_URL_PATH)
        except Exception as exc:
            _LOGGER.warning("WhiskyDB: HTTP view failed (%s), trying static path", exc)
            try:
                from homeassistant.components.http import StaticPathConfig
                await hass.http.async_register_static_paths(
                    [StaticPathConfig(_CARD_URL_PATH, card_path, False)]
                )
                ok = True
                _LOGGER.warning("WhiskyDB: card served via static path")
            except Exception as exc2:
                _LOGGER.error("WhiskyDB: card cannot be served (%s)", exc2)

        if ok:
            hass.data[DOMAIN]["_card_http_done"] = True

    try:
        lovelace = hass.data.get("lovelace")
        resources = getattr(lovelace, "resources", None) if lovelace else None

        if resources is None:
            from homeassistant.components.frontend import add_extra_js_url
            add_extra_js_url(hass, url)
            _LOGGER.warning("WhiskyDB: Karte injiziert (Lovelace YAML-Modus) → %s", url)
            return

        if not resources.loaded:
            await resources.async_load()

        existing = [r for r in resources.async_items() if _CARD_URL_PATH in (r.get("url") or "")]
        if existing:
            for r in existing:
                if r.get("url") != url:
                    await resources.async_update_item(r["id"], {"res_type": "module", "url": url})
                    _LOGGER.warning("WhiskyDB: resource updated → %s", url)
        else:
            await resources.async_create_item({"res_type": "module", "url": url})
            _LOGGER.warning("WhiskyDB: resource created → %s", url)
    except Exception as exc:
        _LOGGER.error("WhiskyDB: could not register Lovelace resource (%s) — add %s manually",
                      exc, url)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up WhiskyDB."""
    hass.data.setdefault(DOMAIN, {})
    data = await hass.async_add_executor_job(_load, hass)

    ai_key = (
        entry.options.get("ai_api_key")
        or entry.data.get("ai_api_key")
        or ""
    ).strip()
    ai_base = (
        entry.options.get("ai_base_url")
        or entry.data.get("ai_base_url")
        or AI_BASE_URL_DEFAULT
    ).strip().rstrip("/")

    hass.data[DOMAIN][entry.entry_id] = {
        "data":         data,
        "ai_key":       ai_key,
        "ai_base_url":  ai_base or AI_BASE_URL_DEFAULT,
    }

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))

    # Discover available AI models in the background (stable fallbacks
    # until discovery completes) — see _discover_ai_models.
    if ai_key:
        hass.async_create_task(_discover_ai_models(hass, ai_key, ai_base))

    await _async_register_card(hass)

    # ── WebSocket: photo / text recognition ───────────────────────────────────

    @websocket_api.websocket_command({
        vol.Required("type"):      "whiskydb/analyze_photo",
        vol.Required("image_b64"): str,
        vol.Required("mime_type"): str,
        vol.Optional("language", default="de"): str,
    })
    @websocket_api.async_response
    async def ws_analyze_photo(hass: HomeAssistant, connection, msg: dict) -> None:
        gkey = hass.data[DOMAIN][entry.entry_id]["ai_key"]
        gbase = hass.data[DOMAIN][entry.entry_id]["ai_base_url"]
        if not gkey:
            connection.send_result(msg["id"], {"result": None, "error": ERR_NO_KEY})
            return
        result, err = await _ai_analyze_whisky_photo(hass, msg["image_b64"], msg["mime_type"], gkey, gbase, msg.get("language", "de"))
        connection.send_result(msg["id"], {"result": result, "error": err})

    websocket_api.async_register_command(hass, ws_analyze_photo)

    @websocket_api.websocket_command({
        vol.Required("type"):  "whiskydb/search_whisky",
        vol.Required("query"): str,
        vol.Optional("language", default="de"): str,
    })
    @websocket_api.async_response
    async def ws_search_whisky(hass: HomeAssistant, connection, msg: dict) -> None:
        gkey = hass.data[DOMAIN][entry.entry_id]["ai_key"]
        gbase = hass.data[DOMAIN][entry.entry_id]["ai_base_url"]
        query = (msg.get("query") or "").strip()
        if not gkey:
            connection.send_result(msg["id"], {"result": None, "error": ERR_NO_KEY})
            return
        if len(query) < 3:
            connection.send_result(msg["id"], {"result": None, "error": None})
            return
        result, err = await _ai_search_whisky_text(hass, query, gkey, gbase, msg.get("language", "de"))
        connection.send_result(msg["id"], {"result": result, "error": err})

    websocket_api.async_register_command(hass, ws_search_whisky)

    # ── WebSocket: get_data (full load for the card) ───────────────────────────

    @websocket_api.websocket_command({vol.Required("type"): "whiskydb/get_data"})
    @websocket_api.async_response
    async def ws_get_data(hass: HomeAssistant, connection, msg: dict) -> None:
        result = await hass.async_add_executor_job(_load, hass)
        connection.send_result(msg["id"], result)

    websocket_api.async_register_command(hass, ws_get_data)

    # ── Services ──────────────────────────────────────────────────────────────

    def _get() -> dict:
        return hass.data[DOMAIN][entry.entry_id]["data"]

    async def _persist(d: dict) -> None:
        hass.data[DOMAIN][entry.entry_id]["data"] = d
        await hass.async_add_executor_job(_save, hass, d)
        hass.bus.async_fire(f"{DOMAIN}_updated", {})

    def _call_rack_id(call: ServiceCall, default: str = "") -> str:
        v = call.data.get("rack_id")
        return default if v is None else v

    def _find_whisky(d: dict, whisky_id: str) -> dict | None:
        return next((w for w in d.get("whiskies", []) if w["id"] == whisky_id), None)

    # ── Racks ──────────────────────────────────────────────────────────────────

    async def svc_add_rack(call: ServiceCall) -> None:
        d = _get()
        cellar = _cellar(d, call.data.get("cellar_id"))
        cols = int(call.data.get("columns", 6))
        shelves = int(call.data.get("shelves", 3))
        levels = max(1, min(4, int(call.data.get("levels", 1))))
        rack = {
            "id":      _uid(),
            "name":    call.data.get("name", f"Rack {len(cellar['racks']) + 1}"),
            "columns": cols, "shelves": shelves, "levels": levels,
            "slots":   cols * shelves * levels,
        }
        cellar["racks"].append(rack)
        await _persist(d)

    async def svc_update_rack(call: ServiceCall) -> None:
        d = _get()
        rid = _call_rack_id(call)
        for r in _all_racks(d):
            if r["id"] == rid:
                for k in ("name", "columns", "shelves"):
                    if k in call.data:
                        r[k] = call.data[k]
                if "levels" in call.data:
                    r["levels"] = max(1, min(4, int(call.data["levels"])))
                r["slots"] = _rack_capacity(r)
                break
        else:
            raise HomeAssistantError(f"Rack not found: {rid}")
        await _persist(d)

    async def svc_remove_rack(call: ServiceCall) -> None:
        d = _get()
        rid = _call_rack_id(call)
        for c in _cellars(d):
            c["racks"] = [r for r in c["racks"] if r["id"] != rid]
        for w in d["whiskies"]:
            w["slots"] = [s for s in w["slots"] if s["rack_id"] != rid]
        # A record without a slot is NOT deleted automatically (unlike the
        # wine fork): a "finished" bottle can legitimately have no relevant
        # occupied slot while remaining a valid tasting history. Only
        # remove_whisky deletes a record.
        await _persist(d)

    # ── Collections ────────────────────────────────────────────────────────────

    async def svc_add_cellar(call: ServiceCall) -> None:
        d = _get()
        cs = _cellars(d)
        cs.append({"id": _uid(), "name": call.data.get("name", f"Collection {len(cs) + 1}"), "racks": []})
        await _persist(d)

    async def svc_rename_cellar(call: ServiceCall) -> None:
        d = _get()
        cellar = _cellar(d, call.data.get("cellar_id"))
        cellar["name"] = call.data.get("name", "Collection")
        await _persist(d)

    async def svc_remove_cellar(call: ServiceCall) -> None:
        d = _get()
        cid = call.data.get("cellar_id")
        cs = _cellars(d)
        target = next((c for c in cs if c.get("id") == cid), None)
        if not target:
            raise HomeAssistantError(f"Collection not found: {cid}")
        if len(cs) <= 1:
            raise HomeAssistantError("The last collection cannot be deleted.")
        if target.get("racks"):
            raise HomeAssistantError(
                "This collection still contains racks — move or remove them first."
            )
        d["cellars"] = [c for c in cs if c.get("id") != cid]
        await _persist(d)

    # ── Whisky records ─────────────────────────────────────────────────────────

    async def svc_add_whisky(call: ServiceCall) -> None:
        """Creates a new whisky record.

        Two placement modes, not combinable in one call:
        - rack_id given: ONE bottle placed at a precise slot.
        - rack_id absent: `quantity` bottles WITHOUT an assigned slot
          (rack_id=""), all with status `initial_status` — this is the
          path taken by the card's v1 form (commit 6), which does
          not offer a rack selector yet.
        """
        d = _get()
        name = str(call.data.get("name", "")).strip()
        if not name:
            raise HomeAssistantError("The whisky name is required.")
        initial_status = call.data.get("initial_status", "sealed")
        if initial_status not in BOTTLE_STATUS_VALUES:
            initial_status = "sealed"
        rack_id = call.data.get("rack_id")
        if rack_id:
            slot = int(call.data.get("slot", 0))
            if _slot_taken(d, rack_id, slot):
                raise HomeAssistantError(f"Slot No. {slot + 1} in this rack is already occupied.")
            slots = [_mk_slot(rack_id, slot, call.data.get("slot_comment"), bottle_status=initial_status)]
        else:
            qty = max(1, int(call.data.get("quantity", 1)))
            slots = [_mk_slot("", 0, bottle_status=initial_status) for _ in range(qty)]
        meta = {k: call.data[k] for k in META_FIELDS if k in call.data}
        common = {k: call.data[k] for k in COMMON_FIELDS if k in call.data}
        record = _new_whisky_record(name, whisky_meta=meta, slots=slots, **common)
        d["whiskies"].append(record)
        await _persist(d)
        hass.bus.async_fire(f"{DOMAIN}_bottle_added", {"whisky_id": record["id"], "name": name})

    async def svc_update_whisky(call: ServiceCall) -> None:
        """Updates a whisky record's metadata (common fields + whisky_meta)."""
        d = _get()
        whisky_id = call.data["whisky_id"]
        w = _find_whisky(d, whisky_id)
        if not w:
            raise HomeAssistantError(f"Whisky not found: {whisky_id}")
        if "name" in call.data:
            w["name"] = str(call.data["name"]).strip() or w["name"]
        for k in COMMON_FIELDS:
            if k in call.data:
                w[k] = call.data[k]
        for k in META_FIELDS:
            if k in call.data:
                w["whisky_meta"][k] = call.data[k]
        await _persist(d)

    async def svc_remove_whisky(call: ServiceCall) -> None:
        """Deletes a whisky record and all of its slots."""
        d = _get()
        d["whiskies"] = [w for w in d["whiskies"] if w["id"] != call.data["whisky_id"]]
        await _persist(d)

    # ── Slots (physical bottles) ──────────────────────────────────────────────

    async def svc_add_slot(call: ServiceCall) -> None:
        """Adds a physical bottle to an existing whisky record."""
        d = _get()
        whisky_id = call.data["whisky_id"]
        rack_id = _call_rack_id(call)
        slot = int(call.data.get("slot", 0))
        if _slot_taken(d, rack_id, slot):
            raise HomeAssistantError(f"Slot No. {slot + 1} in this rack is already occupied.")
        w = _find_whisky(d, whisky_id)
        if not w:
            raise HomeAssistantError(f"Whisky not found: {whisky_id}")
        w["slots"].append(_mk_slot(rack_id, slot, call.data.get("comment"), call.data.get("size")))
        await _persist(d)

    async def svc_update_slot(call: ServiceCall) -> None:
        """Changes a bottle's format or comment without moving it."""
        d = _get()
        w = _find_whisky(d, call.data["whisky_id"])
        if not w:
            raise HomeAssistantError(f"Whisky not found: {call.data['whisky_id']}")
        slot_idx = int(call.data.get("slot_idx", 0))
        if slot_idx >= len(w["slots"]):
            raise HomeAssistantError(f"Invalid slot index {slot_idx} for this whisky.")
        s = w["slots"][slot_idx]
        for k in ("size", "comment"):
            if k in call.data:
                v = str(call.data[k]).strip()
                if v:
                    s[k] = v
                else:
                    s.pop(k, None)
        await _persist(d)

    async def svc_move_slot(call: ServiceCall) -> None:
        """Moves a bottle to another rack/slot."""
        d = _get()
        whisky_id = call.data["whisky_id"]
        slot_idx = int(call.data.get("slot_idx", 0))
        new_rack = _call_rack_id(call)
        new_slot = int(call.data.get("slot", 0))
        if _slot_taken(d, new_rack, new_slot, exclude_whisky_id=whisky_id, exclude_slot_idx=slot_idx):
            raise HomeAssistantError(f"Slot No. {new_slot + 1} in this rack is already occupied.")
        w = _find_whisky(d, whisky_id)
        if not w:
            raise HomeAssistantError(f"Whisky not found: {whisky_id}")
        if slot_idx >= len(w["slots"]):
            raise HomeAssistantError(f"Invalid slot index {slot_idx} for this whisky.")
        w["slots"][slot_idx] = {**w["slots"][slot_idx], "rack_id": new_rack, "slot": new_slot}
        await _persist(d)

    async def svc_remove_slot(call: ServiceCall) -> None:
        """Removes ONE bottle. Deletes the record if this was its last slot."""
        d = _get()
        w = _find_whisky(d, call.data["whisky_id"])
        if not w:
            raise HomeAssistantError(f"Whisky not found: {call.data['whisky_id']}")
        slot_idx = int(call.data.get("slot_idx", 0))
        if slot_idx >= len(w["slots"]):
            raise HomeAssistantError(f"Invalid slot index {slot_idx} for this whisky.")
        if len(w["slots"]) <= 1:
            d["whiskies"].remove(w)
        else:
            w["slots"].pop(slot_idx)
        await _persist(d)

    # ── Bottle lifecycle: sealed → opened → finished ───────────────────────────

    async def svc_open_bottle(call: ServiceCall) -> None:
        """Marks a bottle as opened (sealed → opened)."""
        d = _get()
        w = _find_whisky(d, call.data["whisky_id"])
        if not w:
            raise HomeAssistantError(f"Whisky not found: {call.data['whisky_id']}")
        slot_idx = int(call.data.get("slot_idx", 0))
        if slot_idx >= len(w["slots"]):
            raise HomeAssistantError(f"Invalid slot index {slot_idx} for this whisky.")
        s = w["slots"][slot_idx]
        if s.get("bottle_status", "sealed") != "sealed":
            raise HomeAssistantError("This bottle is no longer sealed.")
        s["bottle_status"] = "opened"
        s["opened_date"] = call.data.get("opened_date") or datetime.now().strftime("%Y-%m-%d")
        s["remaining_percent"] = 100
        await _persist(d)
        hass.bus.async_fire(f"{DOMAIN}_bottle_opened", {
            "whisky_id": w["id"], "slot_idx": slot_idx, "name": w.get("name", ""),
        })

    async def svc_finish_bottle(call: ServiceCall) -> None:
        """Marks a bottle as finished (opened → finished).

        Unlike Millésime (drink_bottle), the slot is NOT deleted:
        "finished" is a proper record state (see bottle_status), not a
        deletion — the bottle's history stays viewable. Optional
        note/comment archived on the slot.
        """
        d = _get()
        w = _find_whisky(d, call.data["whisky_id"])
        if not w:
            raise HomeAssistantError(f"Whisky not found: {call.data['whisky_id']}")
        slot_idx = int(call.data.get("slot_idx", 0))
        if slot_idx >= len(w["slots"]):
            raise HomeAssistantError(f"Invalid slot index {slot_idx} for this whisky.")
        s = w["slots"][slot_idx]
        s["bottle_status"] = "finished"
        s["remaining_percent"] = 0
        s["finished_date"] = call.data.get("finished_date") or datetime.now().strftime("%Y-%m-%d")
        rating = call.data.get("rating")
        if rating is not None:
            try:
                w["rating"] = round(float(str(rating).replace(",", ".")), 1)
            except (TypeError, ValueError):
                pass
        comment = call.data.get("comment")
        if comment:
            s["comment"] = str(comment)
        await _persist(d)
        hass.bus.async_fire(f"{DOMAIN}_bottle_finished", {
            "whisky_id": w["id"], "slot_idx": slot_idx, "name": w.get("name", ""),
        })

    async def svc_update_remaining(call: ServiceCall) -> None:
        """Updates the remaining level (%) of an OPENED bottle.

        Allows manual tracking (weighing, visual estimate) between opening
        (100%, set by open_bottle) and finishing (0%, set by finish_bottle).
        Fires whiskydb_bottle_low ONLY when the low threshold is crossed
        (falling edge: the PREVIOUS value was above the threshold, the NEW
        one is at or below) — not on every call, so it stays directly
        usable in an automation without repeated triggering on every
        update.
        """
        d = _get()
        w = _find_whisky(d, call.data["whisky_id"])
        if not w:
            raise HomeAssistantError(f"Whisky not found: {call.data['whisky_id']}")
        slot_idx = int(call.data.get("slot_idx", 0))
        if slot_idx >= len(w["slots"]):
            raise HomeAssistantError(f"Invalid slot index {slot_idx} for this whisky.")
        s = w["slots"][slot_idx]
        if s.get("bottle_status", "sealed") != "opened":
            raise HomeAssistantError("Only an opened bottle has a fill level to track.")
        try:
            raw_pct = float(str(call.data["remaining_percent"]).replace(",", "."))
        except (KeyError, TypeError, ValueError):
            raise HomeAssistantError("remaining_percent must be a number between 0 and 100.")
        pct = max(0, min(100, round(raw_pct)))
        threshold = max(0, min(100, int(call.data.get("low_threshold", 20))))
        previous = s.get("remaining_percent")
        s["remaining_percent"] = pct
        await _persist(d)
        crossed_down = (previous is None or previous > threshold) and pct <= threshold
        if crossed_down:
            hass.bus.async_fire(f"{DOMAIN}_bottle_low", {
                "whisky_id": w["id"], "slot_idx": slot_idx, "name": w.get("name", ""),
                "remaining_percent": pct, "threshold": threshold,
            })

    async def svc_add_tasting(call: ServiceCall) -> None:
        """Adds a tasting NOT linked to the collection.

        Unlike finish_bottle (which closes a bottle you actually owned),
        this entry records a whisky you merely TASTED — at a friend's
        place, at a bar, at a tasting — without ever owning a bottle.
        Feeds the same "Drunk" tab in the card, but in a separate list
        (tasting_log), never in whiskies[]: no impact on the collection
        sensors (sensor.whiskydb_total, whiskydb_collection_value, etc.).
        """
        d = _get()
        name = str(call.data.get("name", "")).strip()
        if not name:
            raise HomeAssistantError("The whisky name is required.")
        rating = call.data.get("rating", 0)
        try:
            rating = round(float(str(rating).replace(",", ".")), 1)
        except (TypeError, ValueError):
            rating = 0
        entry = {
            "id":           _uid(),
            "name":         name,
            "distillery":   str(call.data.get("distillery", "") or "").strip(),
            "whisky_type":  call.data.get("whisky_type", ""),
            "region":       str(call.data.get("region", "") or "").strip(),
            "country":      str(call.data.get("country", "") or "").strip(),
            "place":        str(call.data.get("place", "") or "").strip(),
            "tasted_date":  call.data.get("tasted_date") or datetime.now().strftime("%Y-%m-%d"),
            "rating":       rating,
            "comment":      str(call.data.get("comment", "") or "").strip(),
        }
        log = d.setdefault("tasting_log", [])
        log.append(entry)
        # Keep the last 1000 tastings (same limit as Millésime).
        d["tasting_log"] = log[-1000:]
        await _persist(d)
        hass.bus.async_fire(f"{DOMAIN}_tasting_added", {"tasting_id": entry["id"], "name": name})

    async def svc_remove_tasting(call: ServiceCall) -> None:
        """Deletes an entry from the tasting diary (whisky tasted outside the collection)."""
        d = _get()
        tid = call.data["tasting_id"]
        d["tasting_log"] = [t for t in d.get("tasting_log", []) if t.get("id") != tid]
        await _persist(d)

    hass.services.async_register(DOMAIN, "add_rack",       svc_add_rack)
    hass.services.async_register(DOMAIN, "update_rack",    svc_update_rack)
    hass.services.async_register(DOMAIN, "remove_rack",    svc_remove_rack)
    hass.services.async_register(DOMAIN, "add_cellar",     svc_add_cellar)
    hass.services.async_register(DOMAIN, "rename_cellar",  svc_rename_cellar)
    hass.services.async_register(DOMAIN, "remove_cellar",  svc_remove_cellar)
    hass.services.async_register(DOMAIN, "add_whisky",     svc_add_whisky)
    hass.services.async_register(DOMAIN, "update_whisky",  svc_update_whisky)
    hass.services.async_register(DOMAIN, "remove_whisky",  svc_remove_whisky)
    hass.services.async_register(DOMAIN, "add_slot",       svc_add_slot)
    hass.services.async_register(DOMAIN, "update_slot",    svc_update_slot)
    hass.services.async_register(DOMAIN, "move_slot",      svc_move_slot)
    hass.services.async_register(DOMAIN, "remove_slot",    svc_remove_slot)
    hass.services.async_register(DOMAIN, "open_bottle",    svc_open_bottle)
    hass.services.async_register(DOMAIN, "finish_bottle",  svc_finish_bottle)
    hass.services.async_register(DOMAIN, "update_remaining", svc_update_remaining)
    hass.services.async_register(DOMAIN, "add_tasting",    svc_add_tasting)
    hass.services.async_register(DOMAIN, "remove_tasting", svc_remove_tasting)

    _LOGGER.info("WhiskyDB v%s started (%d entries)", VERSION, len(data.get("whiskies", [])))
    return True


async def _async_options_updated(hass: HomeAssistant, entry: ConfigEntry) -> None:
    new_key = (entry.options.get("ai_api_key") or "").strip()
    new_base = ((entry.options.get("ai_base_url") or "").strip() or AI_BASE_URL_DEFAULT).rstrip("/")
    hass.data[DOMAIN][entry.entry_id]["ai_key"] = new_key
    hass.data[DOMAIN][entry.entry_id]["ai_base_url"] = new_base
    # Key or endpoint changed → re-discover available models
    _AI_MODELS["text"] = _AI_MODELS["vision"] = None
    _AI_MODELS["discovered"] = False
    if new_key:
        hass.async_create_task(_discover_ai_models(hass, new_key, new_base))
    _LOGGER.info("WhiskyDB — KI-Einstellungen aktualisiert, Modelle werden neu entdeckt")


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if ok:
        hass.data[DOMAIN].pop(entry.entry_id)
    return ok
