[**@fest-lib/fl-ui v0.1.10**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / Windows2

# Class: Windows2

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:61

Draggable window chrome: titlebar + content + footer slots, standard window controls.

INVARIANT: when `managed` is set, the host shell owns left/top/width/height/z;
chrome emits `window-move` / `window-resize` / `window-focus` / max|min|close intents.

INVARIANT (`native-mode`): when WCO is visible, OS owns min/max/close — custom buttons hide;
titlebar uses CSS `window-drag` / `app-region` instead of JS pointer-drag.

## Extends

- [`UIElement`](UIElement.md)

## Constructors

### Constructor

```ts
new Windows2(): Windows2;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:127

#### Returns

`Windows2`

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

### contentHandler?

```ts
optional contentHandler?: HTMLElement;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:63

***

### footerHandler?

```ts
optional footerHandler?: HTMLElement;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:64

***

### initialAttributes?

```ts
optional initialAttributes?: Record<string, any> | (() => Record<string, any>);
```

Defined in: lur.e/src/lure/misc/Glit.ts:141

#### Inherited from

[`UIElement`](UIElement.md).[`initialAttributes`](UIElement.md#initialattributes)

***

### render

```ts
render: (this) => any;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:84

#### Parameters

##### this

`Windows2`

#### Returns

`any`

#### Overrides

[`UIElement`](UIElement.md).[`render`](UIElement.md#render)

***

### resizer?

```ts
optional resizer?: HTMLElement;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:65

***

### styleLibs

```ts
styleLibs: HTMLStyleElement[];
```

Defined in: lur.e/src/lure/misc/Glit.ts:142

#### Inherited from

[`UIElement`](UIElement.md).[`styleLibs`](UIElement.md#stylelibs)

***

### styles

```ts
styles: () => CSSStyleSheet | null;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:83

#### Returns

`CSSStyleSheet` \| `null`

#### Overrides

[`UIElement`](UIElement.md).[`styles`](UIElement.md#styles)

***

### theme

```ts
theme: string = "default";
```

Defined in: fl.ui/src/ui/base/UIElement.ts:8

#### Inherited from

[`UIElement`](UIElement.md).[`theme`](UIElement.md#theme)

***

### titleHandler?

```ts
optional titleHandler?: HTMLElement;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:62

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

## Accessors

### isMaximized

#### Get Signature

```ts
get isMaximized(): boolean;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:354

##### Returns

`boolean`

***

### isMinimized

#### Get Signature

```ts
get isMinimized(): boolean;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:363

##### Returns

`boolean`

***

### managed

#### Get Signature

```ts
get managed(): boolean;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:132

Shell-driven chrome: position/size come from host CSS, not transform.

##### Returns

`boolean`

***

### nativeMode

#### Get Signature

```ts
get nativeMode(): boolean;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:137

Host requested mono/task native chrome (WCO / standalone / fallback full-bleed).

##### Returns

`boolean`

#### Set Signature

```ts
set nativeMode(value): void;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:141

##### Parameters

###### value

`boolean`

##### Returns

`void`

***

### nativeSurface

#### Get Signature

```ts
get nativeSurface(): "standalone" | "off" | "wco" | "fallback";
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:146

##### Returns

`"standalone"` \| `"off"` \| `"wco"` \| `"fallback"`

***

### usesNativeWindowDrag

#### Get Signature

```ts
get usesNativeWindowDrag(): boolean;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:368

True when CSS window-drag owns titlebar (WCO / installed standalone).

##### Returns

`boolean`

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
optional adoptedCallback(): void | Windows2 | undefined;
```

Defined in: lur.e/src/lure/misc/Glit.ts:119

#### Returns

`void` \| `Windows2` \| `undefined`

#### Inherited from

[`UIElement`](UIElement.md).[`adoptedCallback`](UIElement.md#adoptedcallback)

***

### applyBounds()

```ts
applyBounds(bounds): void;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:325

Apply absolute bounds (managed shells / workspace layer).

#### Parameters

##### bounds

`Partial`\<[`UiWindowBounds`](../type-aliases/UiWindowBounds.md)\> & `object`

#### Returns

`void`

***

### attributeChangedCallback()?

```ts
optional attributeChangedCallback(
   name, 
   oldValue, 
   newValue): void | Windows2 | undefined;
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

`void` \| `Windows2` \| `undefined`

#### Inherited from

[`UIElement`](UIElement.md).[`attributeChangedCallback`](UIElement.md#attributechangedcallback)

***

### bringToFront()

```ts
bringToFront(z): void;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:463

#### Parameters

##### z

`number`

#### Returns

`void`

***

### clearFocused()

```ts
clearFocused(): void;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:469

#### Returns

`void`

***

### closeWindow()

```ts
closeWindow(): void;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:440

#### Returns

`void`

***

### connectedCallback()

```ts
connectedCallback(): void;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:159

#### Returns

`void`

#### Overrides

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

### disconnectedCallback()

```ts
disconnectedCallback(): void;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:165

#### Returns

`void`

#### Overrides

[`UIElement`](UIElement.md).[`disconnectedCallback`](UIElement.md#disconnectedcallback)

***

### enterNativeMode()

```ts
enterNativeMode(): void;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:377

Enter/exit native-mode. Managed hosts should listen for `window-native` /
`window-exit-native` instead of mutating attrs directly when preferred.

#### Returns

`void`

***

### exitNativeMode()

```ts
exitNativeMode(): void;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:386

#### Returns

`void`

***

### loadStyleLibrary()

```ts
loadStyleLibrary(module): void | Windows2 | undefined;
```

Defined in: lur.e/src/lure/misc/Glit.ts:148

#### Parameters

##### module

`any`

#### Returns

`void` \| `Windows2` \| `undefined`

#### Inherited from

[`UIElement`](UIElement.md).[`loadStyleLibrary`](UIElement.md#loadstylelibrary)

***

### onInitialize()

```ts
onInitialize(): void;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:150

#### Returns

`void`

#### Overrides

[`UIElement`](UIElement.md).[`onInitialize`](UIElement.md#oninitialize)

***

### onRender()

```ts
onRender(): void;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:154

#### Returns

`void`

#### Overrides

[`UIElement`](UIElement.md).[`onRender`](UIElement.md#onrender)

***

### requestFocus()

```ts
requestFocus(): void;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:459

#### Returns

`void`

***

### restoreWindow()

```ts
restoreWindow(): void;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:428

#### Returns

`void`

***

### setVisible()

```ts
setVisible(visible): void;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:348

#### Parameters

##### visible

`boolean`

#### Returns

`void`

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

### toggleMaximize()

```ts
toggleMaximize(): void;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:404

WHY (managed): only emit intent — environment-shell owns attrs via applyChrome.

#### Returns

`void`

***

### toggleMinimize()

```ts
toggleMinimize(): void;
```

Defined in: fl.ui/src/ui/containers/window/Windows2.ts:417

#### Returns

`void`
