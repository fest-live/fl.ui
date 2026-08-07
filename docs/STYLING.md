# FL.UI Styling System

FL.UI now supports **pluggable styling systems**, allowing you to use the library with or without veela.css, and even integrate with other CSS frameworks.

## Entry Points

FL.UI provides multiple entry points for different styling needs:

### Default Entry (with Veela)
```ts
import { ... } from "@fest-lib/fl-ui";
```
Uses full veela.css integration with all advanced styling features.

### Core Entry (No Veela)
```ts
import { ... } from "@fest-lib/fl-ui/core";
```
Uses fl.ui's built-in mixins with no external CSS dependencies. Great for:
- Projects that don't use veela.css
- Projects using other CSS frameworks (Tailwind, etc.)
- Minimal bundle size requirements

### Explicit Veela Entry
```ts
import { ... } from "@fest-lib/fl-ui/veela";
```
Explicitly uses veela.css integration. Same as default, but more explicit in intent.

## SCSS Integration

### Using with Veela
```scss
// Use veela-lib directly
@use "veela-lib" as m;

.my-component {
    @include m.display('flex', center, center);
    @include m.color($bg: var(--ui-surface));
}
```

### Using without Veela
```scss
// Use fl.ui's core mixins
@use "fl-ui-lib" as m;

.my-component {
    @include m.display('flex', center, center);
    @include m.color($bg: var(--fl-surface));
}
```

### Available Core Mixins

#### Layout
- `display($type, $align, $justify)` - Flexbox/grid display
- `position($type, $inset)` - Positioning
- `size($inline, $block, $aspect)` - Sizing

#### Colors
- `color($color, $bg, $border-color)` - Colors
- `surface($tone)` - Surface colors

#### Typography
- `typography($size, $weight, $line-height, $family)`
- `text-truncate` - Truncate with ellipsis
- `heading($level)` - Heading styles

#### Interaction
- `interaction($pointerEvents, $cursor, $userSelect)`
- `interactive` - Make element interactive
- `non-interactive` - Disable interaction
- `draggable` - Draggable element styles

#### Borders & Shadows
- `border($width, $style, $color)`
- `border-radius($radius)`
- `rounded($size)` - Preset border radius
- `shadow($value)` - Box shadow
- `elevation($level)` - Elevation shadows

#### Motion
- `transition($properties, $duration, $timing)`
- `reduced-motion` - Respect prefers-reduced-motion
- `animate($name, $duration, $timing, $fill)`

#### Container
- `container-base($size, $strict, $type, $name, $mode)`
- `container($name, $type)`
- `container-query($name, $min, $max)`

#### Scrollbar
- `hide-scrollbar` - Hide scrollbar
- `custom-scrollbar($width, $thumb-color, $track-color)`
- `scrollbox` - Scrollable container

#### Components
- Window frame mixins
- Draggable mixins
- Resizable mixins

## CSS Variables (Design Tokens)

FL.UI defines CSS custom properties that work with any theming system:

### Colors
```css
--fl-surface: #ffffff;
--fl-on-surface: #1a1a1a;
--fl-primary: #1a73e8;
--fl-on-primary: #ffffff;
--fl-secondary: #5f6368;
--fl-accent: #ea4335;
--fl-success: #34a853;
--fl-warning: #fbbc04;
--fl-error: #ea4335;
```

### Typography
```css
--fl-font-family: system-ui, -apple-system, ...;
--fl-text-sm: 0.8rem;
--fl-text-base: 0.9rem;
--fl-text-lg: 1rem;
--fl-font-weight-normal: 400;
--fl-font-weight-bold: 700;
```

### Spacing
```css
--fl-space-sm: 0.5rem;
--fl-space-md: 0.75rem;
--fl-space-lg: 1rem;
```

### Border Radius
```css
--fl-radius-sm: 0.5rem;
--fl-radius-md: 0.75rem;
--fl-radius-lg: 0.85rem;
```

### Shadows
```css
--fl-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--fl-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--fl-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
```

## Using with Other CSS Frameworks

### With Tailwind CSS
```ts
// Import core version (no veela)
import { ... } from "@fest-lib/fl-ui/core";

// Override CSS variables with Tailwind values
:root {
    --fl-primary: theme('colors.blue.600');
    --fl-surface: theme('colors.white');
    --fl-radius-md: theme('borderRadius.lg');
}
```

### With Custom CSS
```ts
// Import core version
import { ... } from "@fest-lib/fl-ui/core";

// Provide your own styles
import "./my-custom-styles.css";
```

### Completely Custom
```ts
// Import only components without any styles
import { UIWindowFrame } from "@fest-lib/fl-ui/ui/components/containers/window/WindowFrame";

// Apply your own styling
```

## Migration from Veela-only

If you were previously using fl.ui with veela and want to switch to the core version:

1. Change your import:
   ```ts
   // Before
   import { ... } from "@fest-lib/fl-ui";
   
   // After
   import { ... } from "@fest-lib/fl-ui/core";
   ```

2. Update SCSS imports if using fl.ui mixins:
   ```scss
   // Before
   @use "veela-lib" as m;
   
   // After
   @use "fl-ui-lib" as m;
   ```

3. Override CSS variables to match your design system

Note: Some advanced features like veela's color functions (`--c2-surface`, etc.) won't be available in core mode. Use standard CSS color values instead.
