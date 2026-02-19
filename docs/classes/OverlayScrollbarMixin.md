[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / OverlayScrollbarMixin

# Class: OverlayScrollbarMixin

Defined in: [fl.ui/src/ui/navigation/scrollframe/ScrollFrame.ts:80](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/navigation/scrollframe/ScrollFrame.ts#L80)

## Extends

- `DOMMixin`

## Constructors

### Constructor

```ts
new OverlayScrollbarMixin(name?): OverlayScrollbarMixin;
```

Defined in: [fl.ui/src/ui/navigation/scrollframe/ScrollFrame.ts:81](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/navigation/scrollframe/ScrollFrame.ts#L81)

#### Parameters

##### name?

`any`

#### Returns

`OverlayScrollbarMixin`

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

Defined in: [dom.ts/src/mixin/Mixins.ts:134](https://github.com/fest-live/dom.ts/blob/983cda32c3c5c867e77e7a9816aea26077dbaaf4/src/mixin/Mixins.ts#L134)

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

Defined in: [dom.ts/src/mixin/Mixins.ts:136](https://github.com/fest-live/dom.ts/blob/983cda32c3c5c867e77e7a9816aea26077dbaaf4/src/mixin/Mixins.ts#L136)

##### Returns

`string` \| `undefined`

#### Inherited from

[`DesktopTaskbar`](DesktopTaskbar.md).[`name`](DesktopTaskbar.md#name)

***

### storage

#### Get Signature

```ts
get storage(): WeakMap<any, any> | undefined;
```

Defined in: [dom.ts/src/mixin/Mixins.ts:135](https://github.com/fest-live/dom.ts/blob/983cda32c3c5c867e77e7a9816aea26077dbaaf4/src/mixin/Mixins.ts#L135)

##### Returns

`WeakMap`\<`any`, `any`\> \| `undefined`

#### Inherited from

```ts
DOMMixin.storage
```

## Methods

### connect()

```ts
connect(ws): void;
```

Defined in: [fl.ui/src/ui/navigation/scrollframe/ScrollFrame.ts:84](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/navigation/scrollframe/ScrollFrame.ts#L84)

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
   related): OverlayScrollbarMixin;
```

Defined in: [dom.ts/src/mixin/Mixins.ts:127](https://github.com/fest-live/dom.ts/blob/983cda32c3c5c867e77e7a9816aea26077dbaaf4/src/mixin/Mixins.ts#L127)

#### Parameters

##### wElement

`any`

##### wSelf

`any`

##### related

`any`

#### Returns

`OverlayScrollbarMixin`

#### Inherited from

```ts
DOMMixin.disconnect
```

***

### relatedForElement()

```ts
relatedForElement(element): object;
```

Defined in: [dom.ts/src/mixin/Mixins.ts:131](https://github.com/fest-live/dom.ts/blob/983cda32c3c5c867e77e7a9816aea26077dbaaf4/src/mixin/Mixins.ts#L131)

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

Defined in: [dom.ts/src/mixin/Mixins.ts:130](https://github.com/fest-live/dom.ts/blob/983cda32c3c5c867e77e7a9816aea26077dbaaf4/src/mixin/Mixins.ts#L130)

#### Parameters

##### element

`any`

#### Returns

`any`

#### Inherited from

```ts
DOMMixin.storeForElement
```
