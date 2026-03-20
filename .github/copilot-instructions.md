# GitHub Copilot Instructions - Rideau Zebra Theme

## Project Overview

This is a custom Shopify theme for Rideau Zebra, an e-commerce store selling custom-made zebra blinds (window treatments) in Montreal, Quebec. The theme is built on Shopify's Dawn foundation but extensively customized with a tag-based architecture and a semantic brand color system.

## Brand Voice & Design Principles

**This is the single most important section. Every design decision MUST follow these principles.**

### Brand Identity

Rideau Zebra is a **premium, luxury home décor brand**. The customer is investing in custom-made window treatments for their home. The experience must feel **elevated, confident, and effortless** — never cheap, cluttered, or techy.

### Design Language

The theme follows an **editorial, open-layout aesthetic**:

| Principle | What it means | Example |
|---|---|---|
| **Generous whitespace** | Sections breathe. Padding is large (`pt-24 pb-32`, `gap-24`). Never cram elements together. | The "What sets us apart" section uses `mt-24`, `gap-48` between columns |
| **Strong typographic hierarchy** | Serif headings (`rz-h1`–`rz-h5`) carry the page. Content is read top-down with clear size steps. | Page titles use `rz-h1`, section titles use `rz-h1` or `rz-h2`, content headings use `rz-h3`–`rz-h4` |
| **Restraint over decoration** | Fewer elements, larger. No visual clutter. If something doesn't serve a purpose, remove it. | Neutral dividers instead of boxes. Overline labels instead of badges. |
| **Left-aligned or centered columns** | Content aligns naturally. No forced centering of body text in narrow cards. | Step columns are left-aligned with a top neutral border |
| **Subtle structure** | Use borders, spacing, and background contrast for visual rhythm — not boxes, shadows, or heavy containers. | `border-t border-content-tertiary` for step columns, alternating `bg-surface-100`/`bg-surface-white` between sections |
| **Consistent visual weight** | All visual elements in a row must have the same weight/density. Mixing detailed and simple icons in a grid looks broken. | If SVG icons have inconsistent viewBoxes or detail levels, don't use them side by side — use typography instead |

### Tone of Voice (Copy)

- **Direct and confident.** "3 Easy Steps. That's It." — not "Here's How You Can Order Your Custom Blinds in Just Three Simple Steps!"
- **Short sentences.** One idea per sentence. Cut filler words.
- **Active voice.** "We make your blinds" — not "Your blinds are made by us"
- **Customer-first.** Speak to what they get, not what you do.
- **Luxurious but approachable.** Premium doesn't mean stiff. It means effortless.

### Anti-Patterns — NEVER Do These

❌ **Small badges/pills for labels** — They feel techy (SaaS, dashboards). Use `rz-overline` text instead.
❌ **Cards with borders for simple content** — Bordered cards are for forms, inputs, interactive elements. For display content, use open layouts with whitespace.
❌ **Inconsistent SVG icons side by side** — If icons have different visual weights, detail levels, or viewBox sizes, they will look broken in a grid. Use typography or don't use icons.
❌ **Centered body text in narrow columns** — Centered paragraphs are hard to read. Left-align body text, or center only 1-2 line descriptions.
❌ **Decoration without purpose** — Circles around icons, colored backgrounds on labels, decorative borders — if it's not solving a visual hierarchy problem, cut it.
❌ **Dense, cramped layouts** — This is luxury. Give elements room. When in doubt, add more space.
❌ **Wordy, indirect copy** — Cut it in half, then cut it again. "Pick your color" not "Browse our extensive collection and choose the perfect color and fabric to complement your living space."
❌ **Colored accent borders** — Never use `border-brand-600`, `border-brand-*`, or any colored top/bottom borders as decorative accents. Use neutral borders only: `border-content-subtle`, `border-content-tertiary`, or `border-content-light`. The brand color is for buttons and interactive elements, not structural lines.

### Layout Patterns That Work

