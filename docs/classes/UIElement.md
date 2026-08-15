[**@fest-lib/fl-ui v0.1.11**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / UIElement

# Class: UIElement

Defined in: fl.ui/src/ui/base/UIElement.ts:7

## Extends

- `HTMLElement`\<`this`\> & `GLitElementInstance`\<`this`\> & `CustomElementLifecycle`\<`this`\>

## Extended by

- [`StatusBar`](StatusBar.md)
- [`UITaskBar`](UITaskBar.md)
- [`UITask`](UITask.md)
- [`CalendarFlyout`](CalendarFlyout.md)
- [`QuickSettings`](QuickSettings.md)
- [`Windows2`](Windows2.md)

## Constructors

### Constructor

```ts
new UIElement(): UIElement;
```

Defined in: fl.ui/src/ui/base/UIElement.ts:14

#### Returns

`UIElement`

#### Overrides

```ts
GLitElement().constructor
```

## Properties

### adoptedStyleSheets

```ts
adoptedStyleSheets: CSSStyleSheet[];
```

Defined in: lur.e/src/lure/misc/Glit.ts:143

#### Inherited from

```ts
GLitElement().adoptedStyleSheets
```

***

### initialAttributes?

```ts
optional initialAttributes?: Record<string, any> | (() => Record<string, any>);
```

Defined in: lur.e/src/lure/misc/Glit.ts:141

#### Inherited from

```ts
GLitElement().initialAttributes
```

***

### render

```ts
render: () => any;
```

Defined in: fl.ui/src/ui/base/UIElement.ts:11

#### Returns

`any`

#### Overrides

```ts
GLitElement().render
```

***

### styleLibs

```ts
styleLibs: HTMLStyleElement[];
```

Defined in: lur.e/src/lure/misc/Glit.ts:142

#### Inherited from

```ts
GLitElement().styleLibs
```

***

### styles?

```ts
optional styles?: any;
```

Defined in: lur.e/src/lure/misc/Glit.ts:140

#### Inherited from

```ts
GLitElement().styles
```

***

### theme

```ts
theme: string = "default";
```

Defined in: fl.ui/src/ui/base/UIElement.ts:8

***

### formAssociated?

```ts
static optional formAssociated?: boolean;
```

Defined in: lur.e/src/lure/misc/Glit.ts:128

#### Inherited from

```ts
GLitElement().formAssociated
```

***

### observedAttributes?

```ts
static optional observedAttributes?: string[];
```

Defined in: lur.e/src/lure/misc/Glit.ts:127

#### Inherited from

```ts
GLitElement().observedAttributes
```

## Methods

### $init()?

```ts
optional $init(): void;
```

Defined in: lur.e/src/lure/misc/Glit.ts:150

#### Returns

`void`

#### Inherited from

```ts
GLitElement().$init
```

***

### adoptedCallback()?

```ts
optional adoptedCallback(): void | UIElement | undefined;
```

Defined in: lur.e/src/lure/misc/Glit.ts:119

#### Returns

`void` \| `UIElement` \| `undefined`

#### Inherited from

```ts
GLitElement().adoptedCallback
```

***

### attributeChangedCallback()?

```ts
optional attributeChangedCallback(
   name, 
   oldValue, 
   newValue): void | UIElement | undefined;
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

`void` \| `UIElement` \| `undefined`

#### Inherited from

```ts
GLitElement().attributeChangedCallback
```

***

### connectedCallback()

```ts
connectedCallback(): this;
```

Defined in: fl.ui/src/ui/base/UIElement.ts:22

#### Returns

`this`

#### Overrides

```ts
GLitElement().connectedCallback
```

***

### createShadowRoot()

```ts
createShadowRoot(): ShadowRoot;
```

Defined in: lur.e/src/lure/misc/Glit.ts:149

#### Returns

`ShadowRoot`

#### Inherited from

```ts
GLitElement().createShadowRoot
```

***

### disconnectedCallback()?

```ts
optional disconnectedCallback(): void | UIElement | undefined;
```

Defined in: lur.e/src/lure/misc/Glit.ts:118

#### Returns

`void` \| `UIElement` \| `undefined`

#### Inherited from

```ts
GLitElement().disconnectedCallback
```

***

### loadStyleLibrary()

```ts
loadStyleLibrary(module): void | UIElement | undefined;
```

Defined in: lur.e/src/lure/misc/Glit.ts:148

#### Parameters

##### module

`any`

#### Returns

`void` \| `UIElement` \| `undefined`

#### Inherited from

```ts
GLitElement().loadStyleLibrary
```

***

### onInitialize()

```ts
onInitialize(): this;
```

Defined in: fl.ui/src/ui/base/UIElement.ts:29

#### Returns

`this`

#### Overrides

```ts
GLitElement().onInitialize
```

***

### onRender()

```ts
onRender(): void | UIElement | undefined;
```

Defined in: fl.ui/src/ui/base/UIElement.ts:17

#### Returns

`void` \| `UIElement` \| `undefined`

#### Overrides

```ts
GLitElement().onRender
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

```ts
GLitElement().styleLayers
```
