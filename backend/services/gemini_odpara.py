"""
services/gemini_odpara.py

Compatibility forwarder for services/gemma_odpara.py.
Clinical triage extraction engine migrated from Gemini to AMD Token Factory Gemma (Gemma-4-31B-IT).
"""
from services.gemma_odpara import (
    ODPARA_JSON_SCHEMA,
    extract_odpara_metrics,
    _apply_threshold_safety_net,
    _build_system_prompt,
    _defensive_fallback,
)

__all__ = [
    "ODPARA_JSON_SCHEMA",
    "extract_odpara_metrics",
    "_apply_threshold_safety_net",
    "_build_system_prompt",
    "_defensive_fallback",
]
