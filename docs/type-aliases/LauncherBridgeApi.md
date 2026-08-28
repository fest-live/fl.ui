[**@fest-lib/fl-ui v0.1.18**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / LauncherBridgeApi

# Type Alias: LauncherBridgeApi

```ts
type LauncherBridgeApi = object;
```

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:103

## Properties

### launcherAppInfo?

```ts
optional launcherAppInfo?: (pkg) => Promise<LauncherAppInfo | null>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:108

#### Parameters

##### pkg

`string`

#### Returns

`Promise`\<`LauncherAppInfo` \| `null`\>

***

### launcherIcon

```ts
launcherIcon: (cacheKey, size?, variant?, pack?, drawable?) => Promise<string>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:111

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

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:124

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

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:121

#### Returns

`Promise`\<`object`[]\>

***

### launcherIconVariants?

```ts
optional launcherIconVariants?: (cacheKey) => Promise<object[]>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:118

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

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:104

#### Returns

`Promise`\<`boolean`\>

***

### launcherLaunch

```ts
launcherLaunch: (pkg, component?, launch?) => Promise<boolean>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:107

#### Parameters

##### pkg

`string`

##### component?

`string`

##### launch?

`LauncherLaunchSpec`

#### Returns

`Promise`\<`boolean`\>

***

### launcherList

```ts
launcherList: (query?) => Promise<LauncherAppEntry[]>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:106

#### Parameters

##### query?

`string`

#### Returns

`Promise`\<[`LauncherAppEntry`](LauncherAppEntry.md)[]\>

***

### launcherOpenAppInfo?

```ts
optional launcherOpenAppInfo?: (pkg) => Promise<boolean>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:109

#### Parameters

##### pkg

`string`

#### Returns

`Promise`\<`boolean`\>

***

### launcherRequestDefault

```ts
launcherRequestDefault: () => Promise<boolean>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:105

#### Returns

`Promise`\<`boolean`\>

***

### launcherUninstall?

```ts
optional launcherUninstall?: (pkg) => Promise<boolean>;
```

Defined in: fl.ui/src/ui/navigation/app-menu/AppMenu.ts:110

#### Parameters

##### pkg

`string`

#### Returns

`Promise`\<`boolean`\>
