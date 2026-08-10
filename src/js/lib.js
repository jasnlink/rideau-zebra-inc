export function initAddCartAction() {

    const addCartActionElementList = document.querySelectorAll('[data-add-cart]');
    const addCartShowcaseElementList = document.querySelectorAll('[data-add-cart-showcase]');

    addCartActionElementList.forEach((element) => {
        if (element.dataset.addCartBound === 'true') return
        element.dataset.addCartBound = 'true'
        element.addEventListener('click', handleAddCart);
    })
    addCartShowcaseElementList.forEach((element) => {
        if (element.dataset.addCartBound === 'true') return
        element.dataset.addCartBound = 'true'
        element.addEventListener('click', handleAddCart);
    })

    function handleAddCart(event) {

        event.preventDefault();

        if (window?.productForms?.enabled) {
            if (!window.productForms.productFormsElement.reportValidity()) {
                return
            }
        }

        const targetElement = event.currentTarget

        if(!targetElement.dataset.addCart) {
            return
        }

        const productIds = targetElement.dataset.addCart.split(',');

        if (!productIds || !productIds.length) {
            return
        }

        enableLoading(targetElement);
        initAnimation(targetElement)

        let formData = {
            'items': []
        };

        for (let productId of productIds) {
            if (productId === targetElement.getAttribute('data-add-cart-selected-product-variant-id') && window?.productForms?.enabled) {
                let selectedMountTypeElement = null
                window.productForms.productFormsMountInputElements.forEach(element => {
                    if (element.checked) {
                        selectedMountTypeElement = element
                    }
                })

                const item = {
                    'id': parseInt(productId),
                    'quantity': 1,
                    'properties': window?.productForms?.enabled ? {
                        [window.productForms.productFormsWidthInputElement.placeholder]: `${window.productForms.productFormsWidthInputElement.value} ${window.productForms.productFormsMeasurementUnitInputElement.value}`,
                        [window.productForms.productFormsHeightInputElement.placeholder]: `${window.productForms.productFormsHeightInputElement.value} ${window.productForms.productFormsMeasurementUnitInputElement.value}`,
                        [window.productForms.productFormsDepthInputElement.placeholder]: window.productForms.productFormsDepthInputElement.value.length ? `${window.productForms.productFormsDepthInputElement.value} ${window.productForms.productFormsMeasurementUnitInputElement.value}` : `N/A`,
                        [window.productForms.productFormsRoomNameInputElement.placeholder]: window.productForms.productFormsRoomNameInputElement.value,
                        [selectedMountTypeElement.placeholder]: selectedMountTypeElement.value,
                    } : null,
                }

                formData.items.push(item)
            } else {
                formData.items.push({
                    'id': parseInt(productId),
                    'quantity': 1,
                })
            }
        }

        // ── Charity Donation ── capture for second request
        let charityPayload = null;
        let charityDonationInfo = null; // stored for recalculation after cart changes
        const charitySection = document.querySelector('[data-charity-donation][data-charity-context="product"]');
        if (charitySection) {
            const selected = charitySection.dataset.charitySelected;
            const variantId = parseInt(charitySection.dataset.charityVariantId);
            const baseAmount = parseInt(charitySection.dataset.charityBaseAmount) || 0;
            if (selected && variantId) {
                let quantity = 0;
                let donationLabel = '';
                if (selected.startsWith('custom:')) {
                    const customDollars = parseFloat(selected.split(':')[1]);
                    if (customDollars > 0) {
                        quantity = Math.round(customDollars * 100);
                        donationLabel = '$' + customDollars.toFixed(2).replace(/\.00$/, '') + ' donation';
                    }
                    charityDonationInfo = { type: 'custom', value: customDollars };
                } else {
                    const percent = parseInt(selected);
                    if (percent > 0) {
                        quantity = Math.round((percent / 100) * baseAmount);
                        donationLabel = percent + '% of your order';
                    }
                    charityDonationInfo = { type: 'percent', value: percent };
                }
                if (quantity > 0) {
                    var consentCheckbox = charitySection.querySelector('[data-charity-state="select"] [data-charity-consent-checkbox]');
                    var props = { 'donation_type': donationLabel };
                    if (consentCheckbox && consentCheckbox.checked) {
                        props['_orbis_tax_receipt_consent'] = 'true';
                    } else if (consentCheckbox && !consentCheckbox.checked) {
                        // Nudge: briefly highlight the consent area so the user notices it
                        nudgeConsentRow(charitySection);
                    }
                    charityPayload = {
                        id: variantId,
                        quantity: quantity,
                        properties: props
                    };
                    // Store type in DOM for recalc
                    if (charityDonationInfo.type === 'percent') {
                        charitySection.dataset.charityPercent = charityDonationInfo.value;
                    }
                    charitySection.dataset.charityType = charityDonationInfo.type;
                }
            }
        }

        fetch(window.Shopify.routes.root + 'cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then((res) => {
            if(!res.ok) throw new Error;
            return res.json();
        })
        .then(() => {
            updateCartCount();
            pushGtagAddCartEvent(productIds, targetElement);
            // Second request: add charity donation
            if (charityPayload) {
                console.log('[charity] REQUEST cart/add.js:', JSON.stringify(charityPayload));
                return fetch(window.Shopify.routes.root + 'cart/add.js', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(charityPayload)
                }).then((res) => {
                    console.log('[charity] RESPONSE status:', res.status);
                    if (!res.ok) {
                        return res.json().then(err => { console.error('[charity] ERROR body:', JSON.stringify(err)); throw new Error(err.description || 'fail'); });
                    }
                    return res.json();
                }).then((data) => {
                    console.log('[charity] ADDED — items in cart:', data.items ? data.items.length : '?');
                    if (data.items) {
                        const added = data.items.find(i => i.variant_id === variantId);
                        console.log('[charity] ADDED item props:', added ? JSON.stringify(added.properties) : 'NOT FOUND in response');
                    }
                    return data;
                });
            }
            return Promise.resolve();
        })
        .then(() => {
            if (charityPayload) {
                updateCartCount();
                // Clear donation selection after successful add
                if (charitySection) {
                    delete charitySection.dataset.charitySelected;
                    const summary = charitySection.querySelector('[data-charity-summary]');
                    if (summary) { summary.classList.add('hidden'); summary.classList.remove('rz-fade-in'); }
                    const allChips = charitySection.querySelectorAll('[data-charity-select]');
                    const customToggleBtn = charitySection.querySelector('[data-charity-custom-toggle]');
                    allChips.forEach(chip => {
                        chip.classList.remove('border-brand-500', 'bg-brand-200');
                        chip.classList.add('border-content-light', 'bg-surface-white');
                    });
                    if (customToggleBtn) {
                        customToggleBtn.classList.remove('border-brand-500', 'bg-brand-200');
                        customToggleBtn.classList.add('border-content-light', 'bg-surface-white');
                    }
                }
                // Refresh the charity section to the donated/confirmation state —
                // the donation is already in the cart, so show the toggleable
                // tax-receipt consent checkbox (matches the drawer flow).
                return fetch(window.Shopify.routes.root + 'cart.js')
                    .then(function(r) { return r.json(); })
                    .then(function(cartData) { syncCartUI(cartData, true); })
                    .then(function() {
                        disableLoading(targetElement);
                        playAnimation();
                    });
            }
            disableLoading(targetElement);
            playAnimation();
        })
        .catch((error) => {
            pushGtagAddErrorEvent(productIds, targetElement)
            disableLoading(targetElement, true);
            console.error('Error adding to cart.', error)
        })
        .finally(() => {
            if (window?.productForms?.enabled) {
                window.productForms.productFormsElement.reset();
                // Trigger variant recalculation so price and donation amounts reset
                if (window.productForms.productFormsWidthInputElement) {
                    window.productForms.productFormsWidthInputElement.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        })

        function initAnimation(sourceElement) {
            // Fly animation removed — replaced with cart sheen + pop (see playAnimation)
        }

        function playAnimation() {
            var cartBtn = document.querySelector('[data-animation-target="cart"]');
            if (!cartBtn) return;

            // Sheen wrapper — contained inside button so qty badge isn't clipped
            var wrapper = document.createElement('span');
            wrapper.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;border-radius:9999px;';
            var sheen = document.createElement('span');
            sheen.style.cssText = 'position:absolute;top:-50%;left:-150%;width:60%;height:200%;' +
                'background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.45) 50%,transparent 65%);' +
                'transform:skewX(-15deg);transition:left 0.55s cubic-bezier(0.4,0,0.2,1);';
            wrapper.appendChild(sheen);
            cartBtn.appendChild(wrapper);
            requestAnimationFrame(function() { sheen.style.left = '200%'; });

            // Elastic pop
            cartBtn.style.transition = 'transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1)';
            cartBtn.style.transform = 'scale(1.2)';
            setTimeout(function() {
                cartBtn.style.transform = 'scale(1)';
            }, 350);

            setTimeout(function() {
                if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
            }, 600);
        }

        function enableLoading(element) {
            element.querySelector('[data-add-state="default"]').classList.add('hidden');
            element.querySelector('[data-add-state="loading"]').classList.remove('hidden');
            setBtnState(element, 'loading');
        }

        function disableLoading(element, error) {
            element.querySelector('[data-add-state="loading"]').classList.add('hidden');
            if(error) {
                setBtnState(element, 'error');
                element.querySelector('[data-add-state="error"]').classList.remove('hidden')
                setTimeout(() => {
                    element.querySelector('[data-add-state="error"]').classList.add('hidden')
                    element.querySelector('[data-add-state="default"]').classList.remove('hidden')
                }, 600);
            } else {
                setBtnState(element, 'success');
                element.querySelector('[data-add-state="success"]').classList.remove('hidden')
                setTimeout(() => {
                    element.querySelector('[data-add-state="success"]').classList.add('hidden')
                    element.querySelector('[data-add-state="default"]').classList.remove('hidden')
                }, 1500);
            }

        }

        function pushGtagAddCartEvent(pushIds, sourceElement) {

            if (!pushIds || !pushIds.length) {
                return
            }

            if (typeof gtag === 'undefined') {
                return
            }

            const gtagItems = []
            let totalValue = 0

            for (let pushId of pushIds) {
                const itemInfoElement = document.querySelector('[data-info-variant-id="'+ pushId +'"]')
                const infoSource = itemInfoElement || (sourceElement && sourceElement.getAttribute('data-info-variant-id') === pushId ? sourceElement : null)
                if (infoSource) {
                    gtagItems.push({
                        item_id: infoSource.getAttribute('data-info-product-id'),
                        item_name: infoSource.getAttribute('data-info-product-title'),
                        item_brand: infoSource.getAttribute('data-info-product-vendor'),
                        item_category: infoSource.getAttribute('data-info-product-collection'),
                        item_variant: infoSource.getAttribute('data-info-variant-id'),
                        price: infoSource.getAttribute('data-info-variant-price'),
                        quantity: 1
                    })
                    totalValue += parseFloat(infoSource.getAttribute('data-info-variant-price'))
                } else {
                    gtagItems.push({
                        item_id: pushId,
                        quantity: 1
                    })
                }

            }

            const currencySource = document.querySelector('[data-info-variant-id]') || sourceElement
            gtag("event", "add_to_cart", {
                currency: currencySource && currencySource.getAttribute('data-info-currency') ? currencySource.getAttribute('data-info-currency') : 'CAD',
                value: totalValue,
                items: gtagItems,
            });

        }

        function pushGtagAddErrorEvent(pushIds, sourceElement) {

            if (!pushIds || !pushIds.length) {
                return
            }

            if (typeof gtag === 'undefined') {
                return
            }

            const gtagItems = []

            for (let pushId of pushIds) {
                gtagItems.push({
                    item_id: pushId,
                    quantity: 1
                })
            }

            const currencySource = document.querySelector('[data-info-variant-id]') || sourceElement
            gtag("event", "error_add_cart", {
                currency: currencySource && currencySource.getAttribute('data-info-currency') ? currencySource.getAttribute('data-info-currency') : 'CAD',
                value: 0,
                items: gtagItems,
            });

        }

    }

}

