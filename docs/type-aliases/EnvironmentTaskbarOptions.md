[**@fest-lib/fl-ui v0.1.7**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / EnvironmentTaskbarOptions

# Type Alias: EnvironmentTaskbarOptions

```ts
type EnvironmentTaskbarOptions = object;
```

Defined in: fl.ui/src/ui/navigation/taskbar/element/TaskBar.ts:58

## Properties

### device

```ts
device: ShellDeviceStatus;
```

Defined in: fl.ui/src/ui/navigation/taskbar/element/TaskBar.ts:59

***

### focusedTaskId

```ts
focusedTaskId: refType<string>;
```

Defined in: fl.ui/src/ui/navigation/taskbar/element/TaskBar.ts:63

Which pinned task is highlighted (home | viewer | window id).

***

### onCloseWindow?

```ts
optional onCloseWindow?: (viewId) => void;
```

Defined in: fl.ui/src/ui/navigation/taskbar/element/TaskBar.ts:69

Close a managed window.

#### Parameters

##### viewId

`string`

#### Returns

`void`

***

### onHome

```ts
onHome: () => void;
```

Defined in: fl.ui/src/ui/navigation/taskbar/element/TaskBar.ts:60

#### Returns

`void`

***

### onMinimizeWindow?

```ts
optional onMinimizeWindow?: (viewId) => void;
```

Defined in: fl.ui/src/ui/navigation/taskbar/element/TaskBar.ts:67

Minimize a managed window (desktop Win toggle).

#### Parameters

##### viewId

`string`

#### Returns

`void`

***

### onViewer

```ts
onViewer: () => void;
```

Defined in: fl.ui/src/ui/navigation/taskbar/element/TaskBar.ts:61

#### Returns

`void`

***

### onWindowTask?

```ts
optional onWindowTask?: (viewId) => void;
```

Defined in: fl.ui/src/ui/navigation/taskbar/element/TaskBar.ts:65

Activate / restore a managed window task (view id).

#### Parameters

##### viewId

`string`

#### Returns

`void`
