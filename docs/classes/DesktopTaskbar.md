[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / DesktopTaskbar

# Class: DesktopTaskbar

Defined in: [fl.ui/src/ui/navigation/appearance/Desktop.ts:10](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/navigation/appearance/Desktop.ts#L10)

## Extends

- `DOMMixin`

## Constructors

### Constructor

```ts
new DesktopTaskbar(): DesktopTaskbar;
```

Defined in: [fl.ui/src/ui/navigation/appearance/Desktop.ts:14](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/navigation/appearance/Desktop.ts#L14)

#### Returns

`DesktopTaskbar`

#### Overrides

```ts
DOMMixin.constructor
```

## Properties

### element?

```ts
optional element: any;
```

Defined in: [fl.ui/src/ui/navigation/appearance/Desktop.ts:11](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/navigation/appearance/Desktop.ts#L11)

## Accessors

### elements

#### Get Signature

```ts
get elements(): any;
```

Defined in: [dom.ts/src/mixin/Mixins.ts:134](https://github.com/fest-live/dom.ts/blob/f3b6f31d65ad2492ce149f3b113044e1f4209407/src/mixin/Mixins.ts#L134)

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
get name(): string | undefined;
```

Defined in: [dom.ts/src/mixin/Mixins.ts:136](https://github.com/fest-live/dom.ts/blob/f3b6f31d65ad2492ce149f3b113044e1f4209407/src/mixin/Mixins.ts#L136)

##### Returns

`string` \| `undefined`

#### Inherited from

```ts
DOMMixin.name
```

***

### storage

#### Get Signature

```ts
get storage(): WeakMap<any, any> | undefined;
```

Defined in: [dom.ts/src/mixin/Mixins.ts:135](https://github.com/fest-live/dom.ts/blob/f3b6f31d65ad2492ce149f3b113044e1f4209407/src/mixin/Mixins.ts#L135)

##### Returns

`WeakMap`\<`any`, `any`\> \| `undefined`

#### Inherited from

```ts
DOMMixin.storage
```

## Methods

### connect()

```ts
connect(element): DesktopTaskbar;
```

Defined in: [fl.ui/src/ui/navigation/appearance/Desktop.ts:19](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/navigation/appearance/Desktop.ts#L19)

#### Parameters

##### element

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
disconnect(element): DesktopTaskbar;
```

Defined in: [fl.ui/src/ui/navigation/appearance/Desktop.ts:26](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/navigation/appearance/Desktop.ts#L26)

#### Parameters

##### element

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

Defined in: [dom.ts/src/mixin/Mixins.ts:131](https://github.com/fest-live/dom.ts/blob/f3b6f31d65ad2492ce149f3b113044e1f4209407/src/mixin/Mixins.ts#L131)

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
mixinSet: WeakSet<any> | undefined;
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

Defined in: [dom.ts/src/mixin/Mixins.ts:130](https://github.com/fest-live/dom.ts/blob/f3b6f31d65ad2492ce149f3b113044e1f4209407/src/mixin/Mixins.ts#L130)

#### Parameters

##### element

`any`

#### Returns

`any`

#### Inherited from

```ts
DOMMixin.storeForElement
```
