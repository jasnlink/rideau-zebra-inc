import Glide from "@glidejs/glide";
import { initAddCartAction } from "./lib";

window.addEventListener('DOMContentLoaded', (event) => {
    new Glide('.glide').mount();
    initAddCartAction();
    initProductTabAction();
    initVariantSelector();
    initPurchaseOverlay();
    initProductInstallService();
    initProductForms();
});

function initProductForms() {

    const productFormsElement = document.querySelector('[data-rz-product-forms="form"]')

    if (!productFormsElement) {
        return
    }

    window.productForms = {
        productFormsElement: productFormsElement,
        productFormsMeasurementUnitInputElement: productFormsElement.querySelector('[data-rz-product-forms="measurement-unit-input"]'),
        productFormsWidthInputElement: productFormsElement.querySelector('[data-rz-product-forms="width-input"]'),
        productFormsHeightInputElement: productFormsElement.querySelector('[data-rz-product-forms="height-input"]'),
        productFormsDepthInputElement: productFormsElement.querySelector('[data-rz-product-forms="depth-input"]'),
        productFormsRoomNameInputElement: productFormsElement.querySelector('[data-rz-product-forms="room-name-input"]'),
        productFormsMountInputElements: productFormsElement.querySelectorAll('[data-rz-product-forms="mount-input"]'),
        productFormsWidthAssetElement: productFormsElement.querySelector('[data-rz-product-forms="width-asset"]'),
        productFormsHeightAssetElement: productFormsElement.querySelector('[data-rz-product-forms="height-asset"]'),
        measurementUnitsMultiplier: {
            cm: 0.393701,
            in: 1,
        },
        selectedVariantId: null,
        selectedVariantWidth: null,
        minVariantWidth: 10,
        maxVariantWidth: 200,
        enabled: true,
    }

    window.productForms.productFormsMountInputElements.forEach(element => {
        element.addEventListener('change', event => {
            window.productForms.productFormsWidthAssetElement.src = event.target.getAttribute('data-rz-product-forms-width-asset-url')
            window.productForms.productFormsHeightAssetElement.src = event.target.getAttribute('data-rz-product-forms-height-asset-url')

            const productFormsDepthBlockElement = document.querySelector('[data-rz-product-forms="depth"]')
            if (productFormsDepthBlockElement) {
                if (event.target.getAttribute('data-rz-product-forms-depth-show') === 'true') {
                    productFormsDepthBlockElement.classList.remove('hidden')
                    window.productForms.productFormsDepthInputElement.toggleAttribute('required', true)
                } else {
                    productFormsDepthBlockElement.classList.add('hidden')
                    window.productForms.productFormsDepthInputElement.toggleAttribute('required', false)
                }
            }
        })
    })

    productFormsElement.querySelectorAll('[data-rz-product-forms="measurement-unit-display"]').forEach(element => {
        element.textContent = window.productForms.productFormsMeasurementUnitInputElement.options[window.productForms.productFormsMeasurementUnitInputElement.options.selectedIndex].textContent
    })
    window.productForms.productFormsMeasurementUnitInputElement.addEventListener('change', (event) => {
        calculateVariantWidth(window.productForms.productFormsWidthInputElement.value, event.target.value)
        selectVariant(window.productForms.selectedVariantWidth)
        productFormsElement.querySelectorAll('[data-rz-product-forms="measurement-unit-display"]').forEach(element => {
            element.textContent = event.target.options[event.target.options.selectedIndex].textContent
        })
    })

    productFormsElement.addEventListener('reset', (event) => {
        const productFormsDepthBlockElement = document.querySelector('[data-rz-product-forms="depth"]')
        if (productFormsDepthBlockElement) {
            productFormsDepthBlockElement.classList.remove('hidden')
            window.productForms.productFormsDepthInputElement.toggleAttribute('required', true)
        }
    })

    window.productForms.productFormsWidthInputElement.addEventListener('input', (event) => {
        calculateVariantWidth(event.target.value, window.productForms.productFormsMeasurementUnitInputElement.value)
        selectVariant(window.productForms.selectedVariantWidth)
    })

    function calculateVariantWidth(width, unit) {
        window.productForms.selectedVariantWidth = Math.ceil(parseFloat(width) * window.productForms.measurementUnitsMultiplier[unit] || 0)
    }

    function selectVariant(selectedVariantWidth) {

        const variantSelector = document.querySelector('[data-selector-element-type="dropdown"]')
        const warningEl = document.querySelector('[data-rz-width-warning]')
        const warningTextEl = warningEl ? warningEl.querySelector('[data-rz-width-warning-text]') : null
        let availableWidths = []
        let exactMatch = null

        // Collect all available widths and look for exact match
        for (const option of variantSelector.options) {
            const optionValue = parseInt(option.getAttribute('data-selector-option-value').split('x')[0].split('_')[0])
            availableWidths.push({ width: optionValue, option: option })

            if (optionValue === selectedVariantWidth) {
                exactMatch = option
            }
        }

        // Sort available widths
        availableWidths.sort((a, b) => a.width - b.width)

        const minAvailable = availableWidths[0] ? availableWidths[0].width : 0
        const maxAvailable = availableWidths.length ? availableWidths[availableWidths.length - 1].width : 0

        // Helper to show warning and disable add to cart
        function showWarning(msgKey) {
            if (warningEl && warningTextEl) {
                warningTextEl.textContent = warningEl.getAttribute('data-rz-width-warning-' + msgKey)
                warningEl.classList.remove('hidden')
                warningEl.classList.add('flex')
            }
            document.querySelectorAll('[data-add-cart]').forEach(el => {
                el.dataset.addCart = null
                el.disabled = true
            })
        }

        function hideWarning() {
            if (warningEl) {
                warningEl.classList.add('hidden')
                warningEl.classList.remove('flex')
            }
        }

        // Check lower limit — if width is below smallest available variant
        if (selectedVariantWidth > 0 && selectedVariantWidth < minAvailable) {
            showWarning('too-small')
            return
        }

        // Check upper limit — only enforce if the 91" extra-large variant does NOT exist.
        // If 91 exists, any width above it just matches to 91 (extra-large pricing, no cap).
        const hasExtraLarge = availableWidths.some(item => item.width === 91)
        if (!hasExtraLarge && selectedVariantWidth > maxAvailable) {
            showWarning('too-large')
            return
        }

        // Valid range — hide any warning
        hideWarning()

        // If exact match found, select it
        if (exactMatch) {
            variantSelector.value = exactMatch.value
            variantSelector.dispatchEvent(new Event('change'));
            return
        }

        // If no input yet, select smallest
        if (selectedVariantWidth <= 0) {
            const smallestOption = availableWidths[0]
            if (smallestOption) {
                variantSelector.value = smallestOption.option.value
                variantSelector.dispatchEvent(new Event('change'));
                return
            }
        }

        // For values in between, find the closest available width that is >= input
        let closestOption = null
        for (const item of availableWidths) {
            if (item.width >= selectedVariantWidth) {
                closestOption = item.option
                break
            }
        }

        // Fallback to largest if nothing >= exists (shouldn't happen due to upper limit check)
        if (!closestOption) {
            closestOption = availableWidths[availableWidths.length - 1].option
        }

        if (closestOption) {
            variantSelector.value = closestOption.value
            variantSelector.dispatchEvent(new Event('change'));
        }
    }

}

