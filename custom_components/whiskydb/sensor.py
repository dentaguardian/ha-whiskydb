"""WhiskyDB sensors — seven global sensors.

  sensor.whiskydb_total              total number of bottles (physical copies)
  sensor.whiskydb_opened             opened bottles (+ "bottles" attribute:
                                     per-bottle detail with days open, for
                                     automations)
  sensor.whiskydb_sealed             sealed bottles
  sensor.whiskydb_finished           finished bottles
  sensor.whiskydb_distilleries       number of distinct distilleries represented
  sensor.whiskydb_collection_value    value of the REMAINING STOCK (sealed +
                                     opened; "finished" bottles have no
                                     residual value and are excluded from the
                                     total)
  sensor.whiskydb_average_age         average age (years), per RECORD (not
                                     weighted by bottle count); records
                                     without a numeric age are ignored

No per-collection sensors for now (most installations use a single
collection) — can be added later, following Millésime's multi-cellar model,
if the need arises.
"""
from __future__ import annotations

from datetime import date

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import DOMAIN

# Maximum number of detail keys per breakdown attribute (country, region,
# distillery, type, peat) — avoids a disproportionate state/attribute size on
# very large collections; beyond this, only the most represented values are
# kept (HA best practice on attribute size).
_MAX_BREAKDOWN_KEYS = 25


def _whiskies(data: dict) -> list[dict]:
    return data.get("whiskies", []) or []


def _all_slots(data: dict) -> list[tuple[dict, dict]]:
    """(whisky, slot) for each physical bottle, across all records."""
    return [(w, s) for w in _whiskies(data) for s in w.get("slots", [])]


def _count_by_status(data: dict, status: str) -> int:
    return sum(1 for _w, s in _all_slots(data) if s.get("bottle_status", "sealed") == status)


def _breakdown(data: dict, key_fn) -> dict[str, int]:
    """Breakdown {key: bottle count}, sorted by frequency, bounded."""
    counts: dict[str, int] = {}
    for w in _whiskies(data):
        key = key_fn(w)
        if not key:
            continue
        n = len(w.get("slots", []))
        counts[key] = counts.get(key, 0) + n
    top = dict(sorted(counts.items(), key=lambda kv: -kv[1])[:_MAX_BREAKDOWN_KEYS])
    return top


def _opened_bottles(data: dict) -> list[dict]:
    """Detail of the currently OPENED bottles, with days open.

    Exposed as an attribute of sensor.whiskydb_opened (not as one entity per
    bottle, to keep the entity count manageable on large collections) to
    enable automations based on how long a bottle has been open — e.g.
    "notify me if a bottle opened more than 6 months ago is still not
    finished" via a Jinja template reading
    state_attr('sensor.whiskydb_opened', 'bottles') |
    selectattr('days_open', 'gt', 180).
    Sorted by age, oldest first (the most common use case).
    """
    today = date.today()
    out: list[dict] = []
    for w in _whiskies(data):
        for idx, s in enumerate(w.get("slots", [])):
            if s.get("bottle_status") != "opened":
                continue
            opened_date = s.get("opened_date")
            days_open = None
            if opened_date:
                try:
                    days_open = (today - date.fromisoformat(str(opened_date)[:10])).days
                except ValueError:
                    days_open = None
            out.append({
                "whisky_id": w.get("id"),
                "name": w.get("name", ""),
                "slot_idx": idx,
                "opened_date": opened_date,
                "days_open": days_open,
                "remaining_percent": s.get("remaining_percent"),
            })
    out.sort(key=lambda b: (b["days_open"] is None, -(b["days_open"] or 0)))
    return out


def _collection_value(data: dict) -> float:
    total = 0.0
    for w in _whiskies(data):
        unit = float(w.get("current_value") or 0) or float(w.get("price") or 0)
        if unit <= 0:
            continue
        n = sum(1 for s in w.get("slots", []) if s.get("bottle_status", "sealed") != "finished")
        total += unit * n
    return round(total, 2)


