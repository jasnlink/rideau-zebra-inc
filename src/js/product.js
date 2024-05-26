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
        maxVariantWidth: 90,
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
        if (window.productForms.selectedVariantWidth <= window.productForms.minVariantWidth) {
            window.productForms.selectedVariantWidth = window.productForms.minVariantWidth
        }
        if (window.productForms.selectedVariantWidth >= window.productForms.maxVariantWidth) {
            window.productForms.selectedVariantWidth = window.productForms.maxVariantWidth
        }
    }

    function selectVariant(selectedVariantWidth) {

        const variantSelector = document.querySelector('[data-selector-element-type="dropdown"]')
        for (const option of variantSelector.options) {
            const optionValue = parseInt(option.getAttribute('data-selector-option-value').split('x')[0].split('_')[0])
            if (optionValue === selectedVariantWidth) {
                variantSelector.value = option.value
                variantSelector.dispatchEvent(new Event('change'));
                return
            }
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
                    document.querySelector('footer').classList.remove('mb-24')
                } else {
                    overlayElement.classList.remove('hidden')
                    document.querySelector('footer').classList.add('mb-24')
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
                optionElement.classList.remove('bg-black')
                optionElement.classList.remove('text-white')
                optionElement.classList.add('bg-white')
                optionElement.classList.add('text-black')
            })
        }
        selectionState[targetOptionIndex]['value'] = element.dataset.selectorOptionValue
        document.querySelectorAll('[data-selector-option-group-index="'+targetOptionIndex+'"] [data-selector-option-value="'+selectionState[targetOptionIndex]['value']+'"]')
        .forEach((optionElement) => {
            let optionGroupElement = optionElement.closest('[data-selector-element-type]')
            if(optionGroupElement.dataset.selectorElementType === 'dropdown') {
                optionGroupElement.selectedIndex = parseInt(optionElement.dataset.selectorOptionIndex)
            }
            optionElement.classList.remove('bg-white')
            optionElement.classList.remove('text-black')
            optionElement.classList.add('bg-black')
            optionElement.classList.add('text-white')
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
            if (!foundElement.getAttribute('data-variant-available') || foundElement.getAttribute('data-variant-available') === 'false') {
                document.querySelectorAll('[data-add-cart]').forEach(element => {
                    element.dataset.addCart = null
                    element.disabled = true
                })
            }
        } else {
            document.querySelectorAll('[data-add-cart]').forEach(element => {
                element.dataset.addCart = null
                element.disabled = true
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