/**
 * Centralized: sync ALL cart-derived UI from cart data.
 * Call this after ANY cart mutation. It reads the cart state
 * and derives every display element from it.
 * Pass recalcDonation=false to skip %-based donation recalculation.
 */
export function syncCartUI(cartData, recalcDonation, skipItems) {
    if (!cartData) return;
    var subtotal = cartData.items_subtotal_price || 0;
    var items = cartData.items || [];

    // ── Cart count badge: sum all item quantities, omit donation ──
    var count = 0;
    items.forEach(function(item) {
        if (item.variant_id !== 45690314653749) count += item.quantity || 0;
    });
    document.querySelectorAll('[data-cart-count]').forEach(function(el) {
        el.innerText = count;
        if (count <= 0) { el.classList.remove('opacity-100'); el.classList.add('opacity-0'); }
        else { el.classList.remove('opacity-0'); el.classList.add('opacity-100'); }
    });

    // ── Subtotal display ──
    document.querySelectorAll('[data-cart-subtotal]').forEach(function(el) {
        el.textContent = formatMoney(subtotal);
    });

    // ── Find donation item (if any) ──
    var donationItem = null;
    for (var i = 0; i < items.length; i++) {
        if (items[i].variant_id === 45690314653749) {
            donationItem = items[i];
            donationItem._line = i + 1;
            break;
        }
    }
    var donationPrice = donationItem
        ? (donationItem.final_line_price || donationItem.line_price || (donationItem.quantity * (donationItem.price || donationItem.final_price || 0)) || 0)
        : 0;
    var cleanSubtotal = subtotal - donationPrice;
    if (cleanSubtotal < 0) cleanSubtotal = 0;

    // ── Product page charity section ──
    var productEl = document.querySelector('[data-charity-donation][data-charity-context="product"]');
    var cartEl = document.querySelector('[data-charity-donation][data-charity-context="cart"]');
    console.log('[syncCartUI] product section:', !!productEl, '| cart section:', !!cartEl, '| donationItem:', !!donationItem, '| items:', items.length);

    syncCharitySection(productEl, donationItem, donationPrice, cleanSubtotal, true);
    syncCharitySection(cartEl, donationItem, donationPrice, cleanSubtotal, false);

    // ── Render line items inline ──
    if (!skipItems) renderCartItems(items);

    // ── %-based donation recalculation ──
    if (recalcDonation !== false && donationItem) {
        var dtype = donationItem.properties ? donationItem.properties['donation_type'] : null;
        console.log('[syncCartUI-recalc] dtype:', dtype, '| recalcDonation:', recalcDonation);
        if (dtype && dtype.indexOf('% of your order') !== -1) {
            var percent = parseInt(dtype);
            console.log('[syncCartUI-recalc] percent:', percent, '| cleanSubtotal:', cleanSubtotal, '| donationPrice:', donationPrice);
            if (percent > 0) {
                var newQty = Math.round((percent / 100) * cleanSubtotal);
                if (cleanSubtotal <= 0) newQty = 0; // Remove donation when cart is empty
                if (newQty <= 0) newQty = 0;
                console.log('[syncCartUI-recalc] newQty:', newQty, '| oldQty:', donationItem.quantity, '| line:', donationItem._line);
                if (newQty !== donationItem.quantity) {
                    console.log('[syncCartUI-recalc] FIRING cart/change.js');
                    console.trace('[cart/change.js] CALLER:');
                    fetch(window.Shopify.routes.root + 'cart/change.js', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ line: donationItem._line, quantity: newQty })
                    })
                    .then(function(r) { if (r.ok) return r.json(); else throw new Error(); })
                    .then(function(updatedCart) { syncCartUI(updatedCart, false); })
                    .catch(function() { /* silent */ });
                }
            }
        }
    }
}

