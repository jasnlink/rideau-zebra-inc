# Color Selector & Tag-Based Product System - Implementation Guide

## Summary of Changes

The product template system has been completely redesigned to use a **composite prefix-based tag system** for maximum flexibility, scalability, and maintainability.

## Key Improvements

1. ✅ **Composite tag system** - Organized prefix-based tags for all product attributes
2. ✅ **Scalable architecture** - Easy to add new product types and categories
3. ✅ **Color selector hides completely** when product has no color configuration
4. ✅ **Flexible grouping** via multiple tag prefixes
5. ✅ **Better fallbacks** for textures, colors, and missing data
6. ✅ **Template-aware navigation** - preserves v2 or default view
7. ✅ **No JavaScript dependencies** - pure Liquid/HTML implementation

## Tag System Architecture

### Tag Prefixes

All product attributes use prefix-based tags for organization:

**Product Type** - `product-type:`
- `product-type:zebra-blinds` - Basic zebra blind products
- `product-type:motorized-zebra-blinds` - Motorized options
- `product-type:opaque-blinds` - Opaque blind variants
- `product-type:roller-shades` - Roller shade products (future)
- `product-type:vertical-blinds` - Vertical blinds (future)

**Product Tier** - `tier:`
- `tier:standard` - Standard quality/feature level
- `tier:premium` - Premium quality/feature level
- `tier:deluxe` - Deluxe tier (future)

**Color Grouping** - `color-group:`
- `color-group:zebra-standard` - Standard zebra color variants
- `color-group:zebra-premium` - Premium zebra color variants
- `color-group:roller-basic` - Basic roller shade colors (future)

### Example Product Tags

**Standard Zebra Blind - Snow White:**
```
product-type:zebra-blinds
tier:standard
color-group:zebra-standard
```

**Premium Motorized Blind - Slate Gray:**
```
product-type:motorized-zebra-blinds
tier:premium
color-group:zebra-premium
```

### Required Metafields

Each product in a color group needs:

1. **`metafields.custom.color_key_name`** (String)
   - Example values: `snow-white`, `slate-gray`, `midnight-black`, `taupe-beige`
   - Used to fetch translation from locale files

2. **`metafields.custom_filters.color`** (Color)
   - Hex color value for solid color swatches
   - Example: `#FFFFFF`, `#475569`, `#000000`, `#D2B48C`

3. **`metafields.custom_filters.texture`** (File - Optional)
   - Image file for textured products
   - Takes priority over solid color if present

### Translation Keys

Update your locale files at:
```
locales/en.default.json
locales/fr.json
```

Structure:
```json
{
  "products": {
    "product": {
      "cordless_zebra_blinds": {
        "color_selector": {
          "title": "Choose your color:",
          "options": {
            "snow-white": "Snow White",
            "slate-gray": "Slate Gray",
            "midnight-black": "Midnight Black",
            "taupe-beige": "Taupe Beige"
          }
        }
      }
    }
  }
}
```

## Visibility Logic

### Color Selector
The color selector section will **only display** when:
1. ✅ Product has any `product-type:` tag (zebra-blinds, motorized-zebra-blinds, or opaque-blinds)
2. ✅ Product has a tag starting with `color-group:`
3. ✅ Product has `metafields.custom.color_key_name` set
4. ✅ There are 2+ products in the same color group

### Product Forms
Custom measurement forms display when:
1. ✅ Product has any valid `product-type:` tag

### Installation Service
Installation checkbox displays when:
1. ✅ Product has any valid `product-type:` tag

### Product Tabs (Highlights, Materials, etc.)
Product information tabs display when:
1. ✅ Product has any valid `product-type:` tag

### Product Detail Sections
Detailed specification sections display based on:
1. ✅ `tier:standard` → Shows basic product details
2. ✅ `tier:premium` → Shows premium product details

## Implementation Steps

### 1. Tag Your Products with Composite Tags

Add appropriate prefix-based tags to each product:

#### Required Tags

**Product Type** (at least one required):
- Standard zebra blinds → `product-type:zebra-blinds`
- Motorized products → `product-type:motorized-zebra-blinds`
- Opaque variants → `product-type:opaque-blinds`

**Product Tier** (choose one):
- Standard tier → `tier:standard`
- Premium tier → `tier:premium`

**Color Group** (for color variants):
- Add matching color group → `color-group:zebra-standard`

#### Example in Shopify Admin:

**Product: "Standard Zebra Blind - Snow White"**
```
Tags: product-type:zebra-blinds, tier:standard, color-group:zebra-standard
```

