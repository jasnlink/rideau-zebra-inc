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
        const targetElement = event.currentTarget
        let productId
        if(targetElement.dataset.addCart) {
            productId = parseInt(targetElement.dataset.addCart);
        } else if(targetElement.dataset.addCartShowcase) {
            productId = parseInt(targetElement.dataset.addCartShowcase);
        }
        enableLoading(targetElement);
        initAnimation()

        let formData = {
            'items': [{
                    'id': productId,
                    'quantity': 1
                }]
        };

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
            disableLoading(targetElement);
            playAnimation();
        })
        .catch((error) => {
            disableLoading(targetElement, true);
            console.error('Error adding to cart.', error)
        })

        function initAnimation() {

            const animationObjectElement = document.querySelector('[data-animation-object="cart"]')
            const animationSourceElement = document.querySelector('[data-animation-source="cart"]')

            let animationSourceElementRect = animationSourceElement.getBoundingClientRect()

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