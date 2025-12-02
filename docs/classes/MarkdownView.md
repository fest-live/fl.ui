[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / MarkdownView

# Class: MarkdownView

Defined in: [fl.ui/src/ui/services/markdown-view/Markdown.ts:13](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/markdown-view/Markdown.ts#L13)

## Extends

- `HTMLElement`

## Constructors

### Constructor

```ts
new MarkdownView(): MarkdownView;
```

Defined in: [fl.ui/src/ui/services/markdown-view/Markdown.ts:15](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/markdown-view/Markdown.ts#L15)

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

Defined in: [fl.ui/src/ui/services/markdown-view/Markdown.ts:14](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/markdown-view/Markdown.ts#L14)

## Methods

### attributeChangedCallback()

```ts
attributeChangedCallback(name, oldValue): void;
```

Defined in: [fl.ui/src/ui/services/markdown-view/Markdown.ts:84](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/markdown-view/Markdown.ts#L84)

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

Defined in: [fl.ui/src/ui/services/markdown-view/Markdown.ts:18](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/markdown-view/Markdown.ts#L18)

#### Returns

`void`

***

### createShadowRoot()

```ts
createShadowRoot(): void;
```

Defined in: [fl.ui/src/ui/services/markdown-view/Markdown.ts:92](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/markdown-view/Markdown.ts#L92)

#### Returns

`void`

***

### loadFromCache()

```ts
loadFromCache(): Promise<any>;
```

Defined in: [fl.ui/src/ui/services/markdown-view/Markdown.ts:35](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/markdown-view/Markdown.ts#L35)

#### Returns

`Promise`\<`any`\>

***

### renderMarkdown()

```ts
renderMarkdown(file): any;
```

Defined in: [fl.ui/src/ui/services/markdown-view/Markdown.ts:55](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/markdown-view/Markdown.ts#L55)

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

Defined in: [fl.ui/src/ui/services/markdown-view/Markdown.ts:25](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/markdown-view/Markdown.ts#L25)

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

Defined in: [fl.ui/src/ui/services/markdown-view/Markdown.ts:43](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/services/markdown-view/Markdown.ts#L43)

#### Parameters

##### text

`string` | `Blob` | `File`

#### Returns

`Promise`\<`void`\>
