[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / MarkdownView

# Class: MarkdownView

Defined in: [fl.ui/src/services/markdown-view/Markdown.ts:16](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/markdown-view/Markdown.ts#L16)

## Extends

- `HTMLElement`

## Constructors

### Constructor

```ts
new MarkdownView(): MarkdownView;
```

Defined in: [fl.ui/src/services/markdown-view/Markdown.ts:18](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/markdown-view/Markdown.ts#L18)

#### Returns

`MarkdownView`

#### Overrides

```ts
HTMLElement.constructor
```

## Properties

### observedAttributes

```ts
static observedAttributes: string[];
```

Defined in: [fl.ui/src/services/markdown-view/Markdown.ts:17](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/markdown-view/Markdown.ts#L17)

## Methods

### attributeChangedCallback()

```ts
attributeChangedCallback(name, oldValue): void;
```

Defined in: [fl.ui/src/services/markdown-view/Markdown.ts:86](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/markdown-view/Markdown.ts#L86)

#### Parameters

##### name

`any`

##### oldValue

`any`

#### Returns

`void`

***

### connectedCallback()

```ts
connectedCallback(): void;
```

Defined in: [fl.ui/src/services/markdown-view/Markdown.ts:21](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/markdown-view/Markdown.ts#L21)

#### Returns

`void`

***

### createShadowRoot()

```ts
createShadowRoot(): void;
```

Defined in: [fl.ui/src/services/markdown-view/Markdown.ts:94](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/markdown-view/Markdown.ts#L94)

#### Returns

`void`

***

### loadFromCache()

```ts
loadFromCache(): Promise<any>;
```

Defined in: [fl.ui/src/services/markdown-view/Markdown.ts:37](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/markdown-view/Markdown.ts#L37)

#### Returns

`Promise`\<`any`\>

***

### renderMarkdown()

```ts
renderMarkdown(file): any;
```

Defined in: [fl.ui/src/services/markdown-view/Markdown.ts:57](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/markdown-view/Markdown.ts#L57)

#### Parameters

##### file

`any`

#### Returns

`any`

***

### setHTML()

```ts
setHTML(doc): Promise<void>;
```

Defined in: [fl.ui/src/services/markdown-view/Markdown.ts:28](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/markdown-view/Markdown.ts#L28)

#### Parameters

##### doc

`string` = `""`

#### Returns

`Promise`\<`void`\>

***

### writeToCache()

```ts
writeToCache(text): Promise<void>;
```

Defined in: [fl.ui/src/services/markdown-view/Markdown.ts:45](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/services/markdown-view/Markdown.ts#L45)

#### Parameters

##### text

`string` | `Blob` | `File`

#### Returns

`Promise`\<`void`\>
