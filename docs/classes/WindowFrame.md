[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / WindowFrame

# Class: WindowFrame

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:16](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L16)

## Extends

- [`UIElement`](UIElement.md)

## Constructors

### Constructor

```ts
new WindowFrame(): WindowFrame;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:45](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L45)

#### Returns

`WindowFrame`

#### Overrides

[`UIElement`](UIElement.md).[`constructor`](UIElement.md#constructor)

## Properties

### appIconEl?

```ts
optional appIconEl: HTMLSpanElement;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:32](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L32)

***

### closeEl?

```ts
optional closeEl: HTMLButtonElement;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:36](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L36)

***

### closeIcon?

```ts
optional closeIcon: string = "x";
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:24](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L24)

***

### contentEl?

```ts
optional contentEl: HTMLElement;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:29](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L29)

***

### icon?

```ts
optional icon: string = "app-window";
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:19](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L19)

***

### maximizeEl?

```ts
optional maximizeEl: HTMLButtonElement;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:38](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L38)

***

### maximizeIcon?

```ts
optional maximizeIcon: string = "corners-out";
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:26](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L26)

***

### minimizeEl?

```ts
optional minimizeEl: HTMLButtonElement;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:37](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L37)

***

### minimizeIcon?

```ts
optional minimizeIcon: string = "minus";
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:25](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L25)

***

### name?

```ts
optional name: string = "";
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:18](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L18)

***

### reflect?

```ts
optional reflect: null | TaskStateReflect;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:42](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L42)

***

### render()

```ts
render: () => any;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:109](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L109)

#### Returns

`any`

#### Overrides

[`UIElement`](UIElement.md).[`render`](UIElement.md#render)

***

### resizeHandleEl?

```ts
optional resizeHandleEl: HTMLElement;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:33](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L33)

***

### styles()

```ts
styles: () => undefined | Node;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:108](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L108)

#### Returns

`undefined` \| `Node`

***

### subtitle?

```ts
optional subtitle: string = "WINDOW_FRAME_SUBTITLE";
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:21](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L21)

***

### task

```ts
task: null | ITask = null;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:41](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L41)

***

### theme

```ts
theme: string = "default";
```

Defined in: [fl.ui/src/design/base/UIElement.ts:13](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/base/UIElement.ts#L13)

#### Inherited from

[`UIElement`](UIElement.md).[`theme`](UIElement.md#theme)

***

### title?

```ts
optional title: string = "WINDOW_FRAME_TITLE";
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:20](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L20)

***

### titlebarEl?

```ts
optional titlebarEl: HTMLElement;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:30](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L30)

***

### titlebarHandleEl?

```ts
optional titlebarHandleEl: HTMLElement;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:31](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L31)

***

### titleTextEl?

```ts
optional titleTextEl: HTMLSpanElement;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:34](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L34)

***

### titleTextSubEl?

```ts
optional titleTextSubEl: HTMLSpanElement;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:35](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L35)

## Methods

### bindWithTask()

```ts
bindWithTask(task): WindowFrame;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:79](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L79)

#### Parameters

##### task

`null` | `ITask`

#### Returns

`WindowFrame`

***

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

### doCenter()

```ts
doCenter(): void;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:95](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L95)

#### Returns

`void`

***

### onInitialize()

```ts
onInitialize(): void;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:46](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L46)

#### Returns

`void`

#### Overrides

[`UIElement`](UIElement.md).[`onInitialize`](UIElement.md#oninitialize)

***

### onRender()

```ts
onRender(): void;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:88](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/window/WindowFrame.ts#L88)

#### Returns

`void`

#### Overrides

[`UIElement`](UIElement.md).[`onRender`](UIElement.md#onrender)
