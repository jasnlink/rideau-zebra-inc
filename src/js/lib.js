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
                    charityPayload = {
                        id: variantId,
                        quantity: quantity,
                        properties: {
                            'donation_type': donationLabel
                        }
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

            const animationObjectElement = document.querySelector('[data-animation-object="cart"]')

            if (!animationObjectElement || !sourceElement) return

            let animationSourceElementRect = sourceElement.getBoundingClientRect()

            let animationObjectRect = animationObjectElement.getBoundingClientRect()

            let animationObjectSourceX = animationSourceElementRect.x + (animationSourceElementRect.width/2) - (animationObjectRect.width/2)
            let animationObjectSourceY = animationSourceElementRect.y - (animationObjectRect.height/2)

            animationObjectElement.style.setProperty('left', `${animationObjectSourceX}px`)
            animationObjectElement.style.setProperty('top', `${animationObjectSourceY}px`)
            animationObjectElement.style.setProperty('transition', `all .45s cubic-bezier(.55,.05,.92,.54) 0s`)

        }

        function playAnimation() {

            const animationObjectElement = document.querySelector('[data-animation-object="cart"]')
            const animationTargetElement = document.querySelector('[data-animation-target="cart"]')

            if (!animationObjectElement || !animationTargetElement) return

            animationObjectElement.classList.remove('hidden')

            let animationObjectRect = animationObjectElement.getBoundingClientRect()
            let animationTargetElementRect = animationTargetElement.getBoundingClientRect()

            let animationObjectTargetX = animationTargetElementRect.x + (animationTargetElementRect.width/2) - (animationObjectRect.width/2)
            let animationObjectTargetY = animationTargetElementRect.y + (animationTargetElementRect.height/2) - (animationObjectRect.height/2)

            setTimeout(() => {
                animationObjectElement.style.setProperty('left', `${animationObjectTargetX}px`)
                animationObjectElement.style.setProperty('top', `${animationObjectTargetY}px`)
            }, 20);

            animationObjectElement.addEventListener('transitionend', () => {
                animationObjectElement.style.setProperty('transition', ``)
                animationObjectElement.classList.add('hidden')
            }, {once:true})
        }

        function enableLoading(element) {
            element.querySelector('[data-add-state="default"]').classList.add('hidden')
            element.querySelector('[data-add-state="loading"]').classList.remove('hidden')
            element.disabled = true
        }

        function disableLoading(element, error=false) {
            element.querySelector('[data-add-state="loading"]').classList.add('hidden')
            if(error) {
                element.querySelector('[data-add-state="error"]').classList.remove('hidden')
                setTimeout(() => {
                    element.querySelector('[data-add-state="error"]').classList.add('hidden')
                    element.querySelector('[data-add-state="default"]').classList.remove('hidden')
                    element.disabled = false
                }, 500);
            } else {
                element.querySelector('[data-add-state="success"]').classList.remove('hidden')
                setTimeout(() => {
                    element.querySelector('[data-add-state="success"]').classList.add('hidden')
                    element.querySelector('[data-add-state="default"]').classList.remove('hidden')
                    element.disabled = false
                }, 500);
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
export function syncCartUI(cartData, recalcDonation) {
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

    // ── %-based donation recalculation ──
    if (recalcDonation !== false && donationItem) {
        var dtype = donationItem.properties ? donationItem.properties['donation_type'] : null;
        console.log('[syncCartUI-recalc] dtype:', dtype, '| recalcDonation:', recalcDonation);
        if (dtype && dtype.indexOf('% of your order') !== -1) {
            var percent = parseInt(dtype);
            console.log('[syncCartUI-recalc] percent:', percent, '| cleanSubtotal:', cleanSubtotal, '| donationPrice:', donationPrice);
            if (percent > 0) {
                var newQty = Math.round((percent / 100) * cleanSubtotal);
                if (newQty <= 0) newQty = 1;
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
                    labelEl.textContent = dtype + '. Thank you.';
                }
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
        if (donatedState) donatedState.classList.add('hidden');
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

        var formData = {
            id: variantId,
            quantity: quantity,
            properties: { 'donation_type': donationLabel }
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
