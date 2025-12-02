[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / LongTextInput

# Class: LongTextInput

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:27](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/text/Text.ts#L27)

## Extends

- [`UIElement`](UIElement.md)

## Constructors

### Constructor

```ts
new LongTextInput(): LongTextInput;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:42](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/text/Text.ts#L42)

#### Returns

`LongTextInput`

#### Overrides

[`UIElement`](UIElement.md).[`constructor`](UIElement.md#constructor)

## Properties

### box?

```ts
optional box: HTMLElement;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:29](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/text/Text.ts#L29)

***

### disabled?

```ts
optional disabled: boolean = false;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:33](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/text/Text.ts#L33)

***

### input?

```ts
optional input: HTMLInputElement;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:28](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/text/Text.ts#L28)

***

### name?

```ts
optional name: string = "";
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:30](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/text/Text.ts#L30)

***

### placeholder?

```ts
optional placeholder: string = "";
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:32](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/text/Text.ts#L32)

***

### readOnly?

```ts
optional readOnly: boolean = false;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:34](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/text/Text.ts#L34)

***

### render()

```ts
render: () => any;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:115](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/text/Text.ts#L115)

#### Returns

`any`

#### Overrides

[`UIElement`](UIElement.md).[`render`](UIElement.md#render)

***

### required?

```ts
optional required: boolean = false;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:35](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/text/Text.ts#L35)

***

### styles()

```ts
styles: () => undefined | Node;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:114](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/text/Text.ts#L114)

#### Returns

`undefined` \| `Node`

***

### theme

```ts
theme: string = "default";
```

Defined in: [fl.ui/src/design/base/UIElement.ts:13](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/base/UIElement.ts#L13)

#### Inherited from

[`UIElement`](UIElement.md).[`theme`](UIElement.md#theme)

***

### value?

```ts
optional value: null | string = null;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:31](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/text/Text.ts#L31)

***

### formAssociated

```ts
static formAssociated: boolean = true;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:38](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/text/Text.ts#L38)

## Methods

### connectedCallback()

```ts
connectedCallback(): void;
```

Defined in: [fl.ui/src/design/base/UIElement.ts:27](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/base/UIElement.ts#L27)

#### Returns

`void`

#### Inherited from

[`UIElement`](UIElement.md).[`connectedCallback`](UIElement.md#connectedcallback)

***

### initializeInput()

```ts
initializeInput(): void;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:82](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/text/Text.ts#L82)

#### Returns

`void`

***

### onInitialize()

```ts
onInitialize(): void;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:104](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/text/Text.ts#L104)

#### Returns

`void`

#### Overrides

[`UIElement`](UIElement.md).[`onInitialize`](UIElement.md#oninitialize)

***

### onRender()

```ts
onRender(): void;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:49](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/text/Text.ts#L49)

#### Returns

`void`

#### Overrides

[`UIElement`](UIElement.md).[`onRender`](UIElement.md#onrender)
