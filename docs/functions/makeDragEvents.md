[**@fest-lib/fl-ui v0.0.0**](../README.md)

***

[@fest-lib/fl-ui](../README.md) / makeDragEvents

# Function: makeDragEvents()

```ts
function makeDragEvents(
   newItem, 
   __namedParameters, 
   __namedParameters): Promise<
  | undefined
  | {
  dispose: () => void;
  draggable: any;
  process: (ev, el) => Promise<unknown>;
}>;
```

Defined in: [fl.ui/src/ui/components/containers/grid/Interact.ts:24](https://github.com/fest-live/fl.ui/blob/fdaa30e4543210d849317cc43587fbd62174c32b/src/ui/components/containers/grid/Interact.ts#L24)

## Parameters

### newItem

`any`

### \_\_namedParameters

#### currentCell

`any`

#### dragging

`any`

#### layout

`any`

### \_\_namedParameters

#### item

`any`

#### items

`any`

## Returns

`Promise`\<
  \| `undefined`
  \| \{
  `dispose`: () => `void`;
  `draggable`: `any`;
  `process`: (`ev`, `el`) => `Promise`\<`unknown`\>;
\}\>
