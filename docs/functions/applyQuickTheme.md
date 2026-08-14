[**@fest-lib/fl-ui v0.1.10**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / applyQuickTheme

# Function: applyQuickTheme()

```ts
function applyQuickTheme(mode): void;
```

Defined in: fl.ui/src/ui/navigation/settings/QuickSettings.ts:91

Apply light/dark from Quick Settings without importing app Theme.ts (fl.ui ↔ subsystem cycle).
WHY: Must mirror `syncBrowserChromeTheme` — `data-scheme` + hosts + body — or env-shell /
veela keep OS `prefers-color-scheme` / stale `data-scheme="auto"` and light never sticks.

## Parameters

### mode

[`QuickThemeMode`](../type-aliases/QuickThemeMode.md)

## Returns

`void`