**Section with feature columns** (used in "What sets us apart"):
```
Large serif title (rz-h1, centered)
                     ↓ mt-24
   ┌─────────────────┐    ┌─────────────────┐
   │  Large icon      │    │  Large icon      │
   │  Serif title     │    │  Serif title     │
   │  Description     │    │  Description     │
   └─────────────────┘    └─────────────────┘
   (gap-24 to gap-48 between items)
```

**Section with step columns** (used in "3 Easy Steps"):
```
Large serif title (rz-h1, centered)
                     ↓ mt-24
   ── subtle ──       ── subtle ──       ── subtle ──
   STEP 1             STEP 2             STEP 3
   Serif title        Serif title        Serif title
   Description        Description        Description
   (border-t border-content-tertiary, left-aligned text, gap-16)
```

**Section backgrounds alternate** to create visual rhythm:
```
surface-100 → brand-700 → surface-100 → surface-white → dark video → surface-100
```

## Core Technology Stack

- **Shopify Liquid** templating
- **Tailwind CSS** 3.4 for styling (with custom brand color tokens)
- **Vanilla JavaScript** (ES6 modules) with Webpack bundling
- **Glide.js** for carousels
- **Popper.js** for tooltips
- **Node.js 24** via nvm

## Environment Setup

**ALWAYS run `nvm use 24` before any node/npm/npx commands.**

```bash
nvm use 24
npm run dev        # Shopify theme dev server
npm run tw         # Tailwind watch mode
npm run build      # Production webpack build
npm run watch      # Webpack watch mode
```

**Store:** rideau-zebra.myshopify.com

## Critical Conventions

### 1. Composite Tag System

**ALWAYS use prefix-based tags for product categorization:**

#### Product Type Tags
Format: `product-type:VALUE`

Valid values:
- `product-type:zebra-blinds` - Standard zebra blinds
- `product-type:curtains` - Curtain products
- `product-type:opaque-blinds` - Opaque variants

Example usage in Liquid:
```liquid
{% assign has_product_type = false %}
{% for tag in product.tags %}
    {% if tag contains 'product-type:' %}
        {% assign product_type = tag | remove: 'product-type:' %}
        {% if product_type == 'zebra-blinds' or product_type == 'curtains' or product_type == 'opaque-blinds' %}
            {% assign has_product_type = true %}
        {% endif %}
    {% endif %}
{% endfor %}
```

#### Operation Mechanism Tags
Format: `operation:VALUE`

Valid values:
- `operation:cordless` - Cordless operation (default)
- `operation:motorized` - Motorized operation
- `operation:cord` - Cord-operated

Example usage in Liquid:
```liquid
{% assign product_operation = 'cordless' %}
{% for tag in product.tags %}
    {% if tag contains 'operation:' %}
        {% assign product_operation = tag | remove: 'operation:' %}
        {% break %}
    {% endif %}
{% endfor %}

{% if product_operation == 'motorized' %}
    {% comment %} Show motorized-specific content {% endcomment %}
{% endif %}
```

#### Product Tier Tags
Format: `tier:VALUE`

Valid values:
- `tier:basic` - Basic quality level
- `tier:standard` - Standard quality level
- `tier:premium` - Premium quality level

Tier routing logic:
```liquid
{% if product_tier == 'basic' or product_tier == 'standard' %}
    {% section 'product-details-basic' %}
{% elsif product_tier == 'premium' %}
    {% section 'product-details-premium' %}
{% endif %}
```

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

### 3. Brand Color System

The theme uses **5 semantic color token families** defined in `tailwind.config.js`. **NEVER use raw Tailwind color names** (indigo, stone, neutral, gray, green, red, black, white). Always use the brand tokens.

#### Token Reference

