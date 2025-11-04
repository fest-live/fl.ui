[**@fest/fl-ui v0.0.0**](../README.md)

***

[@fest/fl-ui](../README.md) / UITask

# Class: UITask

Defined in: [fl.ui/src/ui/navigation/taskbar/element/Task.ts:13](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/navigation/taskbar/element/Task.ts#L13)

## Extends

- [`UIElement`](UIElement.md)

## Constructors

### Constructor

```ts
new UITask(): UITask;
```

Defined in: [fl.ui/src/ui/navigation/taskbar/element/Task.ts:18](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/navigation/taskbar/element/Task.ts#L18)

#### Returns

`UITask`

#### Overrides

[`UIElement`](UIElement.md).[`constructor`](UIElement.md#constructor)

## Properties

### icon?

```ts
optional icon: string = "github";
```

Defined in: [fl.ui/src/ui/navigation/taskbar/element/Task.ts:15](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/navigation/taskbar/element/Task.ts#L15)

***

### render()

```ts
render: () => any;
```

Defined in: [fl.ui/src/ui/navigation/taskbar/element/Task.ts:20](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/navigation/taskbar/element/Task.ts#L20)

#### Returns

`any`

#### Overrides

[`UIElement`](UIElement.md).[`render`](UIElement.md#render)

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
optional title: string = "Task";
```

Defined in: [fl.ui/src/ui/navigation/taskbar/element/Task.ts:14](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/navigation/taskbar/element/Task.ts#L14)

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

### onInitialize()

```ts
onInitialize(): void;
```

Defined in: [fl.ui/src/design/base/UIElement.ts:32](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/base/UIElement.ts#L32)

#### Returns

`void`

#### Inherited from

[`UIElement`](UIElement.md).[`onInitialize`](UIElement.md#oninitialize)

***

### onRender()

```ts
onRender(): void;
```

Defined in: [fl.ui/src/design/base/UIElement.ts:22](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/base/UIElement.ts#L22)

#### Returns

`void`

#### Inherited from

[`UIElement`](UIElement.md).[`onRender`](UIElement.md#onrender)

***

### styles()

```ts
styles(): undefined | Node;
```

Defined in: [fl.ui/src/ui/navigation/taskbar/element/Task.ts:19](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/navigation/taskbar/element/Task.ts#L19)

#### Returns

`undefined` \| `Node`