/**
 * Set the visible row in a cart charity section.
 * rowName: 'chips', 'custom', or 'summary'
 */
function setCartRow(section, rowName) {
    if (!section) return;
    var rows = section.querySelectorAll('[data-charity-row]');
    rows.forEach(function(r) { r.classList.add('hidden'); });
    var target = section.querySelector('[data-charity-row="' + rowName + '"]');
    if (target) target.classList.remove('hidden');
}

/**
 * Briefly highlight the tax-receipt consent row so the user notices it
 * before/after adding a donation without ticking the box.
 */
function nudgeConsentRow(section) {
    if (!section) return;
    var consentRow = section.querySelector('[data-charity-state="select"] [data-charity-consent-row]');
    if (!consentRow) return;
    consentRow.classList.add('bg-surface-200');
    setTimeout(function() {
        consentRow.classList.remove('bg-surface-200');
    }, 1200);
}

/**
 * Update the _orbis_tax_receipt_consent property on the charity line item.
 * Called when the user checks/unchecks the consent box in the donated/confirmation
 * state — the donation is already in the cart, so we push the change via cart/change.js.
 */
function updateCharityConsentProperty(variantId, checked, checkbox) {
    var previous = !checked;
    fetch(window.Shopify.routes.root + 'cart.js')
        .then(function(r) { return r.json(); })
        .then(function(cart) {
            var charityItem = cart.items.find(function(i) { return i.variant_id === variantId; });
            if (!charityItem) throw new Error('charity line not found');
            var line = cart.items.indexOf(charityItem) + 1;
            // Preserve existing properties (e.g. donation_type), replace the consent flag
            var properties = {};
            if (charityItem.properties) {
                Object.keys(charityItem.properties).forEach(function(key) {
                    if (key === '_orbis_tax_receipt_consent') return;
                    properties[key] = charityItem.properties[key];
                });
            }
            if (checked) properties['_orbis_tax_receipt_consent'] = 'true';
            return fetch(window.Shopify.routes.root + 'cart/change.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ line: line, quantity: charityItem.quantity, properties: properties })
            });
        })
        .then(function(res) {
            if (!res.ok) throw new Error('cart/change.js failed');
            return res.json();
        })
        .then(function(cartData) {
            syncCartUI(cartData, true);
        })
        .catch(function(err) {
            console.error('[charity-consent] update failed:', err);
            if (checkbox) checkbox.checked = previous;
        });
}

