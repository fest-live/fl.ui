[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / FileManager

# Class: FileManager

Defined in: [fl.ui/src/ui/services/file-manager/FileManager.ts:18](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManager.ts#L18)

## Extends

- [`UIElement`](UIElement.md)

## Constructors

### Constructor

```ts
new FileManager(): FileManager;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManager.ts:30](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManager.ts#L30)

#### Returns

`FileManager`

#### Overrides

[`UIElement`](UIElement.md).[`constructor`](UIElement.md#constructor)

## Properties

### gridEl?

```ts
optional gridEl: HTMLElement;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManager.ts:20](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManager.ts#L20)

***

### gridRowsEl?

```ts
optional gridRowsEl: HTMLElement;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManager.ts:19](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManager.ts#L19)

***

### inlineSize?

```ts
optional inlineSize: number;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManager.ts:26](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManager.ts#L26)

***

### render()

```ts
render: () => any;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManager.ts:94](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManager.ts#L94)

#### Returns

`any`

#### Overrides

[`UIElement`](UIElement.md).[`render`](UIElement.md#render)

***

### sidebar?

```ts
optional sidebar: any = "auto";
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManager.ts:23](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManager.ts#L23)

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

Defined in: [fl.ui/src/ui/services/file-manager/FileManager.ts:34](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManager.ts#L34)

##### Returns

`string`

#### Set Signature

```ts
set path(value): void;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManager.ts:35](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManager.ts#L35)

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

Defined in: [fl.ui/src/ui/services/file-manager/FileManager.ts:33](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManager.ts#L33)

##### Returns

`any`

***

### showSidebar

#### Get Signature

```ts
get showSidebar(): boolean;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManager.ts:67](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManager.ts#L67)

##### Returns

`boolean`

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

### goUp()

```ts
goUp(): Promise<void>;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManager.ts:82](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManager.ts#L82)

#### Returns

`Promise`\<`void`\>

***

### navigate()

```ts
navigate(toPath): Promise<void>;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManager.ts:76](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManager.ts#L76)

#### Parameters

##### toPath

`string`

#### Returns

`Promise`\<`void`\>

***

### onInitialize()

```ts
onInitialize(): void;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManager.ts:41](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManager.ts#L41)

#### Returns

`void`

#### Overrides

[`UIElement`](UIElement.md).[`onInitialize`](UIElement.md#oninitialize)

***

### onRender()

```ts
onRender(): void;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManager.ts:51](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManager.ts#L51)

#### Returns

`void`

#### Overrides

[`UIElement`](UIElement.md).[`onRender`](UIElement.md#onrender)

***

### styles()

```ts
styles(): undefined | Node;
```

Defined in: [fl.ui/src/ui/services/file-manager/FileManager.ts:29](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/file-manager/FileManager.ts#L29)

#### Returns

`undefined` \| `Node`
