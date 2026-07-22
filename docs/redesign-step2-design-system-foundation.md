# SHIS Re-Design Step 2: Design System Foundation

Date: 2026-07-23
Priority: Mobile-first

## 1) Deliverable Scope
This step establishes reusable foundation tokens and global style rules for the redesign.

Implemented artifacts:
- Reusable tokens file: src/styles/design-system.css
- Global consumption layer: src/index.css

## 2) Typography Scale
Locked typography roles:
- H1: var(--fs-h1) = clamp(2.125rem, 7vw, 3.5rem)
- H2: var(--fs-h2) = clamp(1.625rem, 5.3vw, 2.5rem)
- Body: var(--fs-body) = 1rem
- Caption: var(--fs-caption) = 0.75rem

Font families:
- Display headings: var(--font-display)
- Body and UI text: var(--font-sans)

All-black hierarchy rule:
- Color remains black-first for primary text.
- Hierarchy is created by weight and size, not color variation.
- Weights:
  - --fw-regular: 400
  - --fw-medium: 500
  - --fw-semibold: 600
  - --fw-bold: 700

## 3) Spacing System
Base rhythm (locked):
- 4px => --space-1
- 8px => --space-2
- 12px => --space-3
- 16px => --space-4
- 24px => --space-6

Usage guideline:
- Use token steps only for vertical and horizontal rhythm.
- Prefer 8/12/16 for component internals and 24 for section spacing breaks.

## 4) UI Tokens
Color tokens:
- --color-bg: #ffffff
- --color-surface: #ffffff
- --color-text: #000000
- --color-muted: #4a4a4a
- --color-border: #e6e6e6
- --color-accent: #000000

Radius tokens (minimal):
- --radius-none: 0
- --radius-sm: 4px
- --radius-md: 8px

Border style policy (mostly none):
- Default visual preference: no heavy border framing.
- Optional subtle divider: --border-subtle
- None token: --border-none

## 5) Interaction Style Spec
Locked interaction behavior:
- Subtle hover only (no dramatic movement/shadows)
- Clean transitions using shared timing tokens
- No heavy visual effects

Transition tokens:
- --transition-fast: 180ms
- --transition-base: 220ms
- --ease-standard: cubic-bezier(0.4, 0, 0.2, 1)

Global interaction helper:
- .ui-interactive

Focus styling:
- Inputs use restrained focus ring and black-first border focus.

## 6) Global Style Rules
- White global background is enforced.
- Black typography hierarchy is enforced.
- Heading rendering uses display face + semibold weight.
- Page transition motion is short and subtle.
- Media tonal filter remains light-touch for consistency.

## 7) Engineering Usage Notes
- New UI components should consume tokens via var(...).
- Avoid hardcoding one-off sizes/colors unless explicitly approved.
- Preserve cardless product presentation and image-first composition from Step 1.

## 8) Acceptance Checklist
- Typography scale includes H1/H2/body/caption.
- Hierarchy is black-first and weight-driven.
- Spacing system follows 4/8/12/16/24 rhythm.
- UI tokens defined for color/radius/border/interaction.
- Interaction remains subtle with clean transitions.
