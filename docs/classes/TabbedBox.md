[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / TabbedBox

# Class: TabbedBox

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:41](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/tabbed-box/TabbedBox.ts#L41)

## Extends

- [`UIElement`](UIElement.md)

## Constructors

### Constructor

```ts
new TabbedBox(): TabbedBox;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:53](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/tabbed-box/TabbedBox.ts#L53)

#### Returns

`TabbedBox`

#### Overrides

[`UIElement`](UIElement.md).[`constructor`](UIElement.md#constructor)

## Properties

### currentTab?

```ts
optional currentTab: string = "";
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:42](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/tabbed-box/TabbedBox.ts#L42)

***

### render()

```ts
render: () => any;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:103](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/tabbed-box/TabbedBox.ts#L103)

#### Returns

`any`

#### Overrides

[`UIElement`](UIElement.md).[`render`](UIElement.md#render)

***

### renderTabName()

```ts
renderTabName: (tabName) => string;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:50](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/tabbed-box/TabbedBox.ts#L50)

#### Parameters

##### tabName

`string`

#### Returns

`string`

***

### theme

```ts
theme: string = "default";
```

Defined in: [fl.ui/src/design/base/UIElement.ts:13](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/base/UIElement.ts#L13)

#### Inherited from

[`UIElement`](UIElement.md).[`theme`](UIElement.md#theme)

## Methods

### connectedCallback()

```ts
connectedCallback(): void;
```

Defined in: [fl.ui/src/design/base/UIElement.ts:27](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/design/base/UIElement.ts#L27)

#### Returns

`void`

#### Inherited from

[`UIElement`](UIElement.md).[`connectedCallback`](UIElement.md#connectedcallback)

***

### createTab()

```ts
createTab(tabName): any;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:77](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/tabbed-box/TabbedBox.ts#L77)

#### Parameters

##### tabName

`string`

#### Returns

`any`

***

### onInitialize()

```ts
onInitialize(): void;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:54](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/tabbed-box/TabbedBox.ts#L54)

#### Returns

`void`

#### Overrides

[`UIElement`](UIElement.md).[`onInitialize`](UIElement.md#oninitialize)

***

### onRender()

```ts
onRender(): void;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:70](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/tabbed-box/TabbedBox.ts#L70)

#### Returns

`void`

#### Overrides

[`UIElement`](UIElement.md).[`onRender`](UIElement.md#onrender)

***

### openTab()

```ts
openTab(tabName, ev?): void;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:91](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/tabbed-box/TabbedBox.ts#L91)

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

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:64](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/tabbed-box/TabbedBox.ts#L64)

#### Parameters

##### tabs

`Map`\<`string`, `any`\>

#### Returns

`void`

***

### styles()

```ts
styles(): undefined | Node;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:100](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/tabbed-box/TabbedBox.ts#L100)

#### Returns

`undefined` \| `Node`
