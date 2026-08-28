<p align="center">
  <strong>@fest-lib/fl-ui</strong><br>
  Chromium-first shell UI: windows, taskbar, App Menu, flyouts, toasts, Speed Dial.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@fest-lib/fl-ui"><img src="https://img.shields.io/npm/v/@fest-lib/fl-ui?style=flat-square" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/npm/l/@fest-lib/fl-ui?style=flat-square" alt="MIT"></a>
  <a href="https://github.com/fest-live/fl.ui"><img src="https://img.shields.io/github/stars/fest-live/fl.ui?style=flat-square" alt="stars"></a>
</p>

Styles default to Veela (optional peer). Native control chrome stays on `.btn` unless you opt into host-wide rules. Speed Dial tiles: square / circle / squircle / wavy / **shapeless** (icon-as-shape + silhouette).

```text
core · dom · object · lure · uniform · veela?
 └── fest/fl-ui       ← you are here
      └── environment-shell · CWSP-shell
```

## Install

```bash
npm install @fest-lib/core @fest-lib/dom @fest-lib/object @fest-lib/uniform @fest-lib/lure @fest-lib/fl-ui
npm install @fest-lib/veela   # optional, recommended
```

Call `configureFlUI` **before** importing chrome if you need a non-default variant:

```ts
import { configureFlUI, loadFlUIGlobalNativeControlStyles, getFlUIConfig } from "@fest-lib/fl-ui";

configureFlUI({
    styleVariant: "veela-advanced",       // or "veela-basic"
    includeGlobalNativeControlStyles: false,
    loadStyles: true
});

// later, legacy document-wide inputs:
await loadFlUIGlobalNativeControlStyles();
```

The package auto-loads its SCSS via `@fest-lib/dom` `loadInlineStyle` unless `loadStyles: false`.

### SCSS subpaths

```scss
@use "@fest-lib/fl-ui/styles";
@use "@fest-lib/fl-ui/styles/core";
@use "@fest-lib/fl-ui/styles/lib";
```

## Surfaces (this package)

| Area | Path |
| --- | --- |
| Windows / modal | `src/ui/containers/*` |
| Taskbar, statusbar, App Menu, calendar, QS | `src/ui/navigation/*` |
| Speed Dial, icon picker, tile shapes | `src/ui/speed-dial/*` |
| Toasts | `src/misc/Toast.ts` |

App Menu (CWSP-shell): app info, Android settings, edit launch, uninstall. Speed Dial keeps icon and label layers separate over persisted cells.

Overlays must use LUR.E `TriggerCore` / `bindOutsideDismiss` / `resolvePlacement` and Veela tokens — do not invent a second palette.

## Dev playground

```bash
cd modules/projects/fl.ui
npm run dev              # HTTPS, port 8434 (`?suite=explorer`, OPFS)
npm run dev:http         # HTTP only
npm run dev:8434
npm run build
npm run publish
```

Browser checks live under `test/` (`workspace-snapshot`, `modal-lifecycle`, `chrome-flyout-lifecycle`, `form-binding-lifecycle`, playground suites). License: [MIT](LICENSE).