function initProductInstallService() {
    const installServiceElement = document.querySelector('[data-product-install-service-item-id]')

    if (!installServiceElement) {
        return
    }

    const installServiceId = installServiceElement.getAttribute('data-product-install-service-item-id')

    installServiceElement.addEventListener('change', (event) => {
        if (event.currentTarget.checked) {
            document.querySelectorAll('[data-add-cart]').forEach(element => {
                const currentAddCartIds = element.getAttribute('data-add-cart').split(',')
                currentAddCartIds.push(installServiceId)
                currentAddCartIds.join(',')
                element.setAttribute('data-add-cart', currentAddCartIds)
            })
        } else {
            document.querySelectorAll('[data-add-cart]').forEach(element => {
                let currentAddCartIds = element.getAttribute('data-add-cart').split(',')
                currentAddCartIds = currentAddCartIds.filter((value, index, array) => value !== installServiceId)
                currentAddCartIds.join(',')
                element.setAttribute('data-add-cart', currentAddCartIds)
            })
        }
    })

}

function initPurchaseOverlay() {

    let observeElement = document.querySelector('[data-overlay-listen]')
    if(observeElement) {
        let options = {
            rootMargin: '0px',
            threshold: 1.0
        }
        let observer = new IntersectionObserver(handleIntersect, options);
        observer.observe(observeElement);

        function handleIntersect(entries) {
            let overlayElement = document.querySelector('[data-overlay-action]')

            if(!overlayElement) {
                return
            }

            entries.forEach((entry) => {
                // isIntersecting means we see the target element (add to cart button)
                if (entry.isIntersecting || entry.boundingClientRect.top > 0) {
                    overlayElement.classList.add('hidden')
                    // document.querySelector('footer').classList.remove('mb-24')
                } else {
                    overlayElement.classList.remove('hidden')
                    // document.querySelector('footer').classList.add('mb-24')
                }
            });
        }
    }

}

