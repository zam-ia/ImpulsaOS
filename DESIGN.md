# GrowthBrain Local Design System

This app borrows the useful parts of Impeccable without copying its editorial site skin. The product is an operational dashboard, so the design target is quieter: warm paper, graphite controls, scarce accent color, flat surfaces at rest, and motion only where it confirms state.

## Principles

1. The product is a desk, not a brochure.
2. Surfaces rest flat. Elevation appears on hover or focus.
3. One primary accent carries action. Semantic colors are fenced to statuses and QA.
4. Body copy stays readable at fixed sizes. Page titles can carry the editorial voice.
5. Motion must answer why: entry orientation, press feedback, status confirmation, or softened appearance.

## Tokens

- `ink`: warm graphite for text and primary CTAs.
- `paper`: warm page background.
- `moss`: primary product accent and active navigation.
- `coral`, `saffron`, `peacock`: operational status colors only.
- Radius: 4px for controls, 6-8px for panels and repeated items.
- Motion: `--ease-out-strong` for UI state, `--ease-in-out-strong` only for true on-screen movement.

## Anti-Patterns

- No purple-blue gradients.
- No glassmorphism.
- No dark dashboard glow.
- No decorative orbs.
- No nested hero cards.
- No `transition: all`.
- No animation on high-frequency keyboard actions.
- No shadow on resting panels unless the surface requires separation from busy content.

## Current Implementation Notes

- Buttons scale to `0.97` on press.
- Hover motion is gated behind pointer/hover media queries.
- `prefers-reduced-motion` collapses non-essential movement.
- Lists use short stagger delays of 35ms.
- Page headers use the editorial serif voice; dense dashboard content remains sans.
