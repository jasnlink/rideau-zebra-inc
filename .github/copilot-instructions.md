# GitHub Copilot Instructions - Rideau Zebra Theme

## Project Overview

This is a custom Shopify theme for Rideau Zebra, an e-commerce store selling custom-made zebra blinds (window treatments) in Montreal, Quebec. The theme is built on Shopify's Dawn foundation but extensively customized with a tag-based architecture.

## Core Technology Stack

- **Shopify Liquid** templating
- **Tailwind CSS** 3.4 for styling
- **Vanilla JavaScript** (ES6 modules) with Webpack bundling
- **Glide.js** for carousels
- **Popper.js** for tooltips

## Critical Conventions

### 1. Composite Tag System

**ALWAYS use prefix-based tags for product categorization:**

#### Product Type Tags
Format: `product-type:VALUE`

Valid values:
- `product-type:zebra-blinds` - Standard zebra blinds
- `product-type:motorized-zebra-blinds` - Motorized options
- `product-type:opaque-blinds` - Opaque variants

Example usage in Liquid:
```liquid
{% assign has_product_type = false %}
{% for tag in product.tags %}
    {% if tag contains 'product-type:' %}
        {% assign product_type = tag | remove: 'product-type:' %}
        {% if product_type == 'zebra-blinds' %}
            {% assign has_product_type = true %}
        {% endif %}
    {% endif %}
{% endfor %}
```

#### Product Tier Tags
Format: `tier:VALUE`

Valid values:
- `tier:basic` - Basic quality level
- `tier:standard` - Standard quality level
- `tier:premium` - Premium quality level

#### Color Group Tags
Format: `color-group:VALUE`

Example: `color-group:zebra-standard`, `color-group:zebra-premium`

Products with the same color-group tag will appear in each other's color selectors.

### 2. Shopify Liquid Limitations

**NEVER use these filters (not available in Shopify Liquid):**
- ❌ `where_exp` - Use manual loops with `contains` instead
- ❌ Jekyll-specific filters

**ALWAYS use standard Shopify filters:**
- ✅ `where` - For exact matches
- ✅ `contains` - For checking tag/array membership
- ✅ Manual loops with conditionals

Example:
```liquid
{% comment %} WRONG - where_exp is not available {% endcomment %}
{% assign filtered = collection.products | where_exp: "item", "item.tags contains tag" %}

{% comment %} CORRECT - Manual filtering {% endcomment %}
{% for product in collection.products %}
    {% if product.tags contains 'some-tag' %}
        {% comment %} Process product {% endcomment %}
    {% endif %}
{% endfor %}
```

### 3. File Structure

```
/templates        - Page templates (product.v2.liquid is primary)
/sections         - Reusable sections
/snippets         - Small reusable components (prefix: component., product., icon-)
/layout           - Base layouts (theme.liquid)
/locales          - i18n translations (en.default.json, fr.json)
/assets           - Compiled CSS/JS, images, fonts
/src/js           - Source JavaScript (compiled via Webpack)
```

### 4. Naming Conventions

#### Snippets
- `component.*` - Reusable UI components (color-selector, product-forms, drawer, etc.)
- `product.*` - Product-specific components
- `icon-*` - SVG icon components

#### Data Attributes
- `data-rz-*` - Rideau Zebra custom attributes
- `data-product-*` - Product-related JS hooks
- `data-drawer-*` - Drawer component controls
- `data-add-cart` - Add to cart functionality
- `data-selector-*` - Variant selector system

### 5. Metafields

**Custom Product Metafields:**
- `product.metafields.custom.color_key_name` - Color translation key (e.g., "snow-white")
- `product.metafields.custom_filters.color` - Hex color value
- `product.metafields.custom_filters.texture` - Texture image file
- `product.metafields.custom_filters.is_motorized` - Boolean for motorized products

### 6. Translation Keys

**Always use translation filters for user-facing text:**
```liquid
{{ 'products.product.cordless_zebra_blinds.color_selector.title' | t }}
```

**Translation structure:**
```json
{
  "products": {
    "product": {
      "cordless_zebra_blinds": {
        "color_selector": {
          "title": "Choose your color:",
          "options": {
            "snow-white": "Snow White",
            "slate-gray": "Slate Gray"
          }
        }
      }
    }
  }
}
```

### 7. Responsive Design Patterns

**Always use Tailwind responsive prefixes:**
```liquid
<div class="col-span-1 lg:col-span-2 xl:col-span-3">
<div class="hidden lg:flex">
<div class="text-base sm:text-lg md:text-xl lg:text-2xl">
```

**Breakpoints:**
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px
- `xl:` 1280px
- `2xl:` 1536px

### 8. Component Patterns

#### Rendering Components
```liquid
{% render 'component.color-selector' %}
{% render 'icon-cart', class: 'h-5 w-auto fill-neutral-100' %}
```

#### Section Inclusion
```liquid
{% section 'product-details-basic' %}
{% section 'header' %}
```