// ── Product tags cache for variant visibility ──
var _productTagsCache = {};

function getProductTags(handle) {
    if (_productTagsCache[handle]) return Promise.resolve(_productTagsCache[handle]);
    return fetch(window.Shopify.routes.root + 'products/' + handle + '.js')
        .then(function(r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function(product) {
            var tags = product.tags || [];
            _productTagsCache[handle] = tags;
            return tags;
        })
        .catch(function() { _productTagsCache[handle] = []; return []; });
}

function hasProductTypeTag(tags, type) {
    for (var i = 0; i < tags.length; i++) {
        if (tags[i] === 'product-type:' + type) return true;
    }
    return false;
}

function shouldHideVariant(tags) {
    return hasProductTypeTag(tags, 'zebra-blinds') || hasProductTypeTag(tags, 'opaque-blinds');
}

/**
 * Render cart line items from cart data. No section fetch.
 */
function renderCartItems(items) {
    console.log('[renderCartItems] called — items:', items ? items.length : 0);
    var itemsEl = document.getElementById('cart-drawer-items');
    var emptyEl = document.getElementById('cart-drawer-empty');
    var summaryEl = document.getElementById('cart-drawer-summary');
    var template = document.getElementById('cart-item-template');
    console.log('[renderCartItems] itemsEl:', !!itemsEl, '| emptyEl:', !!emptyEl, '| summaryEl:', !!summaryEl, '| template:', !!template);

    if (!itemsEl || !template) {
        console.warn('[renderCartItems] BAIL — missing elements');
        return;
    }

    var container = itemsEl.querySelector('.container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'container mt-4 mb-5 mx-auto flex flex-col gap-y-8';
        itemsEl.appendChild(container);
    }

    // Filter out donation items
    var visibleCount = 0;
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item.variant_id === 45690314653749) continue;
        if (item.product_title && (item.product_title.indexOf('Charity') !== -1 || item.product_title.indexOf('Donation') !== -1)) continue;
        visibleCount++;
    }
    console.log('[renderCartItems] visible (non-donation) items:', visibleCount);

    if (visibleCount === 0) {
        if (emptyEl) emptyEl.classList.remove('hidden');
        if (itemsEl) itemsEl.classList.add('hidden');
        if (summaryEl) summaryEl.classList.add('hidden');
        container.innerHTML = '';
        return;
    }

    // Show items + summary, hide empty
    if (emptyEl) emptyEl.classList.add('hidden');
    if (itemsEl) itemsEl.classList.remove('hidden');
    if (summaryEl) summaryEl.classList.remove('hidden');

    container.innerHTML = '';

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        // Skip donation items
        if (item.variant_id === 45690314653749) continue;
        if (item.product_title && (item.product_title.indexOf('Charity') !== -1 || item.product_title.indexOf('Donation') !== -1)) continue;

        var clone = template.content.firstElementChild.cloneNode(true);
        var line = i + 1; // 1-based, matches Shopify API line numbers (full items array)

        clone.setAttribute('data-cart-line', line);

        var img = clone.querySelector('img');
        if (img && item.image) { img.src = item.image; img.alt = item.product_title || ''; }
        var link = clone.querySelector('a[href]');
        if (link) link.href = item.url || '#';

        var titleLink = clone.querySelector('.font-serif');
        if (titleLink) titleLink.textContent = item.product_title || '';

        var priceEl = clone.querySelector('[data-cart-line-price]');
        if (priceEl) priceEl.textContent = formatMoney(item.final_line_price || item.line_price || 0);

        var variantEl = clone.querySelector('.cart-item-variant');
        // Determine handle from URL for tag lookup (strip query string and variant suffix)
        var handle = '';
        if (item.url) {
            var parts = item.url.split('/');
            handle = parts[parts.length - 1];
            // Strip query string: /products/handle?variant=123 → handle
            var qIdx = handle.indexOf('?');
            if (qIdx !== -1) handle = handle.substring(0, qIdx);
        }
        if (variantEl && item.variant_title && item.variant_title !== 'Default Title') {
            // Check cached tags first, else hide until tags load
            if (handle && _productTagsCache[handle]) {
                variantEl.style.display = shouldHideVariant(_productTagsCache[handle]) ? 'none' : '';
                if (variantEl.style.display !== 'none') variantEl.textContent = item.variant_title;
            } else {
                // Hide initially, fetch tags, then re-render
                variantEl.style.display = 'none';
                if (handle) {
                    getProductTags(handle).then(function() { renderCartItems(items); });
                }
            }
        }

        var propsContainer = clone.querySelector('.cart-item-properties');
        if (propsContainer && item.properties) {
            propsContainer.innerHTML = '';
            var hasProps = false;
            for (var key in item.properties) {
                if (key === 'donation_type') continue;
                var propDiv = document.createElement('div');
                propDiv.className = 'text-xs sm:text-sm text-content-secondary';
                propDiv.textContent = key + ': ' + item.properties[key];
                propsContainer.appendChild(propDiv);
                hasProps = true;
            }
            if (!hasProps) propsContainer.style.display = 'none';
        }

        var qtyEl = clone.querySelector('[data-cart-line-qty]');
        if (qtyEl) qtyEl.textContent = item.quantity || 0;

        var minusBtn = clone.querySelector('[data-cart-action="minus"]');
        var plusBtn = clone.querySelector('[data-cart-action="plus"]');
        [minusBtn, plusBtn].forEach(function(b) {
            if (b) { b.dataset.cartItemId = line; b.dataset.cartItemQuantity = item.quantity || 0; }
        });

        container.appendChild(clone);
    }
}

/**
 * Sync a single charity section (product or cart context) from cart state.
 */