| Token Family | Purpose | Key Shades |
|---|---|---|
| **`brand`** | Primary accent, CTAs, selected states | `brand-500` (hover), `brand-600` (primary), `brand-700` (footer bar), `brand-800` (badges) |
| **`content`** | Text, icons, dark surfaces, borders | `content` (primary text/dark bg), `content-secondary`, `content-tertiary` (dividers), `content-subtle` (inactive borders), `content-light` (form borders), `content-inverse` (text on dark bg) |
| **`surface`** | Page backgrounds, cards, overlays | `surface-50` (subtle hover), `surface-100` (page bg), `surface-200` (raised cards), `surface-300` (filter hover), `surface-800` (detail table text), `surface-white` (forms/inputs) |
| **`trust`** | Security, stock status, success | `trust-100` (popover bg), `trust-300` (SSL badge), `trust-400` (stock icons), `trust-500` (verify button), `trust-700` (shipping tag), `trust-800` (popover text) |
| **`danger`** | Errors, out-of-stock | `danger` (single shade) |

#### Color Mapping (old → new)

**NEVER use these old classes — always use the new token:**

| Old (DO NOT USE) | New (USE THIS) |
|---|---|
| `indigo-*` | `brand-*` |
| `stone-900`, `black` | `content` |
| `stone-800` | `content` |
| `stone-700` | `content-secondary` |
| `stone-400` | `content-tertiary` |
| `stone-300` | `content-subtle` |
| `stone-200` | `content-light` |
| `neutral-100` (text/fill), `white` (text) | `content-inverse` |
| `neutral-100` (bg) | `surface-100` |
| `neutral-200` (bg) | `surface-200` |
| `neutral-50` (bg) | `surface-50` |
| `white` (bg) | `surface-white` |
| `gray-200` (bg) | `content-light` |
| `gray-300` (bg) | `content-subtle` |
| `gray-*` (border) | `content-*` (matching shade) |
| `green-*` | `trust-*` |
| `red-500` | `danger` |

#### Common Patterns

```liquid
{% comment %} Primary CTA button {% endcomment %}
class="bg-content text-content-inverse hover:bg-brand-500"

{% comment %} Secondary CTA button {% endcomment %}
class="bg-brand-600 text-content-inverse hover:bg-content"

{% comment %} Icon button (e.g., cart, close) {% endcomment %}
class="bg-content hover:bg-brand-600"

{% comment %} Form input {% endcomment %}
class="bg-surface-white border-content-light text-content"

{% comment %} Card {% endcomment %}
class="bg-surface-white border border-content-light rounded-md"

{% comment %} Page background {% endcomment %}
class="bg-surface-100"

{% comment %} Section divider {% endcomment %}
class="border-t border-content-tertiary"

{% comment %} Step/column top border {% endcomment %}
class="border-t border-content-tertiary"

{% comment %} Icons on dark bg {% endcomment %}
class="fill-content-inverse"

{% comment %} Icons on light bg {% endcomment %}
class="fill-content"

{% comment %} SSL / trust badge {% endcomment %}
class="bg-trust-300 hover:bg-trust-200 active:bg-trust-400"

{% comment %} Stock indicator {% endcomment %}
class="text-trust-400"      {%- comment -%} in stock {%- endcomment -%}
class="text-danger"          {%- comment -%} out of stock {%- endcomment -%}

{% comment %} Selected state (checkbox/radio) {% endcomment %}
class="has-[:checked]:bg-brand-200 has-[:checked]:border-brand-500"

{% comment %} Active color swatch {% endcomment %}
class="border-brand-500 hover:border-brand-500/80"

{% comment %} Inactive color swatch {% endcomment %}
class="border-content-subtle hover:border-brand-300"
```

### 4. Design System — `rz-` Component Classes

The theme uses `@apply`-based component classes defined in `input.css` under `@layer components`. **ALWAYS prefer `rz-` classes over verbose Tailwind utility chains** for common UI patterns.

All classes are prefixed with `rz-` (Rideau Zebra).

#### Buttons

**Structure:** Combine a size class + a variant class.

