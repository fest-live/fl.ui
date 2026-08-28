[**@fest-lib/fl-ui v0.1.19**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / QuickSettings

# Class: QuickSettings

Defined in: fl.ui/src/ui/navigation/settings/QuickSettings.ts:411

Win11-like Quick Settings flyout: theme toggle + placeholder tiles + night/brightness sliders.

INVARIANT: instance `open()`/`close()`/`toggle()` only flip local visibility state
(`hidden` + `open` attribute) — the shared exclusivity/singleton/positioning contract
lives in the module-level [toggleQuickSettingsFlyout](../functions/toggleQuickSettingsFlyout.md) / [closeQuickSettingsFlyout](../functions/closeQuickSettingsFlyout.md)
helpers, which wrap `ChromeFlyout` (mirrors `CalendarFlyout.ts`).

## Extends

- [`UIElement`](UIElement.md)

## Constructors

### Constructor

```ts
new QuickSettings(): QuickSettings;
```

Defined in: fl.ui/src/ui/navigation/settings/QuickSettings.ts:412

#### Returns

`QuickSettings`

#### Overrides

[`UIElement`](UIElement.md).[`constructor`](UIElement.md#constructor)

## Properties

### adoptedStyleSheets

```ts
adoptedStyleSheets: CSSStyleSheet[];
```

Defined in: lur.e/src/lure/misc/Glit.ts:143

#### Inherited from

[`UIElement`](UIElement.md).[`adoptedStyleSheets`](UIElement.md#adoptedstylesheets)

***

### initialAttributes?

```ts
optional initialAttributes?: Record<string, any> | (() => Record<string, any>);
```

Defined in: lur.e/src/lure/misc/Glit.ts:141

#### Inherited from

[`UIElement`](UIElement.md).[`initialAttributes`](UIElement.md#initialattributes)

***

### styleLibs

```ts
styleLibs: HTMLStyleElement[];
```

Defined in: lur.e/src/lure/misc/Glit.ts:142

#### Inherited from

[`UIElement`](UIElement.md).[`styleLibs`](UIElement.md#stylelibs)

***

### theme

```ts
theme: string = "default";
```

Defined in: fl.ui/src/ui/base/UIElement.ts:8

#### Inherited from

[`UIElement`](UIElement.md).[`theme`](UIElement.md#theme)

***

### formAssociated?

```ts
static optional formAssociated?: boolean;
```

Defined in: lur.e/src/lure/misc/Glit.ts:128

#### Inherited from

[`UIElement`](UIElement.md).[`formAssociated`](UIElement.md#formassociated)

***

### observedAttributes?

```ts
static optional observedAttributes?: string[];
```

Defined in: lur.e/src/lure/misc/Glit.ts:127

#### Inherited from

[`UIElement`](UIElement.md).[`observedAttributes`](UIElement.md#observedattributes)

## Methods

### $init()?

```ts
optional $init(): void;
```

Defined in: lur.e/src/lure/misc/Glit.ts:150

#### Returns

`void`

#### Inherited from

[`UIElement`](UIElement.md).[`$init`](UIElement.md#init)

***

### adoptedCallback()?

```ts
optional adoptedCallback(): void | QuickSettings | undefined;
```

Defined in: lur.e/src/lure/misc/Glit.ts:119

#### Returns

`void` \| `QuickSettings` \| `undefined`

#### Inherited from

[`UIElement`](UIElement.md).[`adoptedCallback`](UIElement.md#adoptedcallback)

***

### attributeChangedCallback()?

```ts
optional attributeChangedCallback(
   name, 
   oldValue, 
   newValue): void | QuickSettings | undefined;
```

Defined in: lur.e/src/lure/misc/Glit.ts:120

#### Parameters

##### name

`string`

##### oldValue

`string` \| `null`

##### newValue

`string` \| `null`

#### Returns

`void` \| `QuickSettings` \| `undefined`

#### Inherited from

[`UIElement`](UIElement.md).[`attributeChangedCallback`](UIElement.md#attributechangedcallback)

***

### close()

```ts
close(): void;
```

Defined in: fl.ui/src/ui/navigation/settings/QuickSettings.ts:504

#### Returns

`void`

***

### connectedCallback()

```ts
connectedCallback(): this;
```

Defined in: fl.ui/src/ui/base/UIElement.ts:22

#### Returns

`this`

#### Inherited from

[`UIElement`](UIElement.md).[`connectedCallback`](UIElement.md#connectedcallback)

***

### createShadowRoot()

```ts
createShadowRoot(): ShadowRoot;
```

Defined in: lur.e/src/lure/misc/Glit.ts:149

#### Returns

`ShadowRoot`

#### Inherited from

[`UIElement`](UIElement.md).[`createShadowRoot`](UIElement.md#createshadowroot)

***

### disconnectedCallback()?

```ts
optional disconnectedCallback(): void | QuickSettings | undefined;
```

Defined in: lur.e/src/lure/misc/Glit.ts:118

#### Returns

`void` \| `QuickSettings` \| `undefined`

#### Inherited from

[`UIElement`](UIElement.md).[`disconnectedCallback`](UIElement.md#disconnectedcallback)

***

### loadStyleLibrary()

```ts
loadStyleLibrary(module): void | QuickSettings | undefined;
```

Defined in: lur.e/src/lure/misc/Glit.ts:148

#### Parameters

##### module

`any`

#### Returns

`void` \| `QuickSettings` \| `undefined`

#### Inherited from

[`UIElement`](UIElement.md).[`loadStyleLibrary`](UIElement.md#loadstylelibrary)

***

### onInitialize()

```ts
onInitialize(): this;
```

Defined in: fl.ui/src/ui/base/UIElement.ts:29

#### Returns

`this`

#### Inherited from

[`UIElement`](UIElement.md).[`onInitialize`](UIElement.md#oninitialize)

***

### onRender()

```ts
onRender(): this;
```

Defined in: fl.ui/src/ui/navigation/settings/QuickSettings.ts:491

#### Returns

`this`

#### Overrides

[`UIElement`](UIElement.md).[`onRender`](UIElement.md#onrender)

***

### open()

```ts
open(): void;
```

Defined in: fl.ui/src/ui/navigation/settings/QuickSettings.ts:497

#### Returns

`void`

***

### render()

```ts
render(): any;
```

Defined in: fl.ui/src/ui/navigation/settings/QuickSettings.ts:416

#### Returns

`any`

#### Overrides

```ts
UIElement.render
```

***

### styleLayers()

```ts
styleLayers(): string[];
```

Defined in: lur.e/src/lure/misc/Glit.ts:144

#### Returns

`string`[]

#### Inherited from

[`UIElement`](UIElement.md).[`styleLayers`](UIElement.md#stylelayers)

***

### styles()

```ts
styles(): any;
```

Defined in: fl.ui/src/ui/navigation/settings/QuickSettings.ts:415

#### Returns

`any`

#### Overrides

```ts
UIElement.styles
```

***

### toggle()

```ts
toggle(anchor?): void;
```

Defined in: fl.ui/src/ui/navigation/settings/QuickSettings.ts:510

#### Parameters

##### anchor?

`HTMLElement` \| `null`

#### Returns

`void`