function syncCharitySection(section, donationItem, donationPrice, cleanSubtotal, includeProductPrice) {
    if (!section) { console.log('[syncCharitySection] BAIL: section null'); return; }

    var selectState = section.querySelector('[data-charity-state="select"]');
    var donatedState = section.querySelector('[data-charity-state="donated"]');
    console.log('[syncCharitySection] context:', section.dataset.charityContext, '| donationItem:', !!donationItem, '| selectState:', !!selectState, '| donatedState:', !!donatedState, '| selectState.hidden:', selectState ? selectState.classList.contains('hidden') : '?', '| donatedState.hidden:', donatedState ? donatedState.classList.contains('hidden') : '?');

    if (donationItem) {
        // Donated: show donated, hide select
        if (selectState) selectState.classList.add('hidden');
        if (donatedState) {
            donatedState.classList.remove('hidden');
            donatedState.classList.remove('opacity-0');
            // Update donated message if present
            var msgEl = donatedState.querySelector('[data-charity-donated-message]');
            if (msgEl && msgEl.dataset.charityDonatedMessage) {
                msgEl.textContent = msgEl.dataset.charityDonatedMessage.replace('__AMOUNT__', formatMoney(donationPrice));
            }
            // Update cart donated label from donation_type property
            var labelEl = donatedState.querySelector('[data-charity-donated-label]');
            if (labelEl && donationItem.properties) {
                var dtype = donationItem.properties['donation_type'];
                if (dtype) {
                    // Prefer the translated template baked into the markup (bilingual),
                    // fall back to a plain suffix if the template is missing.
                    var labelTemplate = labelEl.dataset.charityDonatedLabelTemplate;
                    if (labelTemplate) {
                        labelEl.textContent = labelTemplate.replace('__TYPE__', dtype);
                    } else {
                        labelEl.textContent = dtype + '. Thank you.';
                    }
                }
            }
            // Sync the tax-receipt consent checkbox to the cart's actual consent
            // flag so the product surface and the cart drawer stay consistent
            // (toggling consent on one surface must reflect on the other).
            var consentCb = donatedState.querySelector('[data-charity-consent-checkbox]');
            if (consentCb) {
                var hasConsent = donationItem.properties && donationItem.properties['_orbis_tax_receipt_consent'] === 'true';
                if (consentCb.checked !== hasConsent) consentCb.checked = hasConsent;
            }
        }
        var priceDisplay = document.querySelector('[data-charity-donation-price]');
        if (priceDisplay) priceDisplay.textContent = formatMoney(donationPrice);
        delete section.dataset.charitySelected;
    } else {
        // Select: show select, hide donated
        if (selectState) {
            selectState.classList.remove('hidden');
            selectState.classList.remove('opacity-0');
            // Reset cart rows to chips
            setCartRow(selectState, 'chips');
        }
        // Detect a remove (donated was visible and is now being hidden) so the
        // selection form is fully reset: close/clear the custom amount input
        // and reset the tax-receipt consent checkbox to a fresh state.
        var wasDonatedVisible = donatedState && !donatedState.classList.contains('hidden');
        if (donatedState) donatedState.classList.add('hidden');
        if (wasDonatedVisible && selectState) {
            var customInput = selectState.querySelector('[data-charity-custom-input]');
            if (customInput) customInput.classList.add('hidden');
            var customAmount = selectState.querySelector('[data-charity-custom-amount]');
            if (customAmount) customAmount.value = '';
            var consentCb = selectState.querySelector('[data-charity-consent-checkbox]');
            if (consentCb) consentCb.checked = false;
        }
        console.log('[syncCharitySection] AFTER toggle — selectState.hidden:', selectState ? selectState.classList.contains('hidden') : '?', '| donatedState.hidden:', donatedState ? donatedState.classList.contains('hidden') : '?');
        delete section.dataset.charitySelected;
        section.querySelectorAll('[data-charity-select]').forEach(function(chip) {
            chip.classList.remove('border-brand-500', 'bg-brand-200');
            chip.classList.add('border-content-light', 'bg-surface-white');
        });
        var ct = section.querySelector('[data-charity-custom-toggle]');
        if (ct) { ct.classList.remove('border-brand-500', 'bg-brand-200'); ct.classList.add('border-content-light', 'bg-surface-white'); }
        var summary = section.querySelector('[data-charity-summary]');
        if (summary) { summary.classList.add('hidden'); summary.classList.remove('rz-fade-in'); }
    }

    var productPriceCents = 0;
    if (includeProductPrice) {
        var priceEl = document.querySelector('[data-product-display-price]');
        if (priceEl) {
            var raw = priceEl.textContent.replace(/[^0-9.,]/g, '').trim();
            if (/,\d{2}$/.test(raw)) { raw = raw.replace(/\./g, '').replace(',', '.'); }
            else { raw = raw.replace(/,/g, ''); }
            var parsed = parseFloat(raw);
            if (!isNaN(parsed) && parsed > 0) productPriceCents = Math.round(parsed * 100);
        }
    }
    var totalCents = cleanSubtotal + productPriceCents;
    section.dataset.charityBaseAmount = totalCents;
    section.dataset.charityCartSubtotal = cleanSubtotal;

    section.querySelectorAll('[data-charity-amount]').forEach(function(span) {
        var pct = parseInt(span.dataset.charityAmount);
        if (!pct || pct <= 0) return;
        span.textContent = formatMoney(Math.round((pct / 100) * totalCents));
    });

    var selected = section.dataset.charitySelected;
    var sumEl = section.querySelector('[data-charity-summary]');
    var amountEl = section.querySelector('[data-charity-summary-amount]');
    if (selected && sumEl && amountEl && !sumEl.classList.contains('hidden')) {
        if (selected.indexOf('custom:') === 0) {
            amountEl.textContent = '$' + parseFloat(selected.split(':')[1]).toFixed(2).replace(/\.00$/, '');
        } else {
            var pct = parseInt(selected);
            if (pct > 0) amountEl.textContent = formatMoney(Math.round((pct / 100) * totalCents));
        }
    }
}

