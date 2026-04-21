export function initAddCartAction() {

    const addCartActionElementList = document.querySelectorAll('[data-add-cart]');
    const addCartShowcaseElementList = document.querySelectorAll('[data-add-cart-showcase]');

    addCartActionElementList.forEach((element) => {
        element.addEventListener('click', handleAddCart);
    })
    addCartShowcaseElementList.forEach((element) => {
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

        fetch(window.Shopify.routes.root + 'cart/add.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then((res) => {
            if(!res.ok) {
                throw new Error;
            }
            return res.json()
        })
        .then((data) => {
            updateCartCount()
            pushGtagAddCartEvent(productIds, targetElement)
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
                window.productForms.productFormsElement.reset()
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

export function updateCartCount() {

    fetch(window.Shopify.routes.root + "cart.js")
    .then((res) => {
        if(!res.ok) {
            throw new Error();
        }
        return res.json()
    })
    .then((data) => {
        handleCartCount(data.item_count)
    })
    .catch((error) => {
        console.error(error)
    })
    .finally(() => {
    })

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
