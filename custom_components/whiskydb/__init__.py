"""WhiskyDB — Whisky-Sammlung für Home Assistant.

WhiskyDB — deutscher Fork von ha-whisky (github.com/silventjeremie-lgtm/
ha-whisky), das selbst aus Millésime (github.com/Redsklns/ha-millesime, MIT)
abgeleitet ist. Gleiche Architektur (lokaler JSON-Speicher, physisch
agnostische Regale/Plätze, selbst ausgelieferte Lovelace-Karte), eigene
Domain "whiskydb", deutsche Oberfläche und ein OpenAI-kompatibles
KI-Backend (Standard: Mistral) statt Gemini.

Keine 3D-Visualisierung und kein KI-Sommelier. Keine Abhängigkeit von
Whiskybase oder einer anderen geschlossenen Datenbank — ohne KI-API-Key
gilt reine manuelle Eingabe, kein automatischer Fallback (dokumentierte
Einschränkung).
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
    """Lit la version depuis manifest.json — source UNIQUE de vérité pour le
    cache-busting de la carte (voir _async_register_card, url = .../whisky-
    card.js?v=VERSION). RÉGRESSION CORRIGÉE ICI : une constante VERSION
    dupliquée à la main restait figée à "1.0.0" alors que manifest.json et
    whisky-card.js avançaient normalement à chaque version (1.0.1, 1.0.2,
    1.1.0, 1.2.0) — l'URL de la ressource Lovelace ne changeait donc JAMAIS,
    et le navigateur continuait de servir indéfiniment le tout premier
    whisky-card.js mis en cache, quelle que soit la mise à jour réellement
    installée. En dérivant VERSION de manifest.json, une seule valeur à
    bumper par version (déjà fait à chaque release) suffit désormais."""
    try:
        manifest_path = os.path.join(os.path.dirname(__file__), "manifest.json")
        with open(manifest_path, "r", encoding="utf-8") as f:
            return json.load(f).get("version") or "0.0.0"
    except Exception:
        return "0.0.0"


VERSION = _read_manifest_version()

# ── Classification whisky (brief §2) ──────────────────────────────────────────
# Liste FERMÉE utilisée pour valider whisky_meta.whisky_type. "Other" couvre
# tout style non listé sans bloquer la saisie.
WHISKY_TYPE_VALUES = [
    "Single Malt", "Blended Malt", "Blended Whisky", "Single Grain",
    "Bourbon", "Rye", "Tennessee Whiskey", "Corn Whiskey",
    "Irish Single Malt", "Irish Pot Still", "Japanese Whisky",
    "World Whisky", "Other",
]

# Exemples de fûts (brief §2) — INDICATIF seulement : le champ cask_type
# reste une chaîne libre (trop de variantes réelles pour une liste fermée,
# ex. "2nd Fill Oloroso Sherry Hogshead"), cette liste alimente uniquement
# l'autocomplétion côté carte (commit 6).
CASK_TYPE_SUGGESTIONS = [
    "Bourbon", "First Fill Bourbon", "Refill Bourbon", "Sherry", "Oloroso",
    "PX", "Port", "Madeira", "Wine", "Virgin Oak", "Mizunara",
    "Multiple Casks", "Other",
]

# État d'une bouteille PHYSIQUE (porté par chaque slot, pas par la fiche —
# voir _mk_slot ci-dessous : on peut posséder plusieurs exemplaires du même
# whisky dans des états différents).
BOTTLE_STATUS_VALUES = ("sealed", "opened", "finished")

# ── Champs éditables par les services add_whisky/update_whisky ──────────────
# Séparés en deux groupes : COMMON (niveau fiche, communs à toute future
# boisson) et META (uniquement whisky_meta). Un appel de service reste PLAT
# (comme dans Millésime) : add_whisky(distillery=..., cask_type=...) plutôt
# que d'exiger un sous-dictionnaire — plus simple à remplir depuis Outils de
# développement → Actions. Le routage vers whisky_meta est interne.
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

# ── Modèle de données ─────────────────────────────────────────────────────────
# cellars[] : casiers/étagères de rangement (structure physique, réutilisée
#             telle quelle du fork Millésime — déjà agnostique du contenu).
# whiskies[]: fiches whisky. Une fiche = un produit ; slots[] = ses exemplaires
#             physiques (comme wines[]/slots[] côté Millésime).
DEFAULT_DATA: dict = {
    "cellars": [{"id": "main", "name": "Sammlung", "racks": []}],
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


# ── Helpers casiers/emplacements (repris à l'identique de Millésime : la
#    structure de rangement physique est déjà agnostique du contenu) ────────

def _cellars(d: dict) -> list[dict]:
    """Liste des caves/armoires ; garantit qu'il en existe toujours une."""
    cs = d.setdefault("cellars", [])
    if not cs:
        cs.append({"id": "main", "name": "Sammlung", "racks": []})
    return cs