export function updateCartCount() {

    fetch(window.Shopify.routes.root + "cart.js")
    .then((res) => {
        if(!res.ok) {
            throw new Error();
        }
        return res.json()
    })
    .then((data) => {
        // Sum all item quantities, omit donation
        var totalQty = 0;
        if (data.items) {
            data.items.forEach(function(item) {
                if (item.variant_id !== 45690314653749) totalQty += item.quantity || 0;
            });
        }
        handleCartCount(totalQty);
        // Refresh charity donation amounts on product page when cart changes
        refreshCharityDonationFromCart(data);
    })
    .catch((error) => {
        console.error(error)
    })
    .finally(() => {
    })

    function refreshCharityDonationFromCart(cartData) {
        syncCartUI(cartData, true);
    }

    function handleCartTotal(total) {
        let currencySymbol = document.querySelector('[data-currency-symbol]').dataset.currencySymbol
        let text = currencySymbol
        if(total === 0) {
            text += total + '.00'
        } else if(total.toString().length === 2) {
            text += '0.' + total
        } else {
            let prefix = total.toString().slice(0,-2)
            let suffix = total.toString().slice(-2)
            text += prefix + '.' + suffix
        }
        text += ' ' + window.Shopify.currency.active

        const cartTotalElementList = document.querySelectorAll('[data-cart-total]')
        cartTotalElementList.forEach((cartTotalElement) => {
            cartTotalElement.innerText = text
        })
    }

    function handleCartCount(count) {

        const cartCountElementList = document.querySelectorAll('[data-cart-count]')
        cartCountElementList.forEach((cartCountElement) => {
            if(count <= 0) {
                cartCountElement.classList.remove('opacity-100')
                cartCountElement.classList.add('opacity-0')
            } else {
                cartCountElement.classList.remove('opacity-0')
                cartCountElement.classList.add('opacity-100')
            }
            cartCountElement.innerText = count
        })
    }

}

