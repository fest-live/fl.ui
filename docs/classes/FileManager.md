[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / FileManager

# Class: FileManager

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:18](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L18)

## Extends

- `UIElement`

## Constructors

### Constructor

```ts
new FileManager(): FileManager;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:30](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L30)

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

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:20](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L20)

***

### gridRowsEl?

```ts
optional gridRowsEl: HTMLElement;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:19](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L19)

***

### inlineSize?

```ts
optional inlineSize: number;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:26](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L26)

***

### render()

```ts
render: () => any;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:103](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L103)

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

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:23](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L23)

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

## Accessors

### content

#### Get Signature

```ts
get content(): any;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:94](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L94)

##### Returns

`any`

***

### operative

#### Get Signature

```ts
get operative(): any;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:95](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L95)

##### Returns

`any`

***

### path

#### Get Signature

```ts
get path(): string;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:34](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L34)

##### Returns

`string`

#### Set Signature

```ts
set path(value): void;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:35](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L35)

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

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:33](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L33)

##### Returns

`any`

***

### showSidebar

#### Get Signature

```ts
get showSidebar(): boolean;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:67](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L67)

##### Returns

`boolean`

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

### goUp()

```ts
goUp(): Promise<void>;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:82](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L82)

#### Returns

`Promise`\<`void`\>

***

### navigate()

```ts
navigate(toPath): Promise<void>;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:76](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L76)

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

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:41](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L41)

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

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:51](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L51)

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

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:99](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L99)

#### Returns

`void`

***

### requestUpload()

```ts
requestUpload(): void;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:98](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L98)

#### Returns

`void`

***

### requestUse()

```ts
requestUse(): void;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:100](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L100)

#### Returns

`void`

***

### styles()

```ts
styles(): any;
```

Defined in: [fl.ui/src/services/file-manager/FileManager.ts:29](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManager.ts#L29)

#### Returns

`any`
