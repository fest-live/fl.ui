[**@fest/fl-ui v0.0.0**](../README.md)

***

[@fest/fl-ui](../README.md) / ScrollBoxed

# Class: ScrollBoxed

Defined in: [fl.ui/src/ui/components/overlays/scrollframe/ScrollFrame.ts:15](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/overlays/scrollframe/ScrollFrame.ts#L15)

## Extends

- [`UIElement`](UIElement.md)

## Constructors

### Constructor

```ts
new ScrollBoxed(): ScrollBoxed;
```

Defined in: [fl.ui/src/ui/components/overlays/scrollframe/ScrollFrame.ts:22](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/overlays/scrollframe/ScrollFrame.ts#L22)

#### Returns

`ScrollBoxed`

#### Overrides

[`UIElement`](UIElement.md).[`constructor`](UIElement.md#constructor)

## Properties

### anchor

```ts
anchor: string = "_";
```

Defined in: [fl.ui/src/ui/components/overlays/scrollframe/ScrollFrame.ts:16](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/overlays/scrollframe/ScrollFrame.ts#L16)

***

### theme

```ts
theme: string = "default";
```

Defined in: [fl.ui/src/design/base/UIElement.ts:13](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/base/UIElement.ts#L13)

#### Inherited from

[`UIElement`](UIElement.md).[`theme`](UIElement.md#theme)

## Methods

### bindWith()

```ts
bindWith(
   content, 
   holder, 
   inputChange?): boolean;
```

Defined in: [fl.ui/src/ui/components/overlays/scrollframe/ScrollFrame.ts:36](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/overlays/scrollframe/ScrollFrame.ts#L36)

#### Parameters

##### content

`any`

##### holder

`any`

##### inputChange?

`any`

#### Returns

`boolean`

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

### onInitialize()

```ts
onInitialize(): void;
```

Defined in: [fl.ui/src/ui/components/overlays/scrollframe/ScrollFrame.ts:23](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/overlays/scrollframe/ScrollFrame.ts#L23)

#### Returns

`void`

#### Overrides

[`UIElement`](UIElement.md).[`onInitialize`](UIElement.md#oninitialize)

***

### onRender()

```ts
onRender(): void;
```

Defined in: [fl.ui/src/ui/components/overlays/scrollframe/ScrollFrame.ts:31](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/overlays/scrollframe/ScrollFrame.ts#L31)

#### Returns

`void`

#### Overrides

[`UIElement`](UIElement.md).[`onRender`](UIElement.md#onrender)

***

### render()

```ts
render(): any;
```

Defined in: [fl.ui/src/ui/components/overlays/scrollframe/ScrollFrame.ts:73](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/overlays/scrollframe/ScrollFrame.ts#L73)

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

Defined in: [fl.ui/src/ui/components/overlays/scrollframe/ScrollFrame.ts:72](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/overlays/scrollframe/ScrollFrame.ts#L72)

#### Returns

`undefined` \| `Node`