#### Conditional Rendering Based on Tags
```liquid
{% comment %} Check for product type {% endcomment %}
{% assign has_product_type = false %}
{% for tag in product.tags %}
    {% if tag contains 'product-type:' %}
        {% assign product_type = tag | remove: 'product-type:' %}
        {% if product_type == 'zebra-blinds' %}
            {% assign has_product_type = true %}
            {% break %}
        {% endif %}
    {% endif %}
{% endfor %}

{% if has_product_type %}
    {% comment %} Show product-specific content {% endcomment %}
{% endif %}
```

### 9. JavaScript Conventions

**Entry Points:**
- `src/js/index.js` - Homepage/Collection pagination
- `src/js/main.js` - Global nav, cart, mobile menu
- `src/js/product.js` - Product page functionality
- `src/js/lib.js` - Shared utilities

**Global Objects:**
```javascript
window.productForms = {
    enabled: true,
    productFormsElement: Element,
    // ... measurement system properties
}
```

**DO NOT modify color selector logic in JS** - It's purely HTML/Liquid navigation.

### 10. Color Selector Component

The color selector (`snippets/component.color-selector.liquid`) requires:

1. **Product has a color-group tag:**
   ```liquid
   {% for tag in product.tags %}
       {% if tag contains 'color-group:' %}
   ```

2. **Product has color metafield:**
   ```liquid
   {% if product.metafields.custom.color_key_name.value != blank %}
   ```

3. **Multiple products in same group:**
   ```liquid
   {% if color_variant_count > 1 %}
   ```

The component will:
- Find all products with matching `color-group:` tag
- Display color swatches (texture image or solid color)
- Show translated color names on hover
- Highlight current product with indigo border
- Hide completely if conditions not met

### 11. CSS/Styling Guidelines

**Primary Colors:**
- Indigo: `indigo-500`, `indigo-600` (primary actions)
- Stone/Gray: `stone-900`, `stone-400` (text, borders)
- Neutral: `neutral-100`, `neutral-200` (backgrounds)
- Green: `green-300`, `green-400` (success states)

**Typography:**
- Sans-serif: Archivo (default)
- Serif: STIXTwoText (headings, emphasis)

**Common Patterns:**
```liquid
class="container mx-auto"  // Centered container
class="aspect-square"       // 1:1 aspect ratio
class="rounded-md"          // Rounded corners
class="hover:bg-indigo-600 transition-all"  // Interactive elements
```

### 12. Development Workflow

**Scripts:**
```bash
npm run dev        # Shopify theme dev server
npm run tw         # Tailwind watch mode
npm run build      # Production webpack build
npm run watch      # Webpack watch mode
```

**Store:** rideau-zebra.myshopify.com

### 13. Bilingual Support

**Both English and French must be supported:**
- All user-facing text uses `| t` filter
- Translations in `locales/en.default.json` and `locales/fr.json`
- Language switcher in header

### 14. Performance Considerations

**Image Optimization:**
```liquid
<source srcset="{{ image | image_url: width: 1154 }}" media="(min-width:1536px)" />
<source srcset="{{ image | image_url: width: 868 }}" media="(min-width:1024px)" />
```

**Lazy Loading:**
```liquid
loading="lazy"
```

**Asset Loading:**
- Critical CSS in `output.css`
- Deferred JS loading with `defer="defer"`
- Conditional script loading based on template

### 15. Common Pitfalls to Avoid

❌ **Don't use collections for product categorization** - Use tags
❌ **Don't use where_exp** - Not available in Shopify Liquid
❌ **Don't hardcode text** - Always use translations
❌ **Don't create inline styles** - Use Tailwind classes
❌ **Don't forget mobile responsiveness** - Test all breakpoints
❌ **Don't skip tag validation** - Always check for tag existence first

### 16. When Adding New Features

**Always:**
1. Check if feature needs tag-based filtering
2. Use composite prefix tags for categorization
3. Add translations for both English and French
4. Consider mobile responsive design
5. Test with and without required metafields
6. Handle graceful degradation
7. Follow existing naming conventions

### 17. Product Forms System

Custom measurement system for made-to-measure blinds:
- Mount type selection (inside/outside)
- Measurement inputs (width, height, depth)
- Unit conversion (cm/inches)
- Room name assignment
- Validation and visual guides

Accessed via: `window.productForms` global object

### 18. Future Expansion

The tag system is designed for growth. Potential prefixes:
- `product-feature:` - Feature flags
- `product-material:` - Material composition
- `product-style:` - Style categories
- `product-room:` - Room recommendations
- `product-collection:` - Seasonal collections

Always maintain the prefix pattern for consistency.

## Quick Reference

**Check for product type:**
```liquid
{% for tag in product.tags %}
    {% if tag contains 'product-type:' %}
        {% assign product_type = tag | remove: 'product-type:' %}
    {% endif %}
{% endfor %}
```

**Filter products by tag manually:**
```liquid
{% for product in collections.all.products %}
    {% if product.tags contains 'color-group:zebra-standard' %}
        {% comment %} Process product {% endcomment %}
    {% endif %}
{% endfor %}
```

**Render component with parameters:**
```liquid
{% render 'component.drawer', drawer_id: 'cart-drawer', drawer_content: drawer_content %}
```

**Translation with parameters:**
```liquid
{{ 'products.product.have_us_install' | t: price: installPrice }}
```
