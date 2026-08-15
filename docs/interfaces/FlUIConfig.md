[**@fest-lib/fl-ui v0.1.11**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / FlUIConfig

# Interface: FlUIConfig

Defined in: fl.ui/src/index.ts:35

## Properties

### includeGlobalNativeControlStyles?

```ts
optional includeGlobalNativeControlStyles?: boolean;
```

Defined in: fl.ui/src/index.ts:42

When true, also loads host-wide rules for native `button` and bare `input`/`select`/`textarea`.
Default false so fl-ui does not restyle the whole document.

***

### loadStyles?

```ts
optional loadStyles?: boolean;
```

Defined in: fl.ui/src/index.ts:37

Whether to load styles automatically (default: true)

***

### styleVariant?

```ts
optional styleVariant?: FlUIStyleVariant;
```

Defined in: fl.ui/src/index.ts:44

Style variant to use (default: "veela-advanced")
