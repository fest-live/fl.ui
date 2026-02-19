[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / FileManager

# Class: FileManager

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:19](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L19)

## Extends

- `UIElement`

## Constructors

### Constructor

```ts
new FileManager(): FileManager;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:31](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L31)

#### Returns

`FileManager`

#### Overrides

```ts
UIElement.constructor
```

## Properties

### gridEl?

```ts
optional gridEl: HTMLElement;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:21](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L21)

***

### gridRowsEl?

```ts
optional gridRowsEl: HTMLElement;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:20](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L20)

***

### inlineSize?

```ts
optional inlineSize: number;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:27](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L27)

***

### render()

```ts
render: () => any;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:104](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L104)

#### Returns

`any`

#### Overrides

```ts
UIElement.render
```

***

### sidebar?

```ts
optional sidebar: any = "auto";
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:24](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L24)

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

## Accessors

### content

#### Get Signature

```ts
get content(): any;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:95](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L95)

##### Returns

`any`

***

### operative

#### Get Signature

```ts
get operative(): any;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:96](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L96)

##### Returns

`any`

***

### path

#### Get Signature

```ts
get path(): string;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:35](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L35)

##### Returns

`string`

#### Set Signature

```ts
set path(value): void;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:36](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L36)

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

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:34](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L34)

##### Returns

`any`

***

### showSidebar

#### Get Signature

```ts
get showSidebar(): boolean;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:68](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L68)

##### Returns

`boolean`

## Methods

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

### goUp()

```ts
goUp(): Promise<void>;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:83](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L83)

#### Returns

`Promise`\<`void`\>

***

### navigate()

```ts
navigate(toPath): Promise<void>;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:77](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L77)

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

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:42](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L42)

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

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:52](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L52)

#### Returns

`void`

#### Overrides

```ts
UIElement.onRender
```

***

### requestPaste()

```ts
requestPaste(): void;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:100](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L100)

#### Returns

`void`

***

### requestUpload()

```ts
requestUpload(): void;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:99](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L99)

#### Returns

`void`

***

### requestUse()

```ts
requestUse(): void;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:101](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L101)

#### Returns

`void`

***

### styles()

```ts
styles(): any;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:30](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/services/file-manager/FileManager.ts#L30)

#### Returns

`any`
