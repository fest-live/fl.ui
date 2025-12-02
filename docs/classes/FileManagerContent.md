[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / FileManagerContent

# Class: FileManagerContent

Defined in: [fl.ui/src/ui/services/file-manager/FileManagerContent.ts:64](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManagerContent.ts#L64)

## Extends

- [`UIElement`](UIElement.md)

## Constructors

### Constructor

```ts
new FileManagerContent(): FileManagerContent;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManagerContent.ts:122](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManagerContent.ts#L122)

#### Returns

`FileManagerContent`

#### Overrides

[`UIElement`](UIElement.md).[`constructor`](UIElement.md#constructor)

## Properties

### gridEl?

```ts
optional gridEl: HTMLElement;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManagerContent.ts:66](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManagerContent.ts#L66)

***

### gridRowsEl?

```ts
optional gridRowsEl: HTMLElement;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManagerContent.ts:65](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManagerContent.ts#L65)

***

### operativeInstance

```ts
operativeInstance: null | FileOperative = null;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManagerContent.ts:69](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManagerContent.ts#L69)

***

### operativeInstanceRef

```ts
operativeInstanceRef: any;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManagerContent.ts:70](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManagerContent.ts#L70)

***

### render()

```ts
render: () => any;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManagerContent.ts:129](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManagerContent.ts#L129)

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

## Accessors

### path

#### Get Signature

```ts
get path(): string;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManagerContent.ts:73](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManagerContent.ts#L73)

##### Returns

`string`

#### Set Signature

```ts
set path(value): void;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManagerContent.ts:74](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManagerContent.ts#L74)

##### Parameters

###### value

`string`

##### Returns

`void`

***

### pathRef

#### Get Signature

```ts
get pathRef(): any;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManagerContent.ts:75](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManagerContent.ts#L75)

##### Returns

`any`

## Methods

### byFirstTwoLetterOrName()

```ts
byFirstTwoLetterOrName(name): number;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManagerContent.ts:113](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManagerContent.ts#L113)

#### Parameters

##### name

`string`

#### Returns

`number`

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

Defined in: [fl.ui/src/ui/services/file-manager/FileManagerContent.ts:78](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManagerContent.ts#L78)

#### Returns

`void`

#### Overrides

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

Defined in: [fl.ui/src/ui/services/file-manager/FileManagerContent.ts:128](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManagerContent.ts#L128)

#### Returns

`undefined` \| `Node`
