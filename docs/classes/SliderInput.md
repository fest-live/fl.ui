[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / SliderInput

# Class: SliderInput

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:30](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/slider/Slider.ts#L30)

## Extends

- [`UIElement`](UIElement.md)

## Constructors

### Constructor

```ts
new SliderInput(): SliderInput;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:52](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/slider/Slider.ts#L52)

#### Returns

`SliderInput`

#### Overrides

[`UIElement`](UIElement.md).[`constructor`](UIElement.md#constructor)

## Properties

### disabled?

```ts
optional disabled: boolean = false;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:45](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/slider/Slider.ts#L45)

***

### handle?

```ts
optional handle: HTMLElement;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:38](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/slider/Slider.ts#L38)

***

### input?

```ts
optional input: HTMLInputElement;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:36](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/slider/Slider.ts#L36)

***

### max?

```ts
optional max: string = "100";
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:42](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/slider/Slider.ts#L42)

***

### min?

```ts
optional min: string = "0";
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:41](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/slider/Slider.ts#L41)

***

### name?

```ts
optional name: string = "";
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:39](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/slider/Slider.ts#L39)

***

### step?

```ts
optional step: string = "1";
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:43](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/slider/Slider.ts#L43)

***

### theme

```ts
theme: string = "default";
```

Defined in: [fl.ui/src/design/base/UIElement.ts:13](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/base/UIElement.ts#L13)

#### Inherited from

[`UIElement`](UIElement.md).[`theme`](UIElement.md#theme)

***

### thumb?

```ts
optional thumb: HTMLElement;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:37](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/slider/Slider.ts#L37)

***

### type?

```ts
optional type: string;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:44](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/slider/Slider.ts#L44)

***

### value?

```ts
optional value: null | string = null;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:40](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/slider/Slider.ts#L40)

***

### variant?

```ts
optional variant: string;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:46](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/slider/Slider.ts#L46)

***

### formAssociated

```ts
static formAssociated: boolean = true;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:49](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/slider/Slider.ts#L49)

## Accessors

### valueAsNumber

#### Get Signature

```ts
get valueAsNumber(): number;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:31](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/slider/Slider.ts#L31)

##### Returns

`number`

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

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:75](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/slider/Slider.ts#L75)

#### Returns

`void`

***

### onInitialize()

```ts
onInitialize(): void;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:99](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/slider/Slider.ts#L99)

#### Returns

`void`

#### Overrides

[`UIElement`](UIElement.md).[`onInitialize`](UIElement.md#oninitialize)

***

### onRender()

```ts
onRender(): void;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:68](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/slider/Slider.ts#L68)

#### Returns

`void`

#### Overrides

[`UIElement`](UIElement.md).[`onRender`](UIElement.md#onrender)

***

### render()

```ts
render(): any;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:59](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/slider/Slider.ts#L59)

#### Returns

`any`

#### Overrides

```ts
UIElement.render
```

***

### styles()

```ts
styles(): undefined | Node;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:58](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/inputs/slider/Slider.ts#L58)

#### Returns

`undefined` \| `Node`
