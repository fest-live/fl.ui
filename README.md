# FL.UI

`@fest-lib/fl-ui` — Chromium-first shell UI: windows, taskbar, statusbar, app menu, quick settings, calendar flyout, toasts, and Speed Dial (home grid).

Styles default to Veela (optional peer). Native control chrome stays on `.btn` unless `includeGlobalNativeControlStyles` is on. Speed Dial tiles include square / circle / squircle / wavy / **shapeless** (icon-as-shape + silhouette shadow).

## Install

```bash
npm install @fest-lib/fl-ui
```

```ts
import { configureFlUI, loadFlUIGlobalNativeControlStyles } from "@fest-lib/fl-ui";

configureFlUI({ styleVariant: "veela-advanced" });
```

Dev: `npm run dev` → HTTPS on port 8434 (`?suite=explorer`, OPFS). HTTP-only: `npm run dev:http`.

## Layout

| Path | Role |
| --- | --- |
| `src/ui/containers/window/*` | window chrome |
| `src/ui/navigation/*` | taskbar, statusbar, app menu, flyouts |
| `src/ui/speed-dial/*` | home grid, icon picker, tile shapes |
| `src/styles/*` | SCSS (also `@fest-lib/fl-ui/styles`) |

Peers: `@fest-lib/core`, `dom`, `object`, `lure`, `uniform`; optional `veela`. Build: `npm run build`. Publish: `npm run publish`.
