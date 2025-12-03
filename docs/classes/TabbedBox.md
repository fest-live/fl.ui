[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / TabbedBox

# Class: TabbedBox

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:60](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/tabbed-box/TabbedBox.ts#L60)

## Extends

- `UIElement`

## Constructors

### Constructor

```ts
new TabbedBox(): TabbedBox;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:65](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/tabbed-box/TabbedBox.ts#L65)

#### Returns

`TabbedBox`

#### Overrides

```ts
UIElement.constructor
```

## Properties

### currentTab?

```ts
optional currentTab: string = "";
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:61](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/tabbed-box/TabbedBox.ts#L61)

***

### render()

```ts
render: () => any;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:160](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/tabbed-box/TabbedBox.ts#L160)

#### Returns

`any`

#### Overrides

```ts
UIElement.render
```

***

### tabPosition?

```ts
optional tabPosition: string = "bottom";
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:62](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/tabbed-box/TabbedBox.ts#L62)

***

### theme

```ts
theme: string = "default";
```

Defined in: [fl.ui/src/ui/base/UIElement.ts:11](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/base/UIElement.ts#L11)

#### Inherited from

```ts
UIElement.theme
```

## Methods

### connectedCallback()

```ts
connectedCallback(): void;
```

Defined in: [fl.ui/src/ui/base/UIElement.ts:25](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/base/UIElement.ts#L25)

#### Returns

`void`

#### Inherited from

```ts
UIElement.connectedCallback
```

***

### createTab()

```ts
createTab(tabName, idx?): any;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:134](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/tabbed-box/TabbedBox.ts#L134)

#### Parameters

##### tabName

`string`

##### idx?

`number`

#### Returns

`any`

***

### onInitialize()

```ts
onInitialize(): void;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:66](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/tabbed-box/TabbedBox.ts#L66)

#### Returns

`void`

#### Overrides

```ts
UIElement.onInitialize
```

***

### onRender()

```ts
onRender(): void;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:127](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/tabbed-box/TabbedBox.ts#L127)

#### Returns

`void`

#### Overrides

```ts
UIElement.onRender
```

***

### openTab()

```ts
openTab(tabName, ev?): void;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:145](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/tabbed-box/TabbedBox.ts#L145)

#### Parameters

##### tabName

`string`

##### ev?

`any`

#### Returns

`void`

***

### setTabs()

```ts
setTabs(tabs): void;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:121](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/tabbed-box/TabbedBox.ts#L121)

#### Parameters

##### tabs

`Map`\<`string`, `any`\>

#### Returns

`void`

***

### styles()

```ts
styles(): any;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:159](https://github.com/fest-live/fl.ui/blob/0d5540e32c0778f58f31d954bd75662104eddb32/src/ui/components/containers/tabbed-box/TabbedBox.ts#L159)

#### Returns

`any`
