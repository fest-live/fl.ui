[**@fest/fl-ui v0.0.0**](../README.md)

***

[@fest/fl-ui](../README.md) / UIElement

# Class: UIElement

Defined in: [fl.ui/src/design/base/UIElement.ts:12](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/base/UIElement.ts#L12)

## Extends

- `any`

## Extended by

- [`WindowFrame`](WindowFrame.md)
- [`TabbedBox`](TabbedBox.md)
- [`BoxWithSidebar`](BoxWithSidebar.md)
- [`ScrollBoxed`](ScrollBoxed.md)
- [`SliderInput`](SliderInput.md)
- [`LongTextInput`](LongTextInput.md)
- [`FileManager`](FileManager.md)
- [`StatusBar`](StatusBar.md)
- [`UITaskBar`](UITaskBar.md)
- [`UITask`](UITask.md)
- [`FileManagerContent`](FileManagerContent.md)

## Constructors

### Constructor

```ts
new UIElement(): UIElement;
```

Defined in: [fl.ui/src/design/base/UIElement.ts:19](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/base/UIElement.ts#L19)

#### Returns

`UIElement`

#### Overrides

```ts
GLitElement().constructor
```

## Properties

### render()

```ts
render: () => any;
```

Defined in: [fl.ui/src/design/base/UIElement.ts:16](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/base/UIElement.ts#L16)

#### Returns

`any`

***

### theme

```ts
theme: string = "default";
```

Defined in: [fl.ui/src/design/base/UIElement.ts:13](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/base/UIElement.ts#L13)

## Methods

### connectedCallback()

```ts
connectedCallback(): void;
```

Defined in: [fl.ui/src/design/base/UIElement.ts:27](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/base/UIElement.ts#L27)

#### Returns

`void`

***

### onInitialize()

```ts
onInitialize(): void;
```

Defined in: [fl.ui/src/design/base/UIElement.ts:32](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/base/UIElement.ts#L32)

#### Returns

`void`

***

### onRender()

```ts
onRender(): void;
```

Defined in: [fl.ui/src/design/base/UIElement.ts:22](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/base/UIElement.ts#L22)

#### Returns

`void`
