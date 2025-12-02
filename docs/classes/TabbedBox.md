[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / TabbedBox

# Class: TabbedBox

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:60](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-box/TabbedBox.ts#L60)

## Extends

- `UIElement`

## Constructors

### Constructor

```ts
new TabbedBox(): TabbedBox;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:65](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-box/TabbedBox.ts#L65)

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

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:61](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-box/TabbedBox.ts#L61)

***

### render()

```ts
render: () => any;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:163](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-box/TabbedBox.ts#L163)

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

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:62](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-box/TabbedBox.ts#L62)

***

### theme

```ts
theme: string = "default";
```

Defined in: [fl.ui/src/ui/base/UIElement.ts:11](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/base/UIElement.ts#L11)

#### Inherited from

```ts
UIElement.theme
```

## Methods

### connectedCallback()

```ts
connectedCallback(): void;
```

Defined in: [fl.ui/src/ui/base/UIElement.ts:25](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/base/UIElement.ts#L25)

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

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:135](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-box/TabbedBox.ts#L135)

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

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:66](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-box/TabbedBox.ts#L66)

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

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:128](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-box/TabbedBox.ts#L128)

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

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:148](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-box/TabbedBox.ts#L148)

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

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:122](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-box/TabbedBox.ts#L122)

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

Defined in: [fl.ui/src/ui/components/containers/tabbed-box/TabbedBox.ts:162](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-box/TabbedBox.ts#L162)

#### Returns

`any`
