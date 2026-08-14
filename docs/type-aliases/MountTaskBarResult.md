[**@fest-lib/fl-ui v0.1.9**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / MountTaskBarResult

# Type Alias: MountTaskBarResult

```ts
type MountTaskBarResult = object;
```

Defined in: fl.ui/src/ui/navigation/taskbar/element/TaskBar.ts:72

## Properties

### dispose

```ts
dispose: () => void;
```

Defined in: fl.ui/src/ui/navigation/taskbar/element/TaskBar.ts:78

#### Returns

`void`

***

### element

```ts
element: HTMLElement;
```

Defined in: fl.ui/src/ui/navigation/taskbar/element/TaskBar.ts:73

***

### setFocusedTaskId

```ts
setFocusedTaskId: (id) => void;
```

Defined in: fl.ui/src/ui/navigation/taskbar/element/TaskBar.ts:75

#### Parameters

##### id

`string`

#### Returns

`void`

***

### syncWindowTasks

```ts
syncWindowTasks: (windows) => void;
```

Defined in: fl.ui/src/ui/navigation/taskbar/element/TaskBar.ts:77

Replace dynamic window tasks (Home / Markdown pins stay).

#### Parameters

##### windows

[`EnvWindowTaskDescriptor`](EnvWindowTaskDescriptor.md)[]

#### Returns

`void`

***

### taskList

```ts
taskList: ITask[];
```

Defined in: fl.ui/src/ui/navigation/taskbar/element/TaskBar.ts:74
