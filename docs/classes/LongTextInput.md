[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / LongTextInput

# Class: LongTextInput

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:27](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/text/Text.ts#L27)

## Extends

- `UIElement`

## Constructors

### Constructor

```ts
new LongTextInput(): LongTextInput;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:42](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/text/Text.ts#L42)

#### Returns

`LongTextInput`

#### Overrides

```ts
UIElement.constructor
```

## Properties

### box?

```ts
optional box: HTMLElement;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:29](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/text/Text.ts#L29)

***

### disabled?

```ts
optional disabled: boolean = false;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:33](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/text/Text.ts#L33)

***

### input?

```ts
optional input: HTMLInputElement;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:28](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/text/Text.ts#L28)

***

### name?

```ts
optional name: string = "";
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:30](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/text/Text.ts#L30)

***

### placeholder?

```ts
optional placeholder: string = "";
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:32](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/text/Text.ts#L32)

***

### readOnly?

```ts
optional readOnly: boolean = false;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:34](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/text/Text.ts#L34)

***

### render()

```ts
render: () => any;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:115](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/text/Text.ts#L115)

#### Returns

`any`

#### Overrides

```ts
UIElement.render
```

***

### required?

```ts
optional required: boolean = false;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:35](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/text/Text.ts#L35)

***

### styles()

```ts
styles: () => any;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:114](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/text/Text.ts#L114)

#### Returns

`any`

***

### theme

```ts
theme: string = "default";
```

Defined in: [fl.ui/src/ui/base/UIElement.ts:11](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/base/UIElement.ts#L11)

#### Inherited from

```ts
UIElement.theme
```

***

### value?

```ts
optional value: string | null = null;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:31](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/text/Text.ts#L31)

***

### formAssociated

```ts
static formAssociated: boolean = true;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:38](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/text/Text.ts#L38)

## Methods

### connectedCallback()

```ts
connectedCallback(): void;
```

Defined in: [fl.ui/src/ui/base/UIElement.ts:25](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/base/UIElement.ts#L25)

#### Returns

`void`

#### Inherited from

```ts
UIElement.connectedCallback
```

***

### initializeInput()

```ts
initializeInput(): void;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:82](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/text/Text.ts#L82)

#### Returns

`void`

***

### onInitialize()

```ts
onInitialize(): void;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:104](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/text/Text.ts#L104)

#### Returns

`void`

#### Overrides

```ts
UIElement.onInitialize
```

***

### onRender()

```ts
onRender(): void;
```

Defined in: [fl.ui/src/ui/components/inputs/text/Text.ts:49](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/text/Text.ts#L49)

#### Returns

`void`

#### Overrides

```ts
UIElement.onRender
```