**Product: "Standard Zebra Blind - Slate Gray"**
```
Tags: product-type:zebra-blinds, tier:standard, color-group:zebra-standard
```

**Product: "Premium Motorized Blind - Snow White"**
```
Tags: product-type:motorized-zebra-blinds, tier:premium, color-group:zebra-premium
```

### 2. Set Metafields
For each product, set:
- `color_key_name` → The slug for translation lookup
- `custom_filters.color` → Hex color value
- `custom_filters.texture` → (Optional) Image file

### 3. Add Translations
Add translation entries for each color key in both `en.default.json` and `fr.json`.

### 4. Test
- Navigate to a product page with the color selector
- Verify:
  - Color swatches display correctly
  - Current color is highlighted with indigo border
  - Hover tooltips show translated color names
  - Clicking a color navigates to the correct product
  - Products without color data don't show the section

## JavaScript Compatibility

**No changes needed!** The color selector:
- Uses standard anchor links for navigation
- Doesn't interfere with product forms
- Doesn't affect variant selection
- Doesn't impact cart functioproduct-type:` tags
- [ ] Products have correct `tier:` tags
- [ ] Products have matching `color-group:` tags for variants
- [ ] Color metafields are set on all products
- [ ] Translations exist for all color keys
- [ ] Color selector appears on products with proper tags
- [ ] Color selector hidden on products without tags/metafields
- [ ] Product forms appear for valid product types
- [ ] Installation service checkbox displays correctly
- [ ] Product tabs display for valid product types
- [ ] Correct tier sections display (standard vs premium)
- [ ] Correct color is highlighted (indigo border)
- [ ] Clicking colors navigates to correct product
- [ ] Tooltips show translated color names
- [ ] Works on both prproduct-type:zebra-blinds` (or motorized/opaque variant)
- Verify product has `color-group:` tag
- Check that `metafields.custom.color_key_name` is set
- Ensure there are 2+ products in the same color group

**Product forms not showing?**
- Verify product has a valid `product-type:` tag

**Wrong detail section showing?**
- Check product has correct `tier:standard` or `tier:premium` tag

**Raw translation data showing?**
- Check that translation key exists in locale files
- Verify the `color_key_name` value matches the translation key exactly

**Wrong colors displayed?**
- Verify products have the same `color-group:` tag
- Check that tag name is identical (case-sensitive)

## Migration Notes

**Old System:**
- Hardcoded to collections
- Simple tag names: `zebra-blinds`, `motorized-cordless-zebra-blinds`
- Showed all collection products regardless of relevance
- Leaked raw data when metafields were missing

**New System:**
- Composite prefix-based tags: `product-type:`, `tier:`, `color-group:`
- Tag-based grouping allows multiple product categorizations
- Only shows relevant content based on tag combinations
- Gracefully hides when data is missing
- Scalable for future product types and attributes
- More flexible and maintainable

## Future Expansion

The composite tag system is ready for additional attributes:

**Potential Future Tags:**
- `product-feature:motorized` - Feature flags
- `product-feature:smart-home` - Smart home integration
- `product-material:polyester` - Material composition
- `product-material:pvc` - Material type
- `product-style:modern` - Style categories
- `product-style:traditional` - Design aesthetic
- `product-collection:summer-2026` - Seasonal collections
- `product-room:bedroom` - Room recommendations
- `product-room:office` - Usage context

Simply add new prefix patterns and update template logic accordingly!products with tags
- [ ] Color selector hidden on products without tags
- [ ] Correct color is highlighted (indigo border)
- [ ] Clicking colors navigates to correct product
- [ ] Tooltips show translated color names
- [ ] Works on both product.liquid and product.v2.liquid
- [ ] Mobile responsive layout works correctly

## Troubleshooting

**Color selector not showing?**
- Verify product has `color-group:` tag
- Check that `metafields.custom.color_key_name` is set
- Ensure there are 2+ products in the same color group

**Raw translation data showing?**
- Check that translation key exists in locale files
- Verify the `color_key_name` value matches the translation key exactly

**Wrong colors displayed?**
- Verify products have the same `color-group:` tag
- Check that tag name is identical (case-sensitive)

## Migration Notes

**Old System:**
- Hardcoded to `collections['zebra-blinds']`
- Showed all collection products regardless of relevance
- Leaked raw data when metafields were missing

**New System:**
- Tag-based grouping allows multiple color groups
- Only shows relevant color variants
- Gracefully hides when data is missing
- More flexible and maintainable
