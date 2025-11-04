# Slider Component

A universal input wrapper component that provides a consistent slider interface for different input types including range, checkbox, number, and radio inputs.

## Features

- 🎚️ **Universal Input Support**: Works with `range`, `checkbox`, `number`, and `radio` input types
- 🎨 **Multiple Variants**: `slider` and `switch` variants for different use cases
- 📱 **Mobile Friendly**: Touch-optimized with proper pointer events
- ♿ **Accessible**: Full ARIA support and keyboard navigation
- 🔄 **Reactive**: Real-time value updates and form integration
- 🎯 **Draggable**: Smooth drag interactions with visual feedback

## Usage

### Basic Range Slider

```html
<ui-slider type="range" min="0" max="100" step="1" value="50"></ui-slider>
```

### Switch (Checkbox)

```html
<ui-slider type="checkbox" variant="switch"></ui-slider>
```

### Number Input

```html
<ui-slider type="number" min="0" max="10" step="0.1" value="5.5"></ui-slider>
```

### Form Integration

```html
<form>
    <ui-slider type="range" min="0" max="100" value="75" name="volume"></ui-slider>
    <ui-slider type="checkbox" variant="switch" name="power"></ui-slider>
    <ui-slider type="number" min="1" max="50" value="10" name="quantity"></ui-slider>
</form>
```

## API Reference

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | `string` | `"range"` | Input type: `range`, `checkbox`, `number`, `radio` |
| `variant` | `string` | `"slider"` | Visual variant: `slider`, `switch` |
| `name` | `string` | `""` | Form field name |
| `value` | `string` | `null` | Current value |
| `min` | `string` | `"0"` | Minimum value |
| `max` | `string` | `"100"` | Maximum value |
| `step` | `string` | `"1"` | Step increment |
| `disabled` | `boolean` | `false` | Disabled state |

### Events

- `change`: Fired when the slider value changes
- `input`: Fired during drag interactions

### CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-slider-track-size` | `0.125rem` | Track height |
| `--ui-slider-thumb-size` | `1rem` | Thumb size |
| `--ui-slider-track-radius` | `0.0625rem` | Track border radius |
| `--ui-slider-thumb-radius` | `0.5rem` | Thumb border radius |
| `--ui-slider-track-color` | `#111` | Track background color |
| `--ui-slider-thumb-color` | `#222` | Thumb background color |
| `--ui-slider-active-color` | `#4c9fff` | Active/filled track color |

## Variants

### Slider Variant
- Default appearance for range and number inputs
- Thin track with circular thumb
- Suitable for precise value selection

### Switch Variant
- Toggle switch appearance for checkbox inputs
- Rounded track with sliding thumb
- Perfect for on/off states

## Accessibility

The component includes comprehensive accessibility features:

- **ARIA Roles**: Properly labeled as `slider`
- **Value Attributes**: `ariaValueNow`, `ariaValueMin`, `ariaValueMax`
- **Live Regions**: Updates announced to screen readers
- **Keyboard Support**: Full keyboard navigation
- **Focus Management**: Proper focus indicators

## Browser Support

- ✅ Chrome 137+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

## Examples

See `examples/slider-usage.html` for comprehensive usage examples including:

- Volume controls
- Temperature ranges
- Toggle switches
- Form integration
- Disabled states
- Real-time value updates

## Implementation Details

The slider component is built using:

- **Base Class**: `UIElement` from the fl.ui design system
- **Reactivity**: `fest/object` for reactive properties
- **DOM Utilities**: `fest/dom` for event handling and styling
- **Drag System**: Custom drag implementation with RAF optimization
- **Form Integration**: Native form association with proper value binding

## Migration Notes

If migrating from a previous version:

1. **Input Creation**: The component now automatically creates and manages its own input element
2. **Property Binding**: All properties are now properly bound using the fest/lure binding system
3. **Event Handling**: Improved event handling with proper cleanup
4. **Accessibility**: Enhanced ARIA support and keyboard navigation

## Troubleshooting

### Common Issues

1. **Input not found**: Ensure the component has time to initialize before accessing the input
2. **Values not updating**: Check that property bindings are correctly set up
3. **Drag not working**: Verify that the thumb and handle elements are properly referenced

### Debug Mode

Enable debug logging by setting:
```javascript
window.sliderDebug = true;
```
