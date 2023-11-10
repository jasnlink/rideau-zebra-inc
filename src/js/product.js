import Glide from "@glidejs/glide";
import { initAddCartAction } from "./lib";

window.addEventListener('DOMContentLoaded', (event) => {
    new Glide('.glide').mount();
    initAddCartAction();
    initProductTabAction();
    initVariantSelector();
    initPurchaseOverlay();
});

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
                if (entry.isIntersecting) {
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
        console.log(`searchVariantList`, selectionState)
        Object.keys(selectionState).forEach((key) => {
            search += '[data-selector-variant-option-'+key+'="'+selectionState[key]['value']+'"]'
        })
        let foundElement = document.querySelector(search)
        if(foundElement) {
            document.querySelectorAll('[data-add-cart]').forEach(element => {
                element.dataset.addCart = foundElement.dataset.selectorVariantId
                element.disabled = false
            })
            document.querySelectorAll('[data-product-display-price]').forEach(element => {
                element.textContent = foundElement.dataset.selectorVariantPrice
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