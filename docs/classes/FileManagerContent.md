[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / FileManagerContent

# Class: FileManagerContent

Defined in: [fl.ui/src/services/file-manager/FileManagerContent.ts:67](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManagerContent.ts#L67)

## Extends

- `UIElement`

## Constructors

### Constructor

```ts
new FileManagerContent(): FileManagerContent;
```

Defined in: [fl.ui/src/services/file-manager/FileManagerContent.ts:148](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManagerContent.ts#L148)

#### Returns

`FileManagerContent`

#### Overrides

```ts
UIElement.constructor
```

## Properties

### gridEl?

```ts
optional gridEl: HTMLElement;
```

Defined in: [fl.ui/src/services/file-manager/FileManagerContent.ts:69](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManagerContent.ts#L69)

***

### gridRowsEl?

```ts
optional gridRowsEl: HTMLElement;
```

Defined in: [fl.ui/src/services/file-manager/FileManagerContent.ts:68](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManagerContent.ts#L68)

***

### operativeInstance

```ts
operativeInstance: FileOperative | null = null;
```

Defined in: [fl.ui/src/services/file-manager/FileManagerContent.ts:72](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManagerContent.ts#L72)

***

### operativeInstanceRef

```ts
operativeInstanceRef: any;
```

Defined in: [fl.ui/src/services/file-manager/FileManagerContent.ts:73](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManagerContent.ts#L73)

***

### render()

```ts
render: () => any;
```

Defined in: [fl.ui/src/services/file-manager/FileManagerContent.ts:156](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManagerContent.ts#L156)

#### Returns

`any`

#### Overrides

```ts
UIElement.render
```

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

### path

#### Get Signature

```ts
get path(): string;
```

Defined in: [fl.ui/src/services/file-manager/FileManagerContent.ts:76](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManagerContent.ts#L76)

##### Returns

`string`

#### Set Signature

```ts
set path(value): void;
```

Defined in: [fl.ui/src/services/file-manager/FileManagerContent.ts:77](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManagerContent.ts#L77)

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

Defined in: [fl.ui/src/services/file-manager/FileManagerContent.ts:78](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManagerContent.ts#L78)

##### Returns

`any`

## Methods

### byFirstTwoLetterOrName()

```ts
byFirstTwoLetterOrName(name): number;
```

Defined in: [fl.ui/src/services/file-manager/FileManagerContent.ts:139](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManagerContent.ts#L139)

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

Defined in: [fl.ui/src/ui/base/UIElement.ts:25](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/base/UIElement.ts#L25)

#### Returns

`void`

#### Inherited from

```ts
UIElement.connectedCallback
```

***

### onCopy()

```ts
onCopy(ev): void;
```

Defined in: [fl.ui/src/services/file-manager/FileManagerContent.ts:132](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManagerContent.ts#L132)

#### Parameters

##### ev

`ClipboardEvent`

#### Returns

`void`

***

### onInitialize()

```ts
onInitialize(): void;
```

Defined in: [fl.ui/src/services/file-manager/FileManagerContent.ts:81](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManagerContent.ts#L81)

#### Returns

`void`

#### Overrides

```ts
UIElement.onInitialize
```

***

### onPaste()

```ts
onPaste(ev): void;
```

Defined in: [fl.ui/src/services/file-manager/FileManagerContent.ts:125](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManagerContent.ts#L125)

#### Parameters

##### ev

`ClipboardEvent`

#### Returns

`void`

***

### onRender()

```ts
onRender(): void;
```

Defined in: [fl.ui/src/ui/base/UIElement.ts:20](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/base/UIElement.ts#L20)

#### Returns

`void`

#### Inherited from

```ts
UIElement.onRender
```

***

### styles()

```ts
styles(): any;
```

Defined in: [fl.ui/src/services/file-manager/FileManagerContent.ts:155](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/file-manager/FileManagerContent.ts#L155)

#### Returns

`any`
