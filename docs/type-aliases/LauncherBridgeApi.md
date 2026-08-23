[**@fest-lib/fl-ui v0.1.14**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / LauncherBridgeApi

# Type Alias: LauncherBridgeApi

```ts
type LauncherBridgeApi = object;
```

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:88

## Properties

### launcherIcon

```ts
launcherIcon: (cacheKey, size?, variant?, pack?, drawable?) => Promise<string>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:93

#### Parameters

##### cacheKey

`string`

##### size?

`number`

##### variant?

`string`

##### pack?

`string`

##### drawable?

`string`

#### Returns

`Promise`\<`string`\>

***

### launcherIconPackIcons?

```ts
optional launcherIconPackIcons?: (pack, query?, limit?) => Promise<object[]>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:106

#### Parameters

##### pack

`string`

##### query?

`string`

##### limit?

`number`

#### Returns

`Promise`\<`object`[]\>

***

### launcherIconPacks?

```ts
optional launcherIconPacks?: () => Promise<object[]>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:103

#### Returns

`Promise`\<`object`[]\>

***

### launcherIconVariants?

```ts
optional launcherIconVariants?: (cacheKey) => Promise<object[]>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:100

#### Parameters

##### cacheKey

`string`

#### Returns

`Promise`\<`object`[]\>

***

### launcherIsDefault

```ts
launcherIsDefault: () => Promise<boolean>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:89

#### Returns

`Promise`\<`boolean`\>

***

### launcherLaunch

```ts
launcherLaunch: (pkg, component?) => Promise<boolean>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:92

#### Parameters

##### pkg

`string`

##### component?

`string`

#### Returns

`Promise`\<`boolean`\>

***

### launcherList

```ts
launcherList: (query?) => Promise<LauncherAppEntry[]>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:91

#### Parameters

##### query?

`string`

#### Returns

`Promise`\<[`LauncherAppEntry`](LauncherAppEntry.md)[]\>

***

### launcherRequestDefault

```ts
launcherRequestDefault: () => Promise<boolean>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:90

#### Returns

`Promise`\<`boolean`\>
