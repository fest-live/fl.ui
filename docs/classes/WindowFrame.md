[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / WindowFrame

# Class: WindowFrame

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:16](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L16)

## Extends

- `UIElement`

## Constructors

### Constructor

```ts
new WindowFrame(): WindowFrame;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:45](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L45)

#### Returns

`WindowFrame`

#### Overrides

```ts
UIElement.constructor
```

## Properties

### appIconEl?

```ts
optional appIconEl: HTMLSpanElement;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:32](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L32)

***

### closeEl?

```ts
optional closeEl: HTMLButtonElement;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:36](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L36)

***

### closeIcon?

```ts
optional closeIcon: string = "x";
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:24](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L24)

***

### contentEl?

```ts
optional contentEl: HTMLElement;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:29](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L29)

***

### icon?

```ts
optional icon: string = "app-window";
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:19](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L19)

***

### maximizeEl?

```ts
optional maximizeEl: HTMLButtonElement;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:38](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L38)

***

### maximizeIcon?

```ts
optional maximizeIcon: string = "corners-out";
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:26](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L26)

***

### minimizeEl?

```ts
optional minimizeEl: HTMLButtonElement;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:37](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L37)

***

### minimizeIcon?

```ts
optional minimizeIcon: string = "minus";
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:25](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L25)

***

### name?

```ts
optional name: string = "";
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:18](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L18)

***

### reflect?

```ts
optional reflect: TaskStateReflect | null;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:42](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L42)

***

### render()

```ts
render: () => any;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:109](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L109)

#### Returns

`any`

#### Overrides

```ts
UIElement.render
```

***

### resizeHandleEl?

```ts
optional resizeHandleEl: HTMLElement;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:33](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L33)

***

### styles()

```ts
styles: () => any;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:108](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L108)

#### Returns

`any`

***

### subtitle?

```ts
optional subtitle: string = "WINDOW_FRAME_SUBTITLE";
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:21](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L21)

***

### task

```ts
task: ITask | null = null;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:41](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L41)

***

### theme

```ts
theme: string = "default";
```

Defined in: [fl.ui/src/ui/base/UIElement.ts:11](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/base/UIElement.ts#L11)

#### Inherited from

```ts
UIElement.theme
```

***

### title?

```ts
optional title: string = "WINDOW_FRAME_TITLE";
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:20](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L20)

***

### titlebarEl?

```ts
optional titlebarEl: HTMLElement;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:30](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L30)

***

### titlebarHandleEl?

```ts
optional titlebarHandleEl: HTMLElement;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:31](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L31)

***

### titleTextEl?

```ts
optional titleTextEl: HTMLSpanElement;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:34](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L34)

***

### titleTextSubEl?

```ts
optional titleTextSubEl: HTMLSpanElement;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:35](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L35)

## Methods

### bindWithTask()

```ts
bindWithTask(task): WindowFrame;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:79](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L79)

#### Parameters

##### task

`ITask` | `null`

#### Returns

`WindowFrame`

***

### connectedCallback()

```ts
connectedCallback(): void;
```

Defined in: [fl.ui/src/ui/base/UIElement.ts:25](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/base/UIElement.ts#L25)

#### Returns

`void`

#### Inherited from

```ts
UIElement.connectedCallback
```

***

### doCenter()

```ts
doCenter(): void;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:95](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L95)

#### Returns

`void`

***

### onInitialize()

```ts
onInitialize(): void;
```

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:46](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L46)

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

Defined in: [fl.ui/src/ui/components/containers/window/WindowFrame.ts:88](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/window/WindowFrame.ts#L88)

#### Returns

`void`

#### Overrides

```ts
UIElement.onRender
```