export function initCharityDonation() {

    document.addEventListener('click', handleCharityDonation);

    // ── Consent checkbox in donated/confirmation state — sync the cart line property ──
    var consentToggles = document.querySelectorAll('[data-charity-consent-toggle]');
    consentToggles.forEach(function(toggle) {
        var checkbox = toggle.querySelector('[data-charity-consent-checkbox]');
        if (!checkbox) return;
        checkbox.addEventListener('change', function() {
            var section = toggle.closest('[data-charity-donation]');
            var donatedState = section ? section.querySelector('[data-charity-state="donated"]') : null;
            // Only push to the cart when the donation is already added (donated state visible)
            if (!donatedState || donatedState.classList.contains('hidden')) return;
            var variantId = parseInt(section.dataset.charityVariantId);
            if (!variantId) return;
            updateCharityConsentProperty(variantId, checkbox.checked, checkbox);
        });
    });

    function handleCharityDonation(event) {

        // ── Already-donated remove button — remove charity from cart ──
        const removeCartBtn = event.target.closest('[data-charity-remove-cart]');
        if (removeCartBtn) {
            event.preventDefault();
            removeCartBtn.disabled = true;

            var removeSection = removeCartBtn.closest('[data-charity-donation]');
            var donatedState = removeSection ? removeSection.querySelector('[data-charity-state="donated"]') : null;
            if (donatedState) {
                donatedState.classList.add('opacity-0', 'transition-opacity', 'duration-200');
            }

            fetch(window.Shopify.routes.root + 'cart.js')
                .then(function(r) { return r.json(); })
                .then(function(cart) {
                    console.log('[charity-remove-cart] cart.js for removal — items:', cart.items ? cart.items.length : 0);
                    var charityItem = cart.items.find(function(i) { return i.variant_id === 45690314653749; });
                    if (!charityItem) return Promise.reject(new Error('not found'));
                    return fetch(window.Shopify.routes.root + 'cart/change.js', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ line: cart.items.indexOf(charityItem) + 1, quantity: 0 })
                    }).then(function(r) {
                        if (!r.ok) return r.json().then(function(err) { return Promise.reject(err); });
                        return r.json();
                    });
                })
                .then(function(updatedCart) {
                    // syncCartUI handles ALL inline updates — no section refetch needed
                    syncCartUI(updatedCart, false);

                    // selectState is now visible (syncCharitySection removed hidden) — fade it in
                    var selectState = removeSection ? removeSection.querySelector('[data-charity-state="select"]') : null;
                    if (selectState && !selectState.classList.contains('hidden')) {
                        selectState.classList.add('opacity-0');
                        requestAnimationFrame(function() {
                            selectState.classList.add('transition-opacity', 'duration-200');
                            selectState.classList.remove('opacity-0');
                        });
                    }
                })
                .catch(function(err) {
                    console.error('[charity-remove-cart] FAILED:', err);
                    if (removeCartBtn) removeCartBtn.disabled = false;
                    if (donatedState) {
                        donatedState.classList.remove('opacity-0', 'transition-opacity', 'duration-200');
                    }
                });
            return;
        }

        // ── Remove button — clear selection, hide summary ──
        const removeBtn = event.target.closest('[data-charity-remove]');
        if (removeBtn) {
            event.preventDefault();
            const section = removeBtn.closest('[data-charity-donation]');
            if (section) {
                delete section.dataset.charitySelected;
                updateChipSelectedStates(section, null);
                const summary = section.querySelector('[data-charity-summary]');
                if (summary) {
                    summary.classList.add('hidden');
                    summary.classList.remove('rz-fade-in');
                }
                const customInput = section.querySelector('[data-charity-custom-input]');
                if (customInput) customInput.classList.add('hidden');
            }
            return;
        }

        // ── Other chip — show custom input ──
        const customToggle = event.target.closest('[data-charity-custom-toggle]');
        if (customToggle) {
            event.preventDefault();
            const section = customToggle.closest('[data-charity-donation]');
            if (!section) return;

            // Cart: swap chips row → custom row inline
            if (section.dataset.charityContext === 'cart') {
                setCartRow(section, 'custom');
                var amountInput = section.querySelector('[data-charity-custom-amount]');
                if (amountInput) { amountInput.value = ''; amountInput.focus(); }
                return;
            }

            // Product: existing behavior
            delete section.dataset.charitySelected;
            updateChipSelectedStates(section, 'custom');

            const summary = section.querySelector('[data-charity-summary]');
            if (summary) { summary.classList.add('hidden'); summary.classList.remove('rz-fade-in'); }

            const customInput = section.querySelector('[data-charity-custom-input]');
            if (customInput) {
                customInput.classList.remove('hidden');
                const amountInput = customInput.querySelector('[data-charity-custom-amount]');
                if (amountInput) amountInput.focus();
            }
            return;
        }

        // ── Cart: cancel custom amount, return to chips ──
        const cancelBtn = event.target.closest('[data-charity-custom-cancel]');
        if (cancelBtn) {
            event.preventDefault();
            const section = cancelBtn.closest('[data-charity-donation]');
            if (!section) return;
            setCartRow(section, 'chips');
            var amountInput = section.querySelector('[data-charity-custom-amount]');
            if (amountInput) amountInput.value = '';
            return;
        }

        // ── Product mode: preset chip selection ──
        const selectBtn = event.target.closest('[data-charity-select]');
        if (selectBtn) {
            event.preventDefault();
            const section = selectBtn.closest('[data-charity-donation]');
            if (!section) return;

            const value = selectBtn.dataset.charitySelect;

            // Toggle: if already selected, deselect
            if (section.dataset.charitySelected === value) {
                delete section.dataset.charitySelected;
                updateChipSelectedStates(section, null);
                const summary = section.querySelector('[data-charity-summary]');
                if (summary) { summary.classList.add('hidden'); summary.classList.remove('rz-fade-in'); }
                return;
            }

            section.dataset.charitySelected = value;
            updateChipSelectedStates(section, value);

            // Hide custom input if it was open
            const customInput = section.querySelector('[data-charity-custom-input]');
            if (customInput) customInput.classList.add('hidden');

            // Calculate and show summary with fade
            const baseAmount = parseInt(section.dataset.charityBaseAmount) || 0;
            const pct = parseInt(value);
            const amountCents = Math.round((pct / 100) * baseAmount);
            showSummary(section, formatMoney(amountCents));
            return;
        }

        // ── Product mode: custom amount confirm ──
        const selectCustomBtn = event.target.closest('[data-charity-select-custom]');
        if (selectCustomBtn) {
            event.preventDefault();
            const section = selectCustomBtn.closest('[data-charity-donation]');
            if (!section) return;

            const customInput = section.querySelector('[data-charity-custom-amount]');
            const customDollars = parseFloat(customInput?.value);
            if (!customDollars || customDollars <= 0) return;

            const value = 'custom:' + customDollars;
            section.dataset.charitySelected = value;

            // Hide custom input
            const customInputWrapper = section.querySelector('[data-charity-custom-input]');
            if (customInputWrapper) customInputWrapper.classList.add('hidden');

            // Show summary with fade
            showSummary(section, '$' + customDollars.toFixed(2).replace(/\.00$/, ''));
            return;
        }

        // ── Cart mode: inline remove from summary ──
        const inlineRemoveBtn = event.target.closest('[data-charity-remove-inline]');
        if (inlineRemoveBtn) {
            event.preventDefault();
            var irVariantId = parseInt(inlineRemoveBtn.dataset.charityVariantId);
            var irSection = inlineRemoveBtn.closest('[data-charity-donation]');
            if (irSection && irSection.dataset.charityVariantId) {
                irVariantId = parseInt(irSection.dataset.charityVariantId);
            }
            if (!irVariantId) return;

            // Fade out
            var charityArea = document.getElementById('cart-drawer-charity');
            if (charityArea) charityArea.classList.add('opacity-0');

            fetch(window.Shopify.routes.root + 'cart.js')
                .then(function(r) { return r.json(); })
                .then(function(cart) {
                    var charityItem = cart.items.find(function(i) { return i.variant_id === irVariantId; });
                    if (!charityItem) return Promise.reject(new Error('not found'));
                    return fetch(window.Shopify.routes.root + 'cart/change.js', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ line: cart.items.indexOf(charityItem) + 1, quantity: 0 })
                    }).then(function(r) {
                        if (!r.ok) return r.json().then(function(err) { return Promise.reject(err); });
                        return r.json();
                    });
                })
                .then(function(updatedCart) {
                    console.log('[inline-remove] cart/change.js OK — items:', updatedCart.items ? updatedCart.items.length : '?', '| subtotal:', updatedCart.items_subtotal_price);
                    syncCartUI(updatedCart, false);
                    if (charityArea) charityArea.classList.remove('opacity-0');
                })
                .catch(function(err) {
                    console.error('[inline-remove] FAILED:', err);
                    if (charityArea) charityArea.classList.remove('opacity-0');
                });
            return;
        }

        // ── Cart mode: standalone add-to-cart ──
        const donateBtn = event.target.closest('[data-charity-donate]');
        if (!donateBtn) return;

        event.preventDefault();

        const section = donateBtn.closest('[data-charity-donation]');
        if (!section) return;

        const variantId = parseInt(section.dataset.charityVariantId);
        const baseAmount = parseInt(section.dataset.charityBaseAmount) || 0;
        const donateValue = donateBtn.dataset.charityDonate;

        if (!variantId) return;

        var quantity = 0;
        var donationLabel = '';

        if (donateValue === 'custom') {
            var customInput = section.querySelector('[data-charity-custom-amount]');
            var customDollars = parseFloat(customInput ? customInput.value : 0);
            if (!customDollars || customDollars <= 0) return;
            quantity = Math.round(customDollars * 100);
            donationLabel = '$' + customDollars.toFixed(2).replace(/\.00$/, '') + ' donation';
        } else {
            var percent = parseInt(donateValue);
            if (!percent || percent <= 0) return;
            quantity = Math.round((percent / 100) * baseAmount);
            donationLabel = percent + '% of your order';
        }

        if (quantity <= 0) return;

        donateBtn.disabled = true;

        var consentCheckbox = section.querySelector('[data-charity-state="select"] [data-charity-consent-checkbox]');
        var props = { 'donation_type': donationLabel };
        if (consentCheckbox && consentCheckbox.checked) {
            props['_orbis_tax_receipt_consent'] = 'true';
        } else if (consentCheckbox && !consentCheckbox.checked) {
            // Nudge: briefly highlight the consent area so the user notices it
            nudgeConsentRow(section);
        }

        var formData = {
            id: variantId,
            quantity: quantity,
            properties: props
        };

        // Fade out select state while request is in flight
        if (section.dataset.charityContext === 'cart') {
            var selectState = section.querySelector('[data-charity-state="select"]');
            if (selectState) selectState.classList.add('opacity-0', 'transition-opacity', 'duration-200');
        }

        fetch(window.Shopify.routes.root + 'cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(function(res) {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(function() {
            // syncCartUI handles ALL UI: cart count, subtotal, charity state toggles, recalc
            // Fetch fresh cart data so syncCartUI has the complete picture
            return fetch(window.Shopify.routes.root + 'cart.js').then(function(r) { return r.json(); });
        })
        .then(function(cartData) {
            syncCartUI(cartData, true);
            // Clean up custom amount input
            var amtInput = section.querySelector('[data-charity-custom-amount]');
            if (amtInput) amtInput.value = '';
        })
        .catch(function() {
            // Restore on failure
            var selEl = section.querySelector('[data-charity-state="select"]');
            if (selEl) selEl.classList.remove('opacity-0');
            setCartRow(section, 'chips');
        })
        .finally(function() {
            donateBtn.disabled = false;
        });
    }

    /**
     * Update visual selected state on all chips in a donation section.
     */
    function updateChipSelectedStates(section, selectedValue) {
        const allChips = section.querySelectorAll('[data-charity-select]');
        const customToggleBtn = section.querySelector('[data-charity-custom-toggle]');
        const selectedClass = ['border-brand-500', 'bg-brand-200'];
        const unselectedClass = ['border-content-light', 'bg-surface-white'];

        allChips.forEach(chip => {
            if (chip.dataset.charitySelect === selectedValue) {
                chip.classList.add(...selectedClass);
                chip.classList.remove(...unselectedClass);
            } else {
                chip.classList.remove(...selectedClass);
                chip.classList.add(...unselectedClass);
            }
        });

        if (customToggleBtn) {
            const isCustom = selectedValue && selectedValue.startsWith('custom');
            if (isCustom) {
                customToggleBtn.classList.add(...selectedClass);
                customToggleBtn.classList.remove(...unselectedClass);
            } else {
                customToggleBtn.classList.remove(...selectedClass);
                customToggleBtn.classList.add(...unselectedClass);
            }
        }
    }

    function showSummary(section, amountText) {
        const summary = section.querySelector('[data-charity-summary]');
        const amountEl = section.querySelector('[data-charity-summary-amount]');
        if (!summary) return;
        if (amountEl) amountEl.textContent = amountText;
        summary.classList.remove('hidden');
        // Trigger fade-in animation
        summary.classList.remove('rz-fade-in');
        void summary.offsetWidth; // force reflow
        summary.classList.add('rz-fade-in');
    }
}

