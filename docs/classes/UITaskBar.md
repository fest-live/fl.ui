[**@fest-lib/fl-ui v0.1.13**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / UITaskBar

# Class: UITaskBar

Defined in: fl.ui/src/ui/navigation/taskbar/element/TaskBar.ts:54

## Extends

- [`UIElement`](UIElement.md)

## Constructors

### Constructor

```ts
new UITaskBar(): UITaskBar;
```

Defined in: fl.ui/src/ui/navigation/taskbar/element/TaskBar.ts:55

#### Returns

`UITaskBar`

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
optional adoptedCallback(): void | UITaskBar | undefined;
```

Defined in: lur.e/src/lure/misc/Glit.ts:119

#### Returns

`void` \| `UITaskBar` \| `undefined`

#### Inherited from

[`UIElement`](UIElement.md).[`adoptedCallback`](UIElement.md#adoptedcallback)

***

### attributeChangedCallback()?

```ts
optional attributeChangedCallback(
   name, 
   oldValue, 
   newValue): void | UITaskBar | undefined;
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

`void` \| `UITaskBar` \| `undefined`

#### Inherited from

[`UIElement`](UIElement.md).[`attributeChangedCallback`](UIElement.md#attributechangedcallback)

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
optional disconnectedCallback(): void | UITaskBar | undefined;
```

Defined in: lur.e/src/lure/misc/Glit.ts:118

#### Returns

`void` \| `UITaskBar` \| `undefined`

#### Inherited from

[`UIElement`](UIElement.md).[`disconnectedCallback`](UIElement.md#disconnectedcallback)

***

### loadStyleLibrary()

```ts
loadStyleLibrary(module): void | UITaskBar | undefined;
```

Defined in: lur.e/src/lure/misc/Glit.ts:148

#### Parameters

##### module

`any`

#### Returns

`void` \| `UITaskBar` \| `undefined`

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
onRender(): void | UITaskBar | undefined;
```

Defined in: fl.ui/src/ui/base/UIElement.ts:17

#### Returns

`void` \| `UITaskBar` \| `undefined`

#### Inherited from

[`UIElement`](UIElement.md).[`onRender`](UIElement.md#onrender)

***

### render()

```ts
render(): any;
```

Defined in: fl.ui/src/ui/navigation/taskbar/element/TaskBar.ts:57

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

Defined in: fl.ui/src/ui/navigation/taskbar/element/TaskBar.ts:56

#### Returns

`any`

#### Overrides

```ts
UIElement.styles
```
