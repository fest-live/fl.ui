[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / SliderInput

# Class: SliderInput

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:30](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/slider/Slider.ts#L30)

## Extends

- `UIElement`

## Constructors

### Constructor

```ts
new SliderInput(): SliderInput;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:52](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/slider/Slider.ts#L52)

#### Returns

`SliderInput`

#### Overrides

```ts
UIElement.constructor
```

## Properties

### disabled?

```ts
optional disabled: boolean = false;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:45](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/slider/Slider.ts#L45)

***

### handle?

```ts
optional handle: HTMLElement;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:38](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/slider/Slider.ts#L38)

***

### input?

```ts
optional input: HTMLInputElement;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:36](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/slider/Slider.ts#L36)

***

### max?

```ts
optional max: string = "100";
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:42](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/slider/Slider.ts#L42)

***

### min?

```ts
optional min: string = "0";
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:41](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/slider/Slider.ts#L41)

***

### name?

```ts
optional name: string = "";
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:39](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/slider/Slider.ts#L39)

***

### step?

```ts
optional step: string = "1";
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:43](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/slider/Slider.ts#L43)

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

### thumb?

```ts
optional thumb: HTMLElement;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:37](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/slider/Slider.ts#L37)

***

### type?

```ts
optional type: string;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:44](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/slider/Slider.ts#L44)

***

### value?

```ts
optional value: string | null = null;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:40](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/slider/Slider.ts#L40)

***

### variant?

```ts
optional variant: string;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:46](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/slider/Slider.ts#L46)

***

### formAssociated

```ts
static formAssociated: boolean = true;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:49](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/slider/Slider.ts#L49)

## Accessors

### valueAsNumber

#### Get Signature

```ts
get valueAsNumber(): number;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:31](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/slider/Slider.ts#L31)

##### Returns

`number`

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

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:75](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/slider/Slider.ts#L75)

#### Returns

`void`

***

### onInitialize()

```ts
onInitialize(): void;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:99](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/slider/Slider.ts#L99)

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

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:68](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/slider/Slider.ts#L68)

#### Returns

`void`

#### Overrides

```ts
UIElement.onRender
```

***

### render()

```ts
render(): any;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:59](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/slider/Slider.ts#L59)

#### Returns

`any`

#### Overrides

```ts
UIElement.render
```

***

### styles()

```ts
styles(): any;
```

Defined in: [fl.ui/src/ui/components/inputs/slider/Slider.ts:58](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/inputs/slider/Slider.ts#L58)

#### Returns

`any`