/**
 * Recalculate and update the displayed dollar amounts on charity donation chips
 * when the base price changes (variant switch, product forms update).
 */
export function updateCharityDonationAmounts(priceCents) {
    const section = document.querySelector('[data-charity-donation][data-charity-context="product"]');
    if (!section || !priceCents || priceCents <= 0) return;

    // Base = existing cart subtotal + current variant price = projected order total
    const cartSubtotal = parseInt(section.dataset.charityCartSubtotal) || 0;
    const totalCents = cartSubtotal + priceCents;
    section.dataset.charityBaseAmount = totalCents;

    // Update displayed dollar amounts on each chip
    section.querySelectorAll('[data-charity-amount]').forEach(span => {
        const pct = parseInt(span.dataset.charityAmount);
        if (!pct || pct <= 0) return;
        span.textContent = formatMoney(Math.round((pct / 100) * totalCents));
    });

    // Update confirmation banner if a chip is selected
    const selected = section.dataset.charitySelected;
    const summary = section.querySelector('[data-charity-summary]');
    const amountEl = section.querySelector('[data-charity-summary-amount]');
    if (selected && summary && amountEl && !summary.classList.contains('hidden')) {
        if (selected.startsWith('custom:')) {
            const d = parseFloat(selected.split(':')[1]);
            amountEl.textContent = '$' + d.toFixed(2).replace(/\.00$/, '');
        } else {
            const pct = parseInt(selected);
            if (pct > 0) amountEl.textContent = formatMoney(Math.round((pct / 100) * totalCents));
        }
    }
}

export function formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2).replace(/\.00$/, '');
}

/**
 * Centralized button state manager.
 *
 * For simple buttons (text-only): manages class + disabled + text restore.
 * For complex buttons (with data-add-state children): manages class + disabled only;
 *   inner elements handle their own text/icon swapping.
 *
 * Usage:
 *   setBtnState(btn, 'loading')           → pressed + breathing sheen
 *   setBtnState(btn, 'success')           → trust ring pulse, auto-clears
 *   setBtnState(btn, 'error')             → shake, auto-clears
 *   setBtnState(btn, 'default')           → back to normal
 */
export function setBtnState(btn, state) {
    if (!btn) return;

    var hasStateChildren = btn.querySelector('[data-add-state]');

    // Clear all state classes
    btn.classList.remove('rz-btn-loading', 'rz-btn-success', 'rz-btn-error');
    btn.style.transform = '';

    if (state === 'loading') {
        if (!hasStateChildren && !btn.dataset.originalText) {
            btn.dataset.originalText = btn.textContent.trim();
        }
        btn.classList.add('rz-btn-loading');
        btn.disabled = true;
    } else if (state === 'success') {
        btn.classList.add('rz-btn-success');
        btn.disabled = true;
        setTimeout(function() {
            btn.classList.remove('rz-btn-success');
            btn.disabled = false;
            if (!hasStateChildren && btn.dataset.originalText) {
                btn.textContent = btn.dataset.originalText;
            }
        }, 1500);
    } else if (state === 'error') {
        btn.classList.add('rz-btn-error');
        btn.disabled = true;
        setTimeout(function() {
            btn.classList.remove('rz-btn-error');
            btn.disabled = false;
            if (!hasStateChildren && btn.dataset.originalText) {
                btn.textContent = btn.dataset.originalText;
            }
        }, 600);
    } else {
        btn.disabled = false;
        if (!hasStateChildren && btn.dataset.originalText) {
            btn.textContent = btn.dataset.originalText;
        }
    }
}
