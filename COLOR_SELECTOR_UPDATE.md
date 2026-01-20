# Color Selector Update - Implementation Guide

## Summary of Changes

The color selector component has been completely redesigned to use a **tag-based system** instead of hardcoded collections.

## Key Improvements

1. ✅ **Hides completely** when product has no color configuration
2. ✅ **Flexible grouping** via product tags
3. ✅ **Better fallbacks** for textures, colors, and missing data
4. ✅ **Template-aware navigation** - preserves v2 or default view
5. ✅ **No JavaScript dependencies** - pure Liquid/HTML implementation

## How It Works

### Tag Format
Products should be tagged with: `color-group:YOUR-GROUP-NAME`

**Examples:**
- `color-group:zebra-standard`
- `color-group:zebra-premium`
- `color-group:roller-shades`

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

The color selector section will **only display** when:
1. ✅ Product has a tag starting with `color-group:`
2. ✅ Product has `metafields.custom.color_key_name` set
3. ✅ There are 2+ products in the same color group

## Implementation Steps

### 1. Tag Your Products
Add the `color-group:` tag to products that share color variants.

**Example in Shopify Admin:**
- Product: "Zebra Blind - Snow White" → Tag: `color-group:zebra-standard`
- Product: "Zebra Blind - Slate Gray" → Tag: `color-group:zebra-standard`
- Product: "Premium Blind - Snow White" → Tag: `color-group:zebra-premium`

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
- Doesn't impact cart functionality

All existing JavaScript (product.js, lib.js, main.js) works without modification.

## Template Support

The color selector automatically detects the current template:
- On `product.liquid` → Links to default product pages
- On `product.v2.liquid` → Links preserve `?view=v2` parameter

## Fallback Behavior

If a product in the color group is missing data:
- No `color_key_name` → Product is skipped (not shown)
- No `texture` AND no `color` → Shows gray placeholder swatch
- Invalid translation key → Shows raw key value

## Testing Checklist

- [ ] Products have correct `color-group:` tags
- [ ] Color metafields are set on all products
- [ ] Translations exist for all color keys
- [ ] Color selector appears on products with tags
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