| Size Class | Specs |
|---|---|
| `rz-btn-xs` | `text-xs py-1 px-3` |
| `rz-btn-sm` | `text-sm py-2 px-6` |
| `rz-btn-md` | `text-base py-3 px-8` |
| `rz-btn-lg` | `text-lg py-3 px-8` |

| Variant Class | Style |
|---|---|
| `rz-btn-primary` | Dark bg → brand-500 on hover |
| `rz-btn-secondary` | brand-600 bg → dark on hover |
| `rz-btn-ghost` | surface-100 bg → dark on hover |
| `rz-btn-outline` | Transparent with border → dark fill on hover |

**Special buttons:**
- `rz-icon-btn` — Circular icon button (cart, close)
- `rz-btn-trust` — SSL/security badge
- `rz-btn-trust-verify` — Verify link inside trust popover

```liquid
{% comment %} Primary CTA {% endcomment %}
<button class="rz-btn-lg rz-btn-primary">Add to Cart</button>

{% comment %} Secondary CTA {% endcomment %}
<a class="rz-btn-md rz-btn-secondary">Shop Now</a>

{% comment %} Icon button {% endcomment %}
<button class="rz-icon-btn">{% render 'icon-close', class: 'h-5 w-auto fill-content-inverse' %}</button>

{% comment %} SSL badge {% endcomment %}
<div class="rz-btn-trust">{% render 'icon-secure' %} <span>SSL Encrypted</span></div>
```

#### Typography

| Class | Output |
|---|---|
| `rz-h1` | serif bold, `text-4xl` → `text-6xl` on lg |
| `rz-h2` | serif bold, `text-3xl` → `text-4xl` on lg |
| `rz-h3` | serif bold, `text-2xl` → `text-3xl` on lg |
| `rz-h4` | serif bold, `text-xl` → `text-2xl` on lg |
| `rz-h5` | serif bold, `text-lg` |
| `rz-hero-title` | serif bold, `text-5xl` → `text-8xl` on lg |
| `rz-body` | `text-base` |
| `rz-body-lg` | `text-lg` |
| `rz-label` | `text-sm font-medium` |
| `rz-caption` | `text-xs` |
| `rz-overline` | `text-sm uppercase tracking-wide font-medium` |

```liquid
<h1 class="rz-h1">{{ product.title }}</h1>
<div class="rz-hero-title text-content-inverse">{{ hero_title }}</div>
<span class="rz-overline">Confidence Bar Label</span>
```

#### Links

| Class | Style |
|---|---|
| `rz-link` | Underline offset-4, hover:brand-600, transition |
| `rz-link-nav` | Large, light, uppercase, hover:underline (header/mobile nav) |

```liquid
<a href="{{ url }}" class="rz-link">Read more</a>
<a href="{{ url }}" class="rz-link-nav">Shop</a>
```

#### Cards

| Class | Style |
|---|---|
| `rz-card` | `bg-surface-white border border-content-light rounded-md` |
| `rz-card-padded` | Same + `p-6` |
| `rz-card-feature` | `bg-content-subtle/30 rounded-md` (testimonials) |

#### Forms

| Class | Style |
|---|---|
| `rz-input` | `py-3 px-2 rounded-md bg-surface-white border border-content-light` |
| `rz-select` | Same as `rz-input` + cursor-pointer |

#### Badges

| Class | Style |
|---|---|
| `rz-badge` | Base badge (inline-flex, rounded-full, small text) |
| `rz-badge-brand` | Brand-colored badge |
| `rz-badge-trust` | Trust-colored badge (stock, shipping) |
| `rz-badge-stock` | In-stock indicator |
| `rz-badge-out-of-stock` | Out-of-stock (danger) |

#### Layout

| Class | Style |
|---|---|
| `rz-page-gutter` | `px-4 sm:px-8` — horizontal page padding |
| `rz-section-gap` | `py-12 lg:py-24` |
| `rz-section-gap-sm` | `py-8 lg:py-12` |
| `rz-section-gap-lg` | `py-16 lg:py-32` |
| `rz-divider` | `border-t border-content-tertiary` |
| `rz-divider-light` | `border-t border-content-light` |

