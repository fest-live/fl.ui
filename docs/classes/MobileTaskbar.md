[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / MobileTaskbar

# Class: MobileTaskbar

Defined in: [fl.ui/src/design/appearance/Mobile.ts:10](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/appearance/Mobile.ts#L10)

## Extends

- `DOMMixin`

## Constructors

### Constructor

```ts
new MobileTaskbar(): MobileTaskbar;
```

Defined in: [fl.ui/src/design/appearance/Mobile.ts:14](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/appearance/Mobile.ts#L14)

#### Returns

`MobileTaskbar`

#### Overrides

```ts
DOMMixin.constructor
```

## Properties

### element?

```ts
optional element: any;
```

Defined in: [fl.ui/src/design/appearance/Mobile.ts:11](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/appearance/Mobile.ts#L11)

## Accessors

### elements

#### Get Signature

```ts
get elements(): any;
```

Defined in: dom.ts/src/mixin/Mixins.ts:134

##### Returns

`any`

#### Inherited from

```ts
DOMMixin.elements
```

***

### name

#### Get Signature

```ts
get name(): undefined | string;
```

Defined in: dom.ts/src/mixin/Mixins.ts:136

##### Returns

`undefined` \| `string`

#### Inherited from

```ts
DOMMixin.name
```

***

### storage

#### Get Signature

```ts
get storage(): undefined | WeakMap<any, any>;
```

Defined in: dom.ts/src/mixin/Mixins.ts:135

##### Returns

`undefined` \| `WeakMap`\<`any`, `any`\>

#### Inherited from

```ts
DOMMixin.storage
```

## Methods

### connect()

```ts
connect(element): MobileTaskbar;
```

Defined in: [fl.ui/src/design/appearance/Mobile.ts:19](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/appearance/Mobile.ts#L19)

#### Parameters

##### element

`any` = `null`

#### Returns

`MobileTaskbar`

#### Overrides

```ts
DOMMixin.connect
```

***

### disconnect()

```ts
disconnect(element): MobileTaskbar;
```

Defined in: [fl.ui/src/design/appearance/Mobile.ts:26](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/appearance/Mobile.ts#L26)

#### Parameters

##### element

`any` = `null`

#### Returns

`MobileTaskbar`

#### Overrides

```ts
DOMMixin.disconnect
```

***

### relatedForElement()

```ts
relatedForElement(element): object;
```

Defined in: dom.ts/src/mixin/Mixins.ts:131

#### Parameters

##### element

`any`

#### Returns

`object`

##### behaviorSet

```ts
behaviorSet: any;
```

##### mixinSet

```ts
mixinSet: undefined | WeakSet<any>;
```

##### storeSet

```ts
storeSet: Map<any, any>;
```

#### Inherited from

```ts
DOMMixin.relatedForElement
```

***

### storeForElement()

```ts
storeForElement(element): any;
```

Defined in: dom.ts/src/mixin/Mixins.ts:130

#### Parameters

##### element

`any`

#### Returns

`any`

#### Inherited from

```ts
DOMMixin.storeForElement
```
