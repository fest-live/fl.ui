[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / TaskStateReflect

# Class: TaskStateReflect

Defined in: [fl.ui/src/ui/navigation/misc/TaskStateReflect.ts:6](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/navigation/misc/TaskStateReflect.ts#L6)

## Constructors

### Constructor

```ts
new TaskStateReflect(element, task): TaskStateReflect;
```

Defined in: [fl.ui/src/ui/navigation/misc/TaskStateReflect.ts:28](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/navigation/misc/TaskStateReflect.ts#L28)

#### Parameters

##### element

`any` = `null`

##### task

`ITask` | `null`

#### Returns

`TaskStateReflect`

## Properties

### bindings?

```ts
optional bindings: 
  | {
  focus?: any;
  icon?: any;
  order?: any;
  orderSub?: any;
  title?: any;
  visible?: any;
}
  | null;
```

Defined in: [fl.ui/src/ui/navigation/misc/TaskStateReflect.ts:18](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/navigation/misc/TaskStateReflect.ts#L18)

***

### element?

```ts
optional element: any;
```

Defined in: [fl.ui/src/ui/navigation/misc/TaskStateReflect.ts:8](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/navigation/misc/TaskStateReflect.ts#L8)

***

### listeners?

```ts
optional listeners: 
  | {
  blur?: any;
  click?: any;
  close?: any;
  focus?: any;
  keydown?: any;
  maximize?: any;
  minimize?: any;
}
  | null;
```

Defined in: [fl.ui/src/ui/navigation/misc/TaskStateReflect.ts:9](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/navigation/misc/TaskStateReflect.ts#L9)

***

### task?

```ts
optional task: ITask | null;
```

Defined in: [fl.ui/src/ui/navigation/misc/TaskStateReflect.ts:7](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/navigation/misc/TaskStateReflect.ts#L7)

## Methods

### bind()

```ts
bind(element): TaskStateReflect;
```

Defined in: [fl.ui/src/ui/navigation/misc/TaskStateReflect.ts:60](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/navigation/misc/TaskStateReflect.ts#L60)

#### Parameters

##### element

`any` = `null`

#### Returns

`TaskStateReflect`

***

### unbind()

```ts
unbind(): void;
```

Defined in: [fl.ui/src/ui/navigation/misc/TaskStateReflect.ts:40](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/navigation/misc/TaskStateReflect.ts#L40)

#### Returns

`void`

***

### update()

```ts
update(element, task): TaskStateReflect;
```

Defined in: [fl.ui/src/ui/navigation/misc/TaskStateReflect.ts:33](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/navigation/misc/TaskStateReflect.ts#L33)

#### Parameters

##### element

`any` = `null`

##### task

`ITask` | `null`

#### Returns

`TaskStateReflect`
