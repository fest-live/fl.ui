[**@fest/fl-ui v0.0.0**](../README.md)

***

[@fest/fl-ui](../README.md) / UIGridBox

# Class: UIGridBox

Defined in: [fl.ui/src/ui/components/containers/grid/GridBox.ts:5](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/grid/GridBox.ts#L5)

## Extends

- `DOMMixin`

## Constructors

### Constructor

```ts
new UIGridBox(name?): UIGridBox;
```

Defined in: [fl.ui/src/ui/components/containers/grid/GridBox.ts:6](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/grid/GridBox.ts#L6)

#### Parameters

##### name?

`any`

#### Returns

`UIGridBox`

#### Overrides

```ts
DOMMixin.constructor
```

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

[`UIOrientBox`](UIOrientBox.md).[`name`](UIOrientBox.md#name)

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
connect(ws): void;
```

Defined in: [fl.ui/src/ui/components/containers/grid/GridBox.ts:9](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/grid/GridBox.ts#L9)

#### Parameters

##### ws

`any`

#### Returns

`void`

#### Overrides

```ts
DOMMixin.connect
```

***

### disconnect()

```ts
disconnect(
   wElement, 
   wSelf, 
   related): UIGridBox;
```

Defined in: dom.ts/src/mixin/Mixins.ts:127

#### Parameters

##### wElement

`any`

##### wSelf

`any`

##### related

`any`

#### Returns

`UIGridBox`

#### Inherited from

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