def _average_age(data: dict) -> float:
    ages = []
    for w in _whiskies(data):
        raw = (w.get("whisky_meta") or {}).get("age", "")
        try:
            age = float(str(raw).strip())
        except (TypeError, ValueError):
            continue
        if age > 0:
            ages.append(age)
    return round(sum(ages) / len(ages), 1) if ages else 0.0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Sets up the seven global WhiskyDB sensors."""
    entry_data = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([
        WhiskyTotalSensor(hass, entry, entry_data),
        WhiskyOpenedSensor(hass, entry, entry_data),
        WhiskySealedSensor(hass, entry, entry_data),
        WhiskyFinishedSensor(hass, entry, entry_data),
        WhiskyDistilleriesSensor(hass, entry, entry_data),
        WhiskyCollectionValueSensor(hass, entry, entry_data),
        WhiskyAverageAgeSensor(hass, entry, entry_data),
    ], True)


class WhiskyBaseSensor(SensorEntity):
    """Base WhiskyDB sensor: updates on the whisky_updated event.

    Each subclass explicitly sets `self.entity_id` (in addition to
    `_attr_unique_id`): without this, Home Assistant derives the entity_id
    from the DISPLAYED name (translated via _attr_translation_key from
    translations/), not from the unique_id — which would yield a translated
    entity_id instead of the stable `sensor.whiskydb_collection_value` used
    throughout the documentation and the example automations.
    """

    _attr_should_poll = False

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry, entry_data: dict) -> None:
        self.hass = hass
        self._entry = entry
        self._ed = entry_data

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(
            self.hass.bus.async_listen(f"{DOMAIN}_updated", self._on_update)
        )

    @callback
    def _on_update(self, _event) -> None:
        self._ed["data"] = self.hass.data[DOMAIN][self._entry.entry_id]["data"]
        self.async_write_ha_state()

    @property
    def _data(self) -> dict:
        return self._ed["data"]


class WhiskyTotalSensor(WhiskyBaseSensor):
    """Total number of bottles (physical copies), across all statuses."""

    _attr_icon = "mdi:bottle-tonic"
    _attr_native_unit_of_measurement = "bottles"

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._attr_unique_id = f"{DOMAIN}_total"
        self._attr_translation_key = f"{DOMAIN}_total"
        self.entity_id = f"sensor.{self._attr_unique_id}"

    @property
    def native_value(self) -> int:
        return len(_all_slots(self._data))

    @property
    def extra_state_attributes(self) -> dict:
        d = self._data
        return {
            "references": len(_whiskies(d)),
            "by_country":    _breakdown(d, lambda w: (w.get("whisky_meta") or {}).get("country", "")),
            "by_region":     _breakdown(d, lambda w: (w.get("whisky_meta") or {}).get("region", "")),
            "by_distillery": _breakdown(d, lambda w: (w.get("whisky_meta") or {}).get("distillery", "")),
            "by_type":       _breakdown(d, lambda w: (w.get("whisky_meta") or {}).get("whisky_type", "")),
            "by_peat":       _breakdown(d, lambda w: (
                "peated" if (w.get("whisky_meta") or {}).get("peated") is True
                else "not peated" if (w.get("whisky_meta") or {}).get("peated") is False
                else "unspecified"
            )),
        }


class WhiskyOpenedSensor(WhiskyBaseSensor):
    """Number of opened bottles."""

    _attr_icon = "mdi:bottle-tonic-outline"
    _attr_native_unit_of_measurement = "bottles"

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._attr_unique_id = f"{DOMAIN}_opened"
        self._attr_translation_key = f"{DOMAIN}_opened"
        self.entity_id = f"sensor.{self._attr_unique_id}"

    @property
    def native_value(self) -> int:
        return _count_by_status(self._data, "opened")

    @property
    def extra_state_attributes(self) -> dict:
        return {"bottles": _opened_bottles(self._data)}


class WhiskySealedSensor(WhiskyBaseSensor):
    """Number of sealed bottles (never opened)."""

    _attr_icon = "mdi:bottle-tonic-plus"
    _attr_native_unit_of_measurement = "bottles"

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._attr_unique_id = f"{DOMAIN}_sealed"
        self._attr_translation_key = f"{DOMAIN}_sealed"
        self.entity_id = f"sensor.{self._attr_unique_id}"

    @property
    def native_value(self) -> int:
        return _count_by_status(self._data, "sealed")


class WhiskyFinishedSensor(WhiskyBaseSensor):
    """Number of finished bottles."""

    _attr_icon = "mdi:bottle-tonic-skull"
    _attr_native_unit_of_measurement = "bottles"

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._attr_unique_id = f"{DOMAIN}_finished"
        self._attr_translation_key = f"{DOMAIN}_finished"
        self.entity_id = f"sensor.{self._attr_unique_id}"

    @property
    def native_value(self) -> int:
        return _count_by_status(self._data, "finished")


class WhiskyDistilleriesSensor(WhiskyBaseSensor):
    """Number of distinct distilleries represented in the collection."""

    _attr_icon = "mdi:factory"

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._attr_unique_id = f"{DOMAIN}_distilleries"
        self._attr_translation_key = f"{DOMAIN}_distilleries"
        self.entity_id = f"sensor.{self._attr_unique_id}"

    @property
    def native_value(self) -> int:
        names = {
            (w.get("whisky_meta") or {}).get("distillery", "").strip().lower()
            for w in _whiskies(self._data)
            if (w.get("whisky_meta") or {}).get("distillery", "").strip()
        }
        return len(names)


class WhiskyCollectionValueSensor(WhiskyBaseSensor):
    """Value of the remaining stock (sealed + opened bottles, finished excluded)."""

    _attr_icon = "mdi:currency-eur"
    _attr_native_unit_of_measurement = "€"

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._attr_unique_id = f"{DOMAIN}_collection_value"
        self._attr_translation_key = f"{DOMAIN}_collection_value"
        self.entity_id = f"sensor.{self._attr_unique_id}"

    @property
    def native_value(self) -> float:
        return _collection_value(self._data)

    @property
    def extra_state_attributes(self) -> dict:
        d = self._data
        n = len(_whiskies(d))
        avg = round(self.native_value / n, 2) if n else 0.0
        return {"average_price": avg}


class WhiskyAverageAgeSensor(WhiskyBaseSensor):
    """Average age of the collection's whiskies (per record, declared years only)."""

    _attr_icon = "mdi:calendar-clock"
    _attr_native_unit_of_measurement = "years"

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._attr_unique_id = f"{DOMAIN}_average_age"
        self._attr_translation_key = f"{DOMAIN}_average_age"
        self.entity_id = f"sensor.{self._attr_unique_id}"

    @property
    def native_value(self) -> float:
        return _average_age(self._data)