def _cellar(d: dict, cellar_id: str | None = None) -> dict:
    """Cave d'identifiant donné, ou la première à défaut."""
    cs = _cellars(d)
    if cellar_id:
        for c in cs:
            if c.get("id") == cellar_id:
                return c
    return cs[0]


def _all_racks(d: dict) -> list[dict]:
    """Tous les casiers, toutes caves confondues (les rack_id restent uniques)."""
    return [r for c in _cellars(d) for r in c.get("racks", [])]


def _rack_capacity(rk: dict) -> int:
    """Capacité d'un casier : colonnes × étagères × niveaux (superposition)."""
    levels = max(1, min(4, int(rk.get("levels", 1) or 1)))
    return rk.get("columns", 8) * rk.get("shelves", 2) * levels


def _slot_taken(d: dict, rack_id: str, slot: int,
                exclude_whisky_id: str | None = None,
                exclude_slot_idx: int | None = None) -> bool:
    """Retourne True si l'emplacement est déjà occupé dans ce casier.

    Un rack_id vide/falsy signifie "sans emplacement assigné" (bouteille
    comptée dans la collection sans placement physique — le formulaire v1 de
    la carte ne propose pas encore de sélecteur d'étagère, voir commit 6) :
    ces exemplaires ne peuvent jamais entrer en collision entre eux, sinon
    une seule bouteille "non placée" pourrait exister dans toute la
    collection avant que le service ne refuse les suivantes.
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
    """Construit un emplacement = UNE bouteille physique.

    bottle_status/opened_date/remaining_percent vivent ICI (par exemplaire),
    pas sur la fiche whisky : on peut posséder plusieurs bouteilles du même
    whisky dans des états différents (une ouverte, deux scellées).
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
    """Construit une fiche whisky vierge (champs communs + whisky_meta imbriqué).

    Utilisé par les services (commit 3) et par les tests (commit 10) — centralise
    la forme exacte de l'objet pour éviter toute divergence entre les deux.
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


# ── KI-Backend: OpenAI-kompatibler Endpunkt (Mistral, Ollama, LM Studio …) ──
# WhiskyDB nutzt statt eines proprietären Gemini-Calls einen generischen
# OpenAI-kompatiblen Chat-Completions-Endpunkt. Standard ist Mistral
# (La Plateforme, https://console.mistral.ai) — jeder Anbieter mit
# /v1/chat/completions funktioniert (Ollama, LM Studio, OpenRouter, …).

AI_BASE_URL_DEFAULT = "https://api.mistral.ai/v1"
AI_TEXT_MODEL       = "mistral-small-latest"
AI_VISION_MODEL     = "pixtral-12b-latest"
AI_TEXT_FALLBACK    = "open-mistral-nemo"
AI_VISION_FALLBACK  = "pixtral-12b-latest"

# Bevorzugte Modelle (in dieser Reihenfolge), sobald die Discovery lief:
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
    """Normalisiert die Base-URL: ohne Trailingslash, ohne alten Endpunkt."""
    b = (api_base or AI_BASE_URL_DEFAULT).strip().rstrip("/")
    if b.endswith("/chat/completions"):
        b = b[: -len("/chat/completions")]
    return b


async def _discover_ai_models(hass: HomeAssistant, api_key: str, api_base: str) -> None:
    """Wählt die tatsächlich verfügbaren Text-/Vision-Modelle über
    GET {base}/models (OpenAI-kompatibel: {"data": [{"id": ...}]}).
    Still und nicht blockierend: bei Fehler bleiben die stabilen Fallbacks aktiv."""
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
        _LOGGER.warning("WhiskyDB — Modell-Discovery fehlgeschlagen (%s), Fallback aktiv", exc)
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
    """Einheitlicher OpenAI-kompatibler Chat-Completions-Call: Modell-Fallback
    bei 404/5xx, ein Wiederholungsversuch ohne response_format bei 400,
    sofortiger Abbruch bei 429/401/403."""
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
                            "%s: HTTP 400 mit response_format (%s) → Wiederholung ohne JSON-Modus",
                            label, model)
                        continue
                    if status == 404:
                        saw_404 = True
                        _LOGGER.warning("%s: Modell %s nicht verfügbar (404), Fallback", label, model)
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
                _LOGGER.warning("%s: Zeitüberschreitung (%s, %ss)", label, model, timeout)
                break
            except Exception as exc:
                saw_other = True
                _LOGGER.warning("%s: Fehler (%s) %s", label, model, exc)
                break

    if saw_404 and not saw_other and not saw_timeout:
        _LOGGER.error(
            "%s: KEIN nutzbares Modell (%s). Prüfe API-Key und Modelle des Endpunkts.",
            label, ", ".join(models))
        if not _AI_MODELS["discovered"] and api_key:
            hass.async_create_task(_discover_ai_models(hass, api_key, api_base))
        return None, ERR_NO_MODEL
    if saw_timeout and not saw_other:
        return None, ERR_TIMEOUT
    return None, ERR_UNAVAILABLE


def _ai_text(data: dict) -> tuple[str, str]:
    """Nutzbare Antwort einer Chat-Completions-Response + finish_reason
    ('length' = wegen Token-Limit abgeschnitten)."""
    choice = (data.get("choices") or [{}])[0] or {}
    finish = choice.get("finish_reason") or ""
    msg = choice.get("message") or {}
    content = msg.get("content")
    if isinstance(content, list):  # manche Anbieter liefern Content-Parts
        content = "".join(p.get("text", "") for p in content if isinstance(p, dict))
    return (content or "").strip(), finish


def _json_salvage(txt: str):
    """Rettet vollständige JSON-Objekte aus einer durch das Token-Limit
    abgeschnittenen Antwort, statt alles wegen eines abgeschnittenen
    letzten Objekts zu verwerfen."""
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
    """JSON aus einer KI-Antwort, tolerant gegenüber ```json-Hüllen, Beiwerk
    und durch das Token-Limit abgeschnittenen Antworten."""
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
    raise ValueError(f"JSON nicht gefunden (finish_reason={finish or '?'}, {len(raw)} Zeichen)")


# ── KI-Systemprompt WHISKY (deutsch) ────────────────────────────────────────
# Kritischer Punkt (aus dem Original übernommen): Ein unabhängiger Abfüller
# (Signatory Vintage, Gordon & MacPhail, Cadenhead's, Douglas Laing, Berry
# Bros. & Rudd, That Boutique-y Whisky Company ...) IST NICHT die Destillerie.
# Der Prompt nennt explizite Beispiele, um diese häufige Verwechslung auf
# Independents-Etiketten zu vermeiden.
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

# ── Sprachweiche: KI antwortet in der HA-Sprache des Nutzers (i18n v2.1.0) ────
_AI_LANGUAGE_NAMES = {
    "de": "Deutsch", "en": "Englisch", "fr": "Französisch", "es": "Spanisch",
    "it": "Italienisch", "nl": "Niederländisch", "pt": "Portugiesisch",
    "zh": "Chinesisch", "ja": "Japanisch", "ko": "Koreanisch", "pl": "Polnisch",
}


def _ai_system_for(language: str) -> str:
    """Systemprompt + Anweisung zur Antwort-Sprache des Nutzers.

    Der Verfahrens-Prompt bleibt deutsch; die Antwort-Sprache wird per
    Anweisung gesetzt — LLMs folgen dieser Anweisung zuverlässig.
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
    """Parst die JSON-Antwort der Whisky-KI.

    Jedes Feld bleibt None, wenn die KI null geantwortet oder das Feld
    ausgelassen hat — nie wird ein Wert erfunden, um es "hübsch" zu machen
    (null statt Halluzination). Die Lücken zeigt der Validierungs-Screen der
    Karte, nicht dieser Parser.

    Rückgabe: (Ergebnis | None, Fehlercode | None).
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
        # Großzügige Normalisierung (Groß-/Kleinschreibung, Leerzeichen)
        match = next((v for v in WHISKY_TYPE_VALUES
                      if v.lower() == result["whisky_type"].strip().lower()), None)
        result["whisky_type"] = match  # None ohne Treffer: "Other" wird nicht erzwungen

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
        # Nichts Verwertbares: Bild nicht als Whisky erkannt, oder leer
        return None, None

    return result, None


async def _ai_analyze_whisky_photo(
    hass: HomeAssistant, image_b64: str, mime_type: str, api_key: str, api_base: str, language: str = "de"
) -> tuple[dict | None, str | None]:
    """Analysiert ein Whisky-Etikettenfoto über ein visionsfähiges Modell."""
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
        _LOGGER.warning("WhiskyDB Foto: kein Modell erfolgreich (%s)", last_code)
        return None, last_code or ERR_UNAVAILABLE

    raw, finish = _ai_text(data)
    try:
        result, err = _parse_ai_whisky_response(raw, "photo", finish)
    except Exception as exc:
        _LOGGER.warning("WhiskyDB Foto: Lesefehler (%s)", exc)
        return None, ERR_TRUNCATED if finish == "length" else ERR_PARSE_ERROR
    _LOGGER.info("WhiskyDB Foto: %s", "Ergebnis gefunden" if result else "nichts Verwertbares")
    return result, err


async def _ai_search_whisky_text(
    hass: HomeAssistant, query: str, api_key: str, api_base: str, language: str = "de"
) -> tuple[dict | None, str | None]:
    """KI-Suche anhand des Namens (ohne API-Key wird diese Funktion nicht
    aufgerufen, siehe WebSocket-Handler)."""
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
        _LOGGER.warning("WhiskyDB Textfehler für '%s': %s", query, exc)
        return None, ERR_UNAVAILABLE


# ── Carte Lovelace : auto-service (repris à l'identique du fork Millésime) ──

_CARD_URL_PATH = "/whiskydb/whisky-card.js"


async def _async_register_card(hass: HomeAssistant) -> None:
    """Sert whisky-card.js depuis l'intégration et l'ajoute aux ressources Lovelace."""
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
            _LOGGER.warning("WhiskyDB: Karte über HTTP-View ausgeliefert: %s", _CARD_URL_PATH)
        except Exception as exc:
            _LOGGER.warning("WhiskyDB: HTTP-View fehlgeschlagen (%s), versuche statischen Pfad", exc)
            try:
                from homeassistant.components.http import StaticPathConfig
                await hass.http.async_register_static_paths(
                    [StaticPathConfig(_CARD_URL_PATH, card_path, False)]
                )
                ok = True
                _LOGGER.warning("WhiskyDB: Karte über statischen Pfad ausgeliefert")
            except Exception as exc2:
                _LOGGER.error("WhiskyDB: Karte kann nicht ausgeliefert werden (%s)", exc2)

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
                    _LOGGER.warning("WhiskyDB: Ressource aktualisiert → %s", url)
        else:
            await resources.async_create_item({"res_type": "module", "url": url})
            _LOGGER.warning("WhiskyDB: Ressource angelegt → %s", url)
    except Exception as exc:
        _LOGGER.error("WhiskyDB: Lovelace-Ressource nicht möglich (%s) — füge %s manuell hinzu",
                      exc, url)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Initialise Whisky."""
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

    # Verfügbare KI-Modelle im Hintergrund entdecken (stabile Fallbacks,
    # bis die Discovery durch ist) — siehe _discover_ai_models.
    if ai_key:
        hass.async_create_task(_discover_ai_models(hass, ai_key, ai_base))

    await _async_register_card(hass)

    # ── WebSocket : reconnaissance photo / texte ─────────────────────────────

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

    # ── WebSocket : get_data (chargement complet côté carte) ──────────────────

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

    # ── Casiers ───────────────────────────────────────────────────────────────

    async def svc_add_rack(call: ServiceCall) -> None:
        d = _get()
        cellar = _cellar(d, call.data.get("cellar_id"))
        cols = int(call.data.get("columns", 6))
        shelves = int(call.data.get("shelves", 3))
        levels = max(1, min(4, int(call.data.get("levels", 1))))
        rack = {
            "id":      _uid(),
            "name":    call.data.get("name", f"Regal {len(cellar['racks']) + 1}"),
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
            raise HomeAssistantError(f"Regal nicht gefunden: {rid}")
        await _persist(d)

    async def svc_remove_rack(call: ServiceCall) -> None:
        d = _get()
        rid = _call_rack_id(call)
        for c in _cellars(d):
            c["racks"] = [r for r in c["racks"] if r["id"] != rid]
        for w in d["whiskies"]:
            w["slots"] = [s for s in w["slots"] if s["rack_id"] != rid]
        # Une fiche sans emplacement n'est PAS supprimée automatiquement pour le
        # whisky (contrairement au fork vin) : une bouteille "finished" peut
        # légitimement n'avoir plus d'emplacement occupé pertinent tout en
        # restant un historique de dégustation valide. Seul remove_whisky retire
        # une fiche.
        await _persist(d)

    # ── Caves / armoires ──────────────────────────────────────────────────────

    async def svc_add_cellar(call: ServiceCall) -> None:
        d = _get()
        cs = _cellars(d)
        cs.append({"id": _uid(), "name": call.data.get("name", f"Sammlung {len(cs) + 1}"), "racks": []})
        await _persist(d)

    async def svc_rename_cellar(call: ServiceCall) -> None:
        d = _get()
        cellar = _cellar(d, call.data.get("cellar_id"))
        cellar["name"] = call.data.get("name", "Sammlung")
        await _persist(d)

    async def svc_remove_cellar(call: ServiceCall) -> None:
        d = _get()
        cid = call.data.get("cellar_id")
        cs = _cellars(d)
        target = next((c for c in cs if c.get("id") == cid), None)
        if not target:
            raise HomeAssistantError(f"Sammlung nicht gefunden: {cid}")
        if len(cs) <= 1:
            raise HomeAssistantError("Die letzte Sammlung kann nicht gelöscht werden.")
        if target.get("racks"):
            raise HomeAssistantError(
                "Diese Sammlung enthält noch Regale — bitte zuerst verschieben oder entfernen."
            )
        d["cellars"] = [c for c in cs if c.get("id") != cid]
        await _persist(d)

    # ── Fiches whisky ─────────────────────────────────────────────────────────

    async def svc_add_whisky(call: ServiceCall) -> None:
        """Crée une nouvelle fiche whisky.

        Deux modes de placement, non combinables dans un même appel :
        - rack_id fourni : UN exemplaire précisément placé (slot).
        - rack_id absent : `quantity` exemplaires SANS emplacement assigné
          (rack_id=""), tous au statut `initial_status` — c'est le chemin
          emprunté par le formulaire v1 de la carte (commit 6), qui ne
          propose pas encore de sélecteur d'étagère.
        """
        d = _get()
        name = str(call.data.get("name", "")).strip()
        if not name:
            raise HomeAssistantError("Der Name des Whiskys ist erforderlich.")
        initial_status = call.data.get("initial_status", "sealed")
        if initial_status not in BOTTLE_STATUS_VALUES:
            initial_status = "sealed"
        rack_id = call.data.get("rack_id")
        if rack_id:
            slot = int(call.data.get("slot", 0))
            if _slot_taken(d, rack_id, slot):
                raise HomeAssistantError(f"Platz Nr. {slot + 1} ist in diesem Regal bereits belegt.")
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
        """Met à jour les métadonnées d'une fiche whisky (champs communs + whisky_meta)."""
        d = _get()
        whisky_id = call.data["whisky_id"]
        w = _find_whisky(d, whisky_id)
        if not w:
            raise HomeAssistantError(f"Whisky nicht gefunden: {whisky_id}")
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
        """Supprime une fiche whisky et tous ses emplacements."""
        d = _get()
        d["whiskies"] = [w for w in d["whiskies"] if w["id"] != call.data["whisky_id"]]
        await _persist(d)

    # ── Emplacements (bouteilles physiques) ──────────────────────────────────

    async def svc_add_slot(call: ServiceCall) -> None:
        """Ajoute un exemplaire physique à une fiche whisky existante."""
        d = _get()
        whisky_id = call.data["whisky_id"]
        rack_id = _call_rack_id(call)
        slot = int(call.data.get("slot", 0))
        if _slot_taken(d, rack_id, slot):
            raise HomeAssistantError(f"Platz Nr. {slot + 1} ist in diesem Regal bereits belegt.")
        w = _find_whisky(d, whisky_id)
        if not w:
            raise HomeAssistantError(f"Whisky nicht gefunden: {whisky_id}")
        w["slots"].append(_mk_slot(rack_id, slot, call.data.get("comment"), call.data.get("size")))
        await _persist(d)

    async def svc_update_slot(call: ServiceCall) -> None:
        """Modifie le format ou le commentaire d'un exemplaire, sans le déplacer."""
        d = _get()
        w = _find_whisky(d, call.data["whisky_id"])
        if not w:
            raise HomeAssistantError(f"Whisky nicht gefunden: {call.data['whisky_id']}")
        slot_idx = int(call.data.get("slot_idx", 0))
        if slot_idx >= len(w["slots"]):
            raise HomeAssistantError(f"Ungültiger Platz-Index {slot_idx} für diesen Whisky.")
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
        """Déplace un exemplaire vers une autre étagère/emplacement."""
        d = _get()
        whisky_id = call.data["whisky_id"]
        slot_idx = int(call.data.get("slot_idx", 0))
        new_rack = _call_rack_id(call)
        new_slot = int(call.data.get("slot", 0))
        if _slot_taken(d, new_rack, new_slot, exclude_whisky_id=whisky_id, exclude_slot_idx=slot_idx):
            raise HomeAssistantError(f"Platz Nr. {new_slot + 1} ist in diesem Regal bereits belegt.")
        w = _find_whisky(d, whisky_id)
        if not w:
            raise HomeAssistantError(f"Whisky nicht gefunden: {whisky_id}")
        if slot_idx >= len(w["slots"]):
            raise HomeAssistantError(f"Ungültiger Platz-Index {slot_idx} für diesen Whisky.")
        w["slots"][slot_idx] = {**w["slots"][slot_idx], "rack_id": new_rack, "slot": new_slot}
        await _persist(d)

    async def svc_remove_slot(call: ServiceCall) -> None:
        """Retire UN exemplaire. Supprime la fiche si c'était le dernier emplacement."""
        d = _get()
        w = _find_whisky(d, call.data["whisky_id"])
        if not w:
            raise HomeAssistantError(f"Whisky nicht gefunden: {call.data['whisky_id']}")
        slot_idx = int(call.data.get("slot_idx", 0))
        if slot_idx >= len(w["slots"]):
            raise HomeAssistantError(f"Ungültiger Platz-Index {slot_idx} für diesen Whisky.")
        if len(w["slots"]) <= 1:
            d["whiskies"].remove(w)
        else:
            w["slots"].pop(slot_idx)
        await _persist(d)

    # ── Cycle de vie d'une bouteille : sealed → opened → finished ────────────

    async def svc_open_bottle(call: ServiceCall) -> None:
        """Marque un exemplaire comme ouvert (sealed → opened)."""
        d = _get()
        w = _find_whisky(d, call.data["whisky_id"])
        if not w:
            raise HomeAssistantError(f"Whisky nicht gefunden: {call.data['whisky_id']}")
        slot_idx = int(call.data.get("slot_idx", 0))
        if slot_idx >= len(w["slots"]):
            raise HomeAssistantError(f"Ungültiger Platz-Index {slot_idx} für diesen Whisky.")
        s = w["slots"][slot_idx]
        if s.get("bottle_status", "sealed") != "sealed":
            raise HomeAssistantError("Diese Flasche ist nicht mehr versiegelt.")
        s["bottle_status"] = "opened"
        s["opened_date"] = call.data.get("opened_date") or datetime.now().strftime("%Y-%m-%d")
        s["remaining_percent"] = 100
        await _persist(d)
        hass.bus.async_fire(f"{DOMAIN}_bottle_opened", {
            "whisky_id": w["id"], "slot_idx": slot_idx, "name": w.get("name", ""),
        })

    async def svc_finish_bottle(call: ServiceCall) -> None:
        """Marque un exemplaire comme terminé (opened → finished).

        Contrairement à Millésime (drink_bottle), l'emplacement N'EST PAS
        supprimé : "finished" est un état de fiche à part entière (brief §2,
        bottle_status), pas une suppression — l'historique de la bouteille
        reste consultable. Note/commentaire optionnels archivés sur l'emplacement.
        """
        d = _get()
        w = _find_whisky(d, call.data["whisky_id"])
        if not w:
            raise HomeAssistantError(f"Whisky nicht gefunden: {call.data['whisky_id']}")
        slot_idx = int(call.data.get("slot_idx", 0))
        if slot_idx >= len(w["slots"]):
            raise HomeAssistantError(f"Ungültiger Platz-Index {slot_idx} für diesen Whisky.")
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
        """Met à jour le niveau restant (%) d'un exemplaire OUVERT.

        Permet un suivi manuel (pesée, estimation visuelle) entre l'ouverture
        (100%, fixé par open_bottle) et la fin (0%, fixé par finish_bottle).
        Déclenche whisky_bottle_low UNIQUEMENT au franchissement du seuil bas
        (front descendant : la valeur PRÉCÉDENTE était au-dessus du seuil, la
        NOUVELLE est à ou en dessous) — pas à chaque appel, pour rester
        directement utilisable dans une automatisation sans déclenchement
        répété à chaque mise à jour (brief §11 : services prêts pour
        l'automatisation).
        """
        d = _get()
        w = _find_whisky(d, call.data["whisky_id"])
        if not w:
            raise HomeAssistantError(f"Whisky nicht gefunden: {call.data['whisky_id']}")
        slot_idx = int(call.data.get("slot_idx", 0))
        if slot_idx >= len(w["slots"]):
            raise HomeAssistantError(f"Ungültiger Platz-Index {slot_idx} für diesen Whisky.")
        s = w["slots"][slot_idx]
        if s.get("bottle_status", "sealed") != "opened":
            raise HomeAssistantError("Nur ein geöffnetes Exemplar hat einen Füllstand zum Nachverfolgen.")
        try:
            raw_pct = float(str(call.data["remaining_percent"]).replace(",", "."))
        except (KeyError, TypeError, ValueError):
            raise HomeAssistantError("remaining_percent muss eine Zahl zwischen 0 und 100 sein.")
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
        """Ajoute une dégustation SANS lien avec la collection.

        Contrairement à finish_bottle (qui clôt un exemplaire réellement
        possédé), cette entrée sert à noter un whisky simplement GOÛTÉ —
        chez un ami, en bar, lors d'une dégustation — sans jamais avoir
        possédé de bouteille. Alimente le même onglet "Whisky bu" côté
        carte, mais dans une liste séparée (tasting_log), jamais dans
        whiskies[] : aucun impact sur les capteurs de collection
        (sensor.whisky_total, whisky_collection_value, etc.).
        """
        d = _get()
        name = str(call.data.get("name", "")).strip()
        if not name:
            raise HomeAssistantError("Der Name des Whiskys ist erforderlich.")
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
        # Garder les 1000 dernières dégustations (même limite que Millésime).
        d["tasting_log"] = log[-1000:]
        await _persist(d)
        hass.bus.async_fire(f"{DOMAIN}_tasting_added", {"tasting_id": entry["id"], "name": name})

    async def svc_remove_tasting(call: ServiceCall) -> None:
        """Supprime une entrée du journal de dégustation (whisky goûté hors collection)."""
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

    _LOGGER.info("WhiskyDB v%s gestartet (%d Einträge)", VERSION, len(data.get("whiskies", [])))
    return True


async def _async_options_updated(hass: HomeAssistant, entry: ConfigEntry) -> None:
    new_key = (entry.options.get("ai_api_key") or "").strip()
    new_base = ((entry.options.get("ai_base_url") or "").strip() or AI_BASE_URL_DEFAULT).rstrip("/")
    hass.data[DOMAIN][entry.entry_id]["ai_key"] = new_key
    hass.data[DOMAIN][entry.entry_id]["ai_base_url"] = new_base
    # Key oder Endpunkt geändert → verfügbare Modelle neu entdecken
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
