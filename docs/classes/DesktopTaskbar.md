[**@fest-lib/fl-ui v0.1.10**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / DesktopTaskbar

# Class: DesktopTaskbar

Defined in: fl.ui/src/ui/navigation/appearance/Desktop.ts:10

## Extends

- `DOMMixin`

## Constructors

### Constructor

```ts
new DesktopTaskbar(): DesktopTaskbar;
```

Defined in: fl.ui/src/ui/navigation/appearance/Desktop.ts:14

#### Returns

`DesktopTaskbar`

#### Overrides

```ts
DOMMixin.constructor
```

## Properties

### element?

```ts
optional element?: any;
```

Defined in: fl.ui/src/ui/navigation/appearance/Desktop.ts:11

## Accessors

### elements

#### Get Signature

```ts
get elements(): any;
```

Defined in: [dom.ts/src/mixin/Mixins.ts:142](https://github.com/fest-live/dom.ts/blob/71ea700f97d460c79a12312575547001148f8c9c/src/mixin/Mixins.ts#L142)

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
get name(): any;
```

Defined in: [dom.ts/src/mixin/Mixins.ts:144](https://github.com/fest-live/dom.ts/blob/71ea700f97d460c79a12312575547001148f8c9c/src/mixin/Mixins.ts#L144)

##### Returns

`any`

#### Inherited from

[`MobileTaskbar`](MobileTaskbar.md).[`name`](MobileTaskbar.md#name)

***

### storage

#### Get Signature

```ts
get storage(): any;
```

Defined in: [dom.ts/src/mixin/Mixins.ts:143](https://github.com/fest-live/dom.ts/blob/71ea700f97d460c79a12312575547001148f8c9c/src/mixin/Mixins.ts#L143)

##### Returns

`any`

#### Inherited from

```ts
DOMMixin.storage
```

## Methods

### connect()

```ts
connect(element?): DesktopTaskbar;
```

Defined in: fl.ui/src/ui/navigation/appearance/Desktop.ts:19

#### Parameters

##### element?

`any` = `null`

#### Returns

`DesktopTaskbar`

#### Overrides

```ts
DOMMixin.connect
```

***

### disconnect()

```ts
disconnect(element?): DesktopTaskbar;
```

Defined in: fl.ui/src/ui/navigation/appearance/Desktop.ts:26

#### Parameters

##### element?

`any` = `null`

#### Returns

`DesktopTaskbar`

#### Overrides

```ts
DOMMixin.disconnect
```

***

### relatedForElement()

```ts
relatedForElement(element): object;
```

Defined in: [dom.ts/src/mixin/Mixins.ts:139](https://github.com/fest-live/dom.ts/blob/71ea700f97d460c79a12312575547001148f8c9c/src/mixin/Mixins.ts#L139)

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
mixinSet: any;
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

Defined in: [dom.ts/src/mixin/Mixins.ts:138](https://github.com/fest-live/dom.ts/blob/71ea700f97d460c79a12312575547001148f8c9c/src/mixin/Mixins.ts#L138)

#### Parameters

##### element

`any`

#### Returns

`any`

#### Inherited from

```ts
DOMMixin.storeForElement
```