function initVariantSelector() {

    let selectionState = {}
    document.querySelectorAll('[data-selector-option-group-index]').forEach(element => {
        let targetOptionIndex = parseInt(element.dataset.selectorOptionGroupIndex)
        selectionState[targetOptionIndex] = {
            value: null
        }
    })

    document.querySelectorAll('[data-selector-element-type]').forEach(selectorElement => {
        let selectorType = selectorElement.dataset.selectorElementType
        if(selectorType === 'button') {
            document.querySelectorAll('[data-selector-element-type="button"] [data-selector-default]').forEach(element => handleSelection(element))
            let selectorActionElementList = document.querySelectorAll('[data-selector-action]');
            selectorActionElementList.forEach(element => {
                element.addEventListener('click', event => {
                    event.preventDefault();
                    handleSelection(event.currentTarget);
                })
            })
        } else if(selectorType === 'dropdown') {
            document.querySelectorAll('[data-selector-element-type="dropdown"] [data-selector-default]').forEach(element => handleSelection(element))
            selectorElement.addEventListener('change', event => {
                event.preventDefault();
                let selectedOption = event.target.options[event.target.options.selectedIndex]
                handleSelection(selectedOption);
            })
        }
    })

    function handleSelection(element) {
        let targetOptionIndex = parseInt(element.dataset.selectorAction)

        if(selectionState[targetOptionIndex]['value']) {
            document.querySelectorAll('[data-selector-option-group-index="'+targetOptionIndex+'"] [data-selector-option-value="'+selectionState[targetOptionIndex]['value']+'"]')
            .forEach((optionElement) => {
                optionElement.classList.remove('bg-content')
                optionElement.classList.remove('text-content-inverse')
                optionElement.classList.add('bg-surface-white')
                optionElement.classList.add('text-content')
            })
        }
        selectionState[targetOptionIndex]['value'] = element.dataset.selectorOptionValue
        document.querySelectorAll('[data-selector-option-group-index="'+targetOptionIndex+'"] [data-selector-option-value="'+selectionState[targetOptionIndex]['value']+'"]')
        .forEach((optionElement) => {
            let optionGroupElement = optionElement.closest('[data-selector-element-type]')
            if(optionGroupElement.dataset.selectorElementType === 'dropdown') {
                optionGroupElement.selectedIndex = parseInt(optionElement.dataset.selectorOptionIndex)
            }
            optionElement.classList.remove('bg-surface-white')
            optionElement.classList.remove('text-content')
            optionElement.classList.add('bg-content')
            optionElement.classList.add('text-content-inverse')
        })
        searchVariantList()
    }

    function searchVariantList() {
        let search = ''
        Object.keys(selectionState).forEach((key) => {
            search += '[data-selector-variant-option-'+key+'="'+selectionState[key]['value']+'"]'
        })
        let foundElement = document.querySelector(search)
        if(foundElement) {
            console.log('searchVariantList')
            const installServiceElement = document.querySelector('[data-product-install-service-item-id]')
            const installServiceId = installServiceElement?.getAttribute('data-product-install-service-item-id')

            document.querySelectorAll('[data-add-cart]').forEach(element => {

                let currentAddCartIds = element.getAttribute('data-add-cart').split(',')
                currentAddCartIds = currentAddCartIds.filter((value, index, array) => value === installServiceId)
                currentAddCartIds.push(foundElement.getAttribute('data-selector-variant-id'))
                currentAddCartIds.join(',')
                element.setAttribute('data-add-cart', currentAddCartIds)
                element.setAttribute('data-add-cart-selected-product-variant-id', foundElement.getAttribute('data-selector-variant-id'))
                element.disabled = false

            })
            document.querySelectorAll('[data-product-display-price]').forEach(element => {
                element.textContent = foundElement.getAttribute('data-selector-variant-price')
            })
            document.querySelectorAll('[data-product-display-availability="true"]').forEach(element => {
                element.classList.remove('hidden')
                element.classList.add('flex')
            })
            document.querySelectorAll('[data-product-display-availability="false"]').forEach(element => {
                element.classList.add('hidden')
                element.classList.remove('flex')
            })

            if (!foundElement.getAttribute('data-variant-available') || foundElement.getAttribute('data-variant-available') === 'false') {
                document.querySelectorAll('[data-add-cart]').forEach(element => {
                    element.dataset.addCart = null
                    element.disabled = true
                })
                document.querySelectorAll('[data-product-display-availability="false"]').forEach(element => {
                    element.classList.remove('hidden')
                    element.classList.add('flex')
                })
                document.querySelectorAll('[data-product-display-availability="true"]').forEach(element => {
                    element.classList.add('hidden')
                    element.classList.remove('flex')
                })
            }
        } else {
            document.querySelectorAll('[data-add-cart]').forEach(element => {
                element.dataset.addCart = null
                element.disabled = true
            })
            document.querySelectorAll('[data-product-display-availability="false"]').forEach(element => {
                element.classList.remove('hidden')
                element.classList.add('flex')
            })
            document.querySelectorAll('[data-product-display-availability="true"]').forEach(element => {
                element.classList.add('hidden')
                element.classList.remove('flex')
            })
        }
    }

}

