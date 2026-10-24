"""WhiskyDB config flow.

Based on the config flow of ha-whisky (Jérémie Silvent) and thus on
Millésime (Redsklns) — derivative projects, see LICENSE.
"""
from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.data_entry_flow import FlowResult

from . import AI_BASE_URL_DEFAULT, DOMAIN


def _clean_key(raw: str | None) -> str:
    """Cleans a pasted API key (whitespace, copied quotes)."""
    key = (raw or "").strip()
    if len(key) >= 2 and key[0] in "\"'" and key[-1] in "\"'":
        key = key[1:-1].strip()
    return key


def _clean_base(raw: str | None) -> str:
    """Cleans the endpoint URL (whitespace, trailing slash)."""
    return ((raw or "").strip() or AI_BASE_URL_DEFAULT).rstrip("/")


def _key_looks_invalid(key: str) -> bool:
    """Lenient check: the key is only rejected on obvious errors."""
    if not key:
        return False  # empty = no key, allowed (manual entry only)
    if any(c.isspace() for c in key):
        return True
    if len(key) < 20:
        return True
    return False


class WhiskyDBConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Config flow for WhiskyDB."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """First setup step."""
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        errors: dict[str, str] = {}

        if user_input is not None:
            key = _clean_key(user_input.get("ai_api_key"))
            if _key_looks_invalid(key):
                errors["ai_api_key"] = "invalid_key"
            else:
                user_input["ai_api_key"] = key
                user_input["ai_base_url"] = _clean_base(user_input.get("ai_base_url"))
                return self.async_create_entry(
                    title=user_input.get("collection_name", "WhiskyDB"),
                    data=user_input,
                )

        return self.async_show_form(
            step_id="user",
            errors=errors,
            data_schema=vol.Schema({
                vol.Required("collection_name", default="WhiskyDB"): str,
                vol.Optional("ai_api_key", default=""): str,
                vol.Optional("ai_base_url", default=AI_BASE_URL_DEFAULT): str,
            }),
        )

    @staticmethod
    def async_get_options_flow(config_entry):
        """Returns the options flow (change key/endpoint after setup)."""
        return WhiskyDBOptionsFlow(config_entry)


class WhiskyDBOptionsFlow(config_entries.OptionsFlow):
    """Allows changing the API key and AI endpoint after setup."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        self._config_entry = config_entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        errors: dict[str, str] = {}

        if user_input is not None:
            key = _clean_key(user_input.get("ai_api_key"))
            if _key_looks_invalid(key):
                errors["ai_api_key"] = "invalid_key"
            else:
                return self.async_create_entry(
                    title="",
                    data={
                        "ai_api_key": key,
                        "ai_base_url": _clean_base(user_input.get("ai_base_url")),
                    },
                )

        current_key = self._config_entry.options.get(
            "ai_api_key",
            self._config_entry.data.get("ai_api_key", ""),
        )
        current_base = self._config_entry.options.get(
            "ai_base_url",
            self._config_entry.data.get("ai_base_url", AI_BASE_URL_DEFAULT),
        )

        return self.async_show_form(
            step_id="init",
            errors=errors,
            data_schema=vol.Schema({
                vol.Optional("ai_api_key", default=current_key): str,
                vol.Optional("ai_base_url", default=current_base): str,
            }),
        )