#### Popovers

| Class | Style |
|---|---|
| `rz-popover` | Hidden absolute popover with shadow, rounded borders |
| `rz-popover-trust` | Trust-themed popover (green bg/text) |

#### Usage Rules

1. **ALWAYS use `rz-` classes** for buttons, headings, inputs, cards, dividers, badges, and links
2. **Combine size + variant** for buttons: `rz-btn-md rz-btn-primary`
3. **Add layout overrides after** the `rz-` class: `rz-h1 text-center mt-4`
4. **Never duplicate** what an `rz-` class already provides (e.g., don't add `font-serif` alongside `rz-h1`)
5. **Don't write verbose button/heading chains** — use the semantic class instead
6. **All `rz-` classes** are defined in `input.css` under `@layer components`

### 5. File Structure

```
/templates        - Page templates (product.v2.liquid is primary)
/sections         - Reusable sections
/snippets         - Small reusable components (prefix: component., product., icon-)
/layout           - Base layouts (theme.liquid)
/locales          - i18n translations (en.default.json, fr.json)
/assets           - Compiled CSS/JS, images, fonts
/src/js           - Source JavaScript (compiled via Webpack)
```

### 6. Naming Conventions

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

### 7. Metafields

**Custom Product Metafields:**
- `product.metafields.custom.color_key_name` - Color translation key (e.g., "snow-white")
- `product.metafields.custom_filters.color` - Hex color value
- `product.metafields.custom_filters.texture` - Texture image file

**Deprecated Metafields (replaced by tags):**
- ~~`product.metafields.custom_filters.is_motorized`~~ - Use `operation:motorized` tag instead

### 8. Translation Keys

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

### 9. Responsive Design Patterns

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

### 10. Component Patterns

#### Rendering Components
```liquid
{% render 'component.color-selector' %}
{% render 'icon-cart', class: 'h-5 w-auto fill-content-inverse' %}
```

#### Section Inclusion
```liquid
{% section 'product-details-basic' %}
{% section 'header' %}
```

#### Conditional Rendering Based on Tags
```liquid
{% assign has_product_type = false %}
{% for tag in product.tags %}
    {% if tag contains 'product-type:' %}
        {% assign product_type = tag | remove: 'product-type:' %}
        {% if product_type == 'zebra-blinds' or product_type == 'curtains' or product_type == 'opaque-blinds' %}
            {% assign has_product_type = true %}
            {% break %}
        {% endif %}
    {% endif %}
{% endfor %}

{% if has_product_type %}
    {% comment %} Show product-specific content {% endcomment %}
{% endif %}
```

#### Operation-Based Conditional Rendering
```liquid
{% assign product_operation = 'cordless' %}
{% for tag in product.tags %}
    {% if tag contains 'operation:' %}
        {% assign product_operation = tag | remove: 'operation:' %}
        {% break %}
    {% endif %}
{% endfor %}

{% if product_operation == 'motorized' %}
    {% comment %} Show motorized-specific highlights/assets {% endcomment %}
{% endif %}
```

### 11. JavaScript Conventions

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

**JS uses brand tokens too.** The variant selector in `src/js/product.js` uses:
- `bg-content` / `text-content-inverse` for selected variant
- `bg-surface-white` / `text-content` for unselected variant

### 12. Color Selector Component

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
- Highlight current product with `border-brand-500`
- Hide completely if conditions not met

### 13. Typography

- **Sans-serif:** Archivo (default body font)
- **Serif:** STIXTwoText (headings, emphasis, footer titles)

### 14. Bilingual Support

**Both English and French must be supported:**
- All user-facing text uses `| t` filter
- Translations in `locales/en.default.json` and `locales/fr.json`
- Language switcher in header

### 15. Performance Considerations

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
- Critical CSS in `output.css` (compile with `nvm use 24 && npm run tw`)
- Deferred JS loading with `defer="defer"`
- Conditional script loading based on template

### 16. Common Pitfalls to Avoid

❌ **Don't use raw Tailwind colors** - Always use brand tokens (`brand`, `content`, `surface`, `trust`, `danger`)
❌ **Don't use `indigo-*`, `stone-*`, `neutral-*`, `gray-*`, `green-*`, `red-*`** - These are NOT in the palette
❌ **Don't use `bg-black`, `text-black`, `bg-white`, `text-white`** - Use `bg-content`, `text-content`, `bg-surface-white`, `text-content-inverse`
❌ **Don't use collections for product categorization** - Use tags
❌ **Don't use where_exp** - Not available in Shopify Liquid
❌ **Don't hardcode text** - Always use translations
❌ **Don't create inline styles** - Use Tailwind classes
❌ **Don't forget mobile responsiveness** - Test all breakpoints
❌ **Don't skip tag validation** - Always check for tag existence first
❌ **Don't run node/npm without `nvm use 24`** - Always switch first
❌ **Don't write verbose button/heading chains** - Use `rz-` classes instead
❌ **Don't duplicate what `rz-` classes provide** - e.g., don't add `font-serif` alongside `rz-h1`
❌ **Don't use small badges/pills for step labels** - Use `rz-overline` text. Badges feel like SaaS/dashboard UI, not luxury.
❌ **Don't put mismatched SVG icons side by side** - If icons have different visual weights or viewBox sizes, they will look broken. Use typography as the visual anchor instead.
❌ **Don't use cards/boxes for display content** - Use open layouts with generous whitespace. Cards are for forms and interactive elements.
❌ **Don't write wordy copy** - Cut it in half, then cut again. One idea per sentence. Active voice. Direct and confident.
❌ **Don't use colored accent borders** - Never use `border-brand-600`, `border-brand-*`, or any colored borders as decorative accents. Use neutral borders only: `border-content-subtle`, `border-content-tertiary`, or `border-content-light`. Brand color is for buttons and interactive elements, not structural lines.
❌ **Don't manually validate locale JSON** - Shopify validates `en.default.json` and `fr.json` automatically. Don't run `jq`, `python -m json.tool`, or similar commands to check locale files.

### 17. When Adding New Features

**Always:**
1. Run `nvm use 24` before any build commands
2. Use brand color tokens — never raw Tailwind colors
3. Check if feature needs tag-based filtering
4. Use composite prefix tags for categorization
5. Add translations for both English and French
6. Consider mobile responsive design
7. Test with and without required metafields
8. Handle graceful degradation
9. Follow existing naming conventions

### 18. Product Forms System

Custom measurement system for made-to-measure blinds:
- Mount type selection (inside/outside)
- Measurement inputs (width, height, depth)
- Unit conversion (cm/inches)
- Room name assignment
- Validation and visual guides

Accessed via: `window.productForms` global object

### 19. Future Expansion

The tag system is designed for growth. Potential prefixes:
- `product-feature:` - Feature flags
- `product-material:` - Material composition
- `product-style:` - Style categories
- `product-room:` - Room recommendations
- `product-collection:` - Seasonal collections

Existing tag groups:
- `product-type:` - Product categorization (zebra-blinds, curtains, opaque-blinds)
- `tier:` - Quality level (basic, standard, premium)
- `color-group:` - Color selector grouping
- `operation:` - Operation mechanism (cordless, motorized, cord)

Always maintain the prefix pattern for consistency.

## Quick Reference

**Switch node version:**
```bash
nvm use 24
```

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

**Brand color quick reference:**
```
brand-600        → primary accent (buttons, badges) — NEVER for borders/lines
content          → dark text, dark bg, icons
content-inverse  → light text on dark bg
content-light    → form/card borders
content-subtle   → step/column top borders, section dividers
content-tertiary → heavier dividers
surface-100      → page background
surface-white    → form/card bg
trust-300        → SSL/security badge
trust-400        → in-stock indicator
danger           → out-of-stock, errors
```