function initProductTabAction() {

    let currentTabState = []
    let tabgroupElementList = document.querySelectorAll('[data-product-tab-group]')

    tabgroupElementList.forEach((tabgroupElement) => {
        let selectedTabId = 0
        let tabgroupId = parseInt(tabgroupElement.dataset.productTabGroup)
        let selectedTabActionElement = tabgroupElement.querySelector('[data-product-tab-action="'+ selectedTabId +'"]')
        let shownTabElement = tabgroupElement.querySelector('[data-product-tab="'+ selectedTabId +'"]')

        currentTabState[tabgroupId] = {
            selectedTabId: null,
            selectedTabActionElement: selectedTabActionElement,
            shownTabElement: shownTabElement,
            tabgroupElement: tabgroupElement
        }
        handleTabSelection(currentTabState, selectedTabActionElement)
    })

    let tabActionElementList = document.querySelectorAll('[data-product-tab-action]')

    tabActionElementList.forEach(element => {
        element.addEventListener('click', event => {
            let clickedTabActionElement = event.currentTarget
            handleTabSelection(currentTabState, clickedTabActionElement)
        })
    })

    function handleTabSelection(currentTabState, clickedTabActionElement) {

        let clickedTabgroupId = parseInt(clickedTabActionElement.closest('[data-product-tab-group]').dataset.productTabGroup)
        let clickedTabId = parseInt(clickedTabActionElement.dataset.productTabAction)

        if(clickedTabId === currentTabState[clickedTabgroupId].selectedTabId) {
            return
        }

        if(currentTabState[clickedTabgroupId].selectedTabId !== null) {
            let currentShownTabElement = currentTabState[clickedTabgroupId].shownTabElement
            // Current
            currentShownTabElement.classList.toggle('opacity-100');
            currentShownTabElement.classList.toggle('opacity-0');
            currentShownTabElement.addEventListener('transitionend', () => {
                currentShownTabElement.classList.toggle('hidden');
                showNextElement()
            }, {once: true})
            currentTabState[clickedTabgroupId].selectedTabActionElement.classList.toggle('font-semibold')
            currentTabState[clickedTabgroupId].selectedTabActionElement.classList.toggle('font-light')
        } else {
            showNextElement()
        }
        function showNextElement() {
            // Next
            let nextShownTabElement = currentTabState[clickedTabgroupId].tabgroupElement.querySelector('[data-product-tab="'+ clickedTabId +'"]')
            nextShownTabElement.classList.toggle('hidden');
            nextShownTabElement.classList.toggle('opacity-0');
            nextShownTabElement.classList.toggle('opacity-100');
            clickedTabActionElement.classList.toggle('font-light')
            clickedTabActionElement.classList.toggle('font-semibold')
            currentTabState[clickedTabgroupId].shownTabElement = nextShownTabElement
            currentTabState[clickedTabgroupId].selectedTabId = clickedTabId
            currentTabState[clickedTabgroupId].selectedTabActionElement = clickedTabActionElement
        }


    }

}
