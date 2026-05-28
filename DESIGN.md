# ImpulsaOS Design System VIP

Operational dashboard with Figma-like surfaces, rounded controls, day/night modes, and controlled motion. The app uses CSS tokens first, then Tailwind utility classes over those tokens.

## Color Tokens

| Token | Day | Night | Use |
| --- | --- | --- | --- |
| `--rgb-ink` | `22 24 29` | `240 243 248` | Text, primary CTA |
| `--rgb-paper` | `247 248 251` | `10 12 18` | App background |
| `--rgb-surface` | `255 255 255` | `17 20 29` | Panels, modals, inputs |
| `--rgb-line` | `225 229 235` | `48 54 69` | Borders |
| `--rgb-violet` | `111 76 255` | `149 116 255` | Focus/glow/accent |
| `--rgb-success` | `38 159 107` | `58 205 138` | Approved/success |
| `--rgb-error` | `222 83 72` | `255 104 94` | Rejected/error |
| `--rgb-warning` | `230 166 61` | `255 190 89` | Review/warning |

## Shadows And Glow

| Token | Day | Night |
| --- | --- | --- |
| `--shadow-sm` | `0 1px 2px rgba(15, 23, 42, 0.06)` | `0 1px 2px rgba(0, 0, 0, 0.45)` |
| `--shadow-md` | `0 8px 24px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.06)` | `0 10px 30px rgba(0, 0, 0, 0.38)` |
| `--shadow-lg` | `0 18px 48px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.08)` | `0 20px 56px rgba(0, 0, 0, 0.46)` |
| `--shadow-xl` | `0 28px 80px rgba(15, 23, 42, 0.18), 0 8px 24px rgba(15, 23, 42, 0.10)` | `0 32px 90px rgba(0, 0, 0, 0.58)` |
| `--glow-violet` | none | `0 0 34px rgba(149, 116, 255, 0.36)` |
| `--glow-success` | none | `0 0 24px rgba(58, 205, 138, 0.28)` |
| `--glow-error` | none | `0 0 24px rgba(255, 104, 94, 0.30)` |
| `--glow-warning` | none | `0 0 24px rgba(255, 190, 89, 0.28)` |

## Layout Tokens

Spacing: `--space-1`, `--space-2`, `--space-3`, `--space-4`, `--space-5`, `--space-6`, `--space-8`, `--space-10`, `--space-12`, `--space-16`.

Radius: `--radius-xs`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`.

## Components

Buttons: `btn-primary`, `btn-secondary`, `btn-danger`, `btn-ghost`, `btn-soft`, `btn-outline`, `btn-violet`. All press to `scale(0.97)` and animate exact properties only.

Modals: centered, blurred overlay, `md/lg/xl` sizes, Escape close, body scroll lock, `motion-panel` entry.

Dropdowns: `dropdown-panel` for standard dropdown, combobox and multi-select shells.

Tables: `data-table` supports zebra rows, hover state, and `skeleton` loaders.

Toasts: `toast-success`, `toast-error`, `toast-warning`, `toast-info`; night mode uses semantic glow.

## Theme And Navigation

Theme preference supports `system`, `light`, and `dark`. The Sol/Luna toggle writes to app state, which persists in localStorage. Supabase persistence is prepared in `supabase/migrations/0005_app_settings.sql`.

Sidebar has expanded `240px` and collapsed `64px` states with `--ease-drawer`. Module names are configurable from `Business > Interfaz y modulos`.
