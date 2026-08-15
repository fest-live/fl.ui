[**@fest-lib/fl-ui v0.1.11**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / NativeChromeSubscribeOptions

# Type Alias: NativeChromeSubscribeOptions

```ts
type NativeChromeSubscribeOptions = object;
```

Defined in: fl.ui/src/ui/containers/window/native-window-chrome.ts:122

## Properties

### getRequested

```ts
getRequested: () => boolean;
```

Defined in: fl.ui/src/ui/containers/window/native-window-chrome.ts:126

Whether host currently wants native-mode.

#### Returns

`boolean`

***

### onChange

```ts
onChange: (probe) => void;
```

Defined in: fl.ui/src/ui/containers/window/native-window-chrome.ts:124

Fired on WCO geometrychange + display-mode media changes.

#### Parameters

##### probe

[`NativeWindowChromeProbe`](NativeWindowChromeProbe.md)

#### Returns

`void`
