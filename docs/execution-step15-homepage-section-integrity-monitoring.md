# Step 15 - Homepage Section Integrity Monitoring

Date: 2026-07-24
Status: Started
Depends on:
- execution-step10-soft-launch-telemetry.md
- execution-step14-empty-state-escalation.md

## Goal

Catch homepage section configuration issues at runtime and surface them as actionable monitoring signals.

## Implemented in this slice

1. Added runtime integrity checks for enabled homepage category sections.
2. Checks include:
- invalid section href format (must start with /)
- missing cover image on enabled sections
- duplicate order values among enabled sections
- no visible section state
3. Added dedupe guard to avoid repeated signal spam for same integrity state.
4. Added analytics event:
- homepage_category_section_integrity_issue
5. Added non-fatal incident forwarding with summarized issue counts.

## Why this matters

1. Detects broken homepage section states even if bad data exists from legacy or manual writes.
2. Gives launch-week operators faster visibility into category strip integrity.
3. Reduces silent homepage degradation risk.

## Acceptance targets

1. Integrity issue signal fires once per unique bad state.
2. Signal resets when section data returns to healthy state.
3. Existing homepage rendering behavior remains unchanged.
