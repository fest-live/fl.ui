[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / TabbedSidebar

# Class: TabbedSidebar

Defined in: [fl.ui/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts:81](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts#L81)

## Extends

- `UIElement`

## Constructors

### Constructor

```ts
new TabbedSidebar(): TabbedSidebar;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts:139](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts#L139)

#### Returns

`TabbedSidebar`

#### Overrides

```ts
UIElement.constructor
```

## Properties

### currentTab?

```ts
optional currentTab: string = "";
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts:82](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts#L82)

***

### render()

```ts
render: () => any;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts:284](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts#L284)

#### Returns

`any`

#### Overrides

```ts
UIElement.render
```

***

### sidebarAsDropMenu?

```ts
optional sidebarAsDropMenu: string | boolean = "";
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts:84](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts#L84)

***

### sidebarOpened?

```ts
optional sidebarOpened: string | boolean = false;
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts:85](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts#L85)

***

### tabPosition?

```ts
optional tabPosition: string = "top";
```

Defined in: [fl.ui/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts:83](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts#L83)

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

Defined in: [fl.ui/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts:94](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts#L94)

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

Defined in: [fl.ui/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts:140](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts#L140)

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

Defined in: [fl.ui/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts:188](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts#L188)

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

Defined in: [fl.ui/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts:129](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts#L129)

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

Defined in: [fl.ui/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts:88](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts#L88)

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

Defined in: [fl.ui/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts:283](https://github.com/fest-live/fl.ui/blob/67bc202eb6fd2da9130a07e296747a1636c8ca57/src/ui/components/containers/tabbed-with-sidebar/TabbedSidebar.ts#L283)

#### Returns

`any`
