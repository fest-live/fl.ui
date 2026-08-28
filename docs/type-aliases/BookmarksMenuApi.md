[**@fest-lib/fl-ui v0.1.19**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / BookmarksMenuApi

# Type Alias: BookmarksMenuApi

```ts
type BookmarksMenuApi = object;
```

Defined in: fl.ui/src/ui/navigation/app-menu/bookmarks-menu.ts:46

## Properties

### listChildren

```ts
listChildren: (folderId?) => Promise<BookmarkMenuEntry[]>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/bookmarks-menu.ts:47

#### Parameters

##### folderId?

`string`

#### Returns

`Promise`\<[`BookmarkMenuEntry`](BookmarkMenuEntry.md)[]\>

***

### open

```ts
open: (entry) => Promise<void>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/bookmarks-menu.ts:49

#### Parameters

##### entry

[`BookmarkMenuEntry`](BookmarkMenuEntry.md)

#### Returns

`Promise`\<`void`\>

***

### remove?

```ts
optional remove?: (entry) => Promise<boolean>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/bookmarks-menu.ts:52

#### Parameters

##### entry

[`BookmarkMenuEntry`](BookmarkMenuEntry.md)

#### Returns

`Promise`\<`boolean`\>

***

### resolveIconUrl?

```ts
optional resolveIconUrl?: (href, size?) => string;
```

Defined in: fl.ui/src/ui/navigation/app-menu/bookmarks-menu.ts:51

Prefer Google S2; extension `_favicon` is a fallback.

#### Parameters

##### href

`string`

##### size?

`number`

#### Returns

`string`

***

### search

```ts
search: (query) => Promise<BookmarkMenuEntry[]>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/bookmarks-menu.ts:48

#### Parameters

##### query

`string`

#### Returns

`Promise`\<[`BookmarkMenuEntry`](BookmarkMenuEntry.md)[]\>

***

### update?

```ts
optional update?: (id, patch) => Promise<BookmarkMenuEntry | null>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/bookmarks-menu.ts:53

#### Parameters

##### id

`string`

##### patch

###### title?

`string`

###### url?

`string`

#### Returns

`Promise`\<[`BookmarkMenuEntry`](BookmarkMenuEntry.md) \| `null`\>
