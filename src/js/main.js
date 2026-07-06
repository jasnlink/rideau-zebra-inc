import { initAddCartAction, initCharityDonation, formatMoney, syncCartUI } from "./lib";
import { updateCartCount } from "./lib";

window.addEventListener('DOMContentLoaded', (event) => {
    initSecurePopover();
    initCart();
    initMobileMenu();
    initProductHover();
    initDrawers();
    initAddCartAction();
    initCharityDonation();
});

function initProductHover() {
    const hoverElements = document.querySelectorAll('[data-rz-product-hover]')
    if (!hoverElements.length) return

    hoverElements.forEach((element) => {
        element.addEventListener('mouseenter', (e) => {
            const handle = e.currentTarget.getAttribute('data-rz-product-hover')
            const containerEl = document.querySelector(`[data-rz-product-container="${handle}"]`)
            const primaryEl = document.querySelector(`[data-rz-product-primary="${handle}"]`)
            const hoverEl = document.querySelector(`[data-rz-product-hover-action="${handle}"]`)
            if (!primaryEl || !hoverEl || !containerEl) return
            const startH = containerEl.offsetHeight
            containerEl.style.height = startH + 'px'
            primaryEl.classList.add('hidden')
            hoverEl.classList.remove('hidden')
            hoverEl.classList.add('rz-fade-in')
            containerEl.style.height = 'auto'
            const endH = containerEl.offsetHeight
            containerEl.style.height = startH + 'px'
            requestAnimationFrame(() => { containerEl.style.height = endH + 'px' })
            const onEnd = () => { containerEl.style.height = ''; containerEl.removeEventListener('transitionend', onEnd) }
            containerEl.addEventListener('transitionend', onEnd)
        })
        element.addEventListener('mouseleave', (e) => {
            const handle = e.currentTarget.getAttribute('data-rz-product-hover')
            const containerEl = document.querySelector(`[data-rz-product-container="${handle}"]`)
            const primaryEl = document.querySelector(`[data-rz-product-primary="${handle}"]`)
            const hoverEl = document.querySelector(`[data-rz-product-hover-action="${handle}"]`)
            if (!primaryEl || !hoverEl || !containerEl) return
            const startH = containerEl.offsetHeight
            containerEl.style.height = startH + 'px'
            hoverEl.classList.add('hidden')
            hoverEl.classList.remove('rz-fade-in')
            primaryEl.classList.remove('hidden')
            primaryEl.classList.add('rz-fade-in')
            containerEl.style.height = 'auto'
            const endH = containerEl.offsetHeight
            containerEl.style.height = startH + 'px'
            requestAnimationFrame(() => { containerEl.style.height = endH + 'px' })
            const onEnd = () => { containerEl.style.height = ''; containerEl.removeEventListener('transitionend', onEnd) }
            containerEl.addEventListener('transitionend', onEnd)
        })
    })
}

function initSecurePopover() {

    const secureBtnElementList = document.querySelectorAll('[data-secure-action]');
    const secureCloseBtnElementList = document.querySelectorAll('[data-secure-close]');
    const securePopoverElement = document.getElementById('secure-popover');

    let popperInstanceList = [];

    secureCloseBtnElementList.forEach(secureCloseBtnElement => {secureCloseBtnElement.addEventListener('click', hideSecure)})

    secureBtnElementList.forEach((secureBtnElement, index) => {
        secureBtnElement.addEventListener('click', (event, secureBtnElement) => {handleSecureToggle(secureBtnElement, index)});

        const popperInstance = Popper.createPopper(secureBtnElement, securePopoverElement, {
            placement: 'top',
            modifiers: [
                {
                    name: 'offset',
                    options: {
                        offset: [0, 24],
                    },
                },
            ],
        });
        popperInstanceList.push(popperInstance)
    })

    function handleSecureToggle(secureBtnElement, index) {
        securePopoverElement.classList.toggle('hidden');
        popperInstanceList[index].update();
    }

    function hideSecure() {
        securePopoverElement.classList.add('hidden');
    }

}

function initMobileMenu() {
    let menuOpen = false;
    const backdropOpacity = 0.4;

    const menuCloseBtnElement = document.getElementById('mobile-menu-close-btn');
    menuCloseBtnElement.addEventListener('click', handleMenuToggle);

    const menuWrapperElement = document.getElementById('mobile-menu-overlay');
    const menuDrawerElement = document.getElementById('mobile-menu');

    menuWrapperElement.style.opacity = 0;
    menuDrawerElement.style.transform = 'translateX(-100%)';
    menuWrapperElement.addEventListener('click', handleMenuToggle);

    const menuBtnElementList = document.querySelectorAll('[data-menu-open]');
    menuBtnElementList.forEach((menuBtnElement) => {
        menuBtnElement.addEventListener('click', handleMenuToggle);
    })


    function handleMenuToggle(event) {

        event.preventDefault();

        if(menuOpen === false) {
            menuWrapperElement.classList.remove('hidden');
            menuDrawerElement.classList.remove('hidden');
            setTimeout(() => {
                menuWrapperElement.style.opacity = backdropOpacity;
                menuDrawerElement.style.transform = 'translateX(0%)';
            }, 20);
            menuWrapperElement.addEventListener('transitionend', () => {
                document.body.style.overflow = 'hidden';
                document.documentElement.style.overflow = 'hidden';
            }, {once:true})
            menuOpen = true
        } else if(menuOpen === true) {
            menuWrapperElement.style.opacity = 0;
            menuDrawerElement.style.transform = 'translateX(-100%)';
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            menuWrapperElement.addEventListener('transitionend', () => {
                menuWrapperElement.classList.add('hidden');
                menuDrawerElement.classList.add('hidden');
            }, {once:true})
            menuOpen = false
        }
    }
}

function initDrawers() {
    const backdropOpacity = 0.4
    let currentTargetDrawer = null

    document.querySelectorAll('[data-drawer]').forEach(element => {
        document.querySelector(`#${element.id}-overlay`).style.opacity = 0
        element.style.transform = 'translateX(100%)';
    })

    const drawerActionElements = document.querySelectorAll('[data-drawer-action]')
    drawerActionElements.forEach(element => {
        element.addEventListener('click', event => {
            event.preventDefault()
            const actionTarget = event.currentTarget.getAttribute('data-drawer-action')
            if (currentTargetDrawer !== null) {
                toggleDrawer(currentTargetDrawer, false)
            }
            toggleDrawer(actionTarget, true)
            currentTargetDrawer = actionTarget
        })
    })

    const drawerCloseElements = document.querySelectorAll('[data-drawer-close]')
    drawerCloseElements.forEach(element => {
        element.addEventListener('click', event => {
            event.preventDefault()
            if (currentTargetDrawer !== null) {
                toggleDrawer(currentTargetDrawer, false)
                currentTargetDrawer = null
            }
        })
    })

    function toggleDrawer(target, open) {
        const drawerWrapperElement = document.querySelector(`#${target}-overlay`)
        const drawerElement = document.querySelector(`#${target}`)

        if (open === true) {
            drawerWrapperElement.classList.remove('hidden');
            drawerElement.classList.remove('hidden');
            setTimeout(() => {
                drawerWrapperElement.style.opacity = backdropOpacity;
                drawerElement.style.transform = 'translateX(0%)';
            }, 20);
            drawerWrapperElement.addEventListener('transitionend', () => {
                document.body.style.overflow = 'hidden';
                document.documentElement.style.overflow = 'hidden';
                drawerElement.setAttribute('data-drawer-state', 'open')
            }, {once:true})
        } else if (open === false) {
            drawerWrapperElement.style.opacity = 0;
            drawerElement.style.transform = 'translateX(100%)';
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            drawerWrapperElement.addEventListener('transitionend', () => {
                drawerWrapperElement.classList.add('hidden');
                drawerElement.classList.add('hidden');
                drawerElement.setAttribute('data-drawer-state', 'closed')
            }, {once:true})
        }
    }
}

function initCart() {

    updateCartCount();
    initCartAction();

    function initCartAction() {

        const cartDrawerElement = document.getElementById('cart-drawer')

        // Event delegation: one listener on persistent parent, no re-binding needed
        if (!cartDrawerElement.dataset.cartActionsDelegated) {
            cartDrawerElement.dataset.cartActionsDelegated = 'true';
            cartDrawerElement.addEventListener('click', function(event) {
                const btn = event.target.closest('[data-cart-action]');
                if (!btn) return;
                event.preventDefault();
                handleCartAction(btn);
            });
        }

        function handleCartAction(btn) {
            if (btn.disabled) return;
            btn.disabled = true;

            const line = parseInt(btn.dataset.cartItemId);
            let qty = parseInt(btn.dataset.cartItemQuantity);
            if (isNaN(qty) || qty < 0) qty = 1;

            const action = btn.dataset.cartAction;
            if (action === 'minus') qty = Math.max(0, qty - 1);
            else if (action === 'plus') qty = Math.max(1, qty + 1);
            else if (action === 'remove') qty = 0;

            const payload = { line: line, quantity: qty };

            const lineEl = document.querySelector('[data-cart-line="' + line + '"]');
            if (lineEl) lineEl.classList.add('opacity-50', 'transition-opacity', 'duration-200');

            // Fade out charity area on remove
            if (action === 'remove') {
                const charityArea = document.getElementById('cart-drawer-charity');
                if (charityArea) charityArea.classList.add('opacity-50');
            }

            fetch(window.Shopify.routes.root + 'cart/change.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then((res) => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then((data) => {
                // ── Centralized: sync all UI from cart data ──
                syncCartUI(data);

                // ── Update line item inline ──
                if (qty === 0) {
                    if (lineEl) {
                        lineEl.classList.remove('opacity-50');
                        lineEl.classList.add('hidden');
                    }
                } else {
                    var updatedItem = data.items[line - 1];
                    if (lineEl && updatedItem) {
                        var newQty = updatedItem.quantity;
                        var priceEl = lineEl.querySelector('[data-cart-line-price]');
                        var qtyEl = lineEl.querySelector('[data-cart-line-qty]');
                        if (priceEl) priceEl.textContent = formatMoney(updatedItem.final_line_price);
                        if (qtyEl) qtyEl.textContent = newQty;
                        lineEl.querySelectorAll('[data-cart-action]').forEach(function(b) {
                            b.dataset.cartItemQuantity = newQty;
                        });
                    }
                    if (lineEl) lineEl.classList.remove('opacity-50');
                }

                // Restore charity area if it was faded
                var charityArea = document.getElementById('cart-drawer-charity');
                if (charityArea) charityArea.classList.remove('opacity-50');

                btn.disabled = false;
            })
            .catch((error) => {
                console.error('[cart] cart/change.js FAILED:', error);
                if (lineEl) lineEl.classList.remove('opacity-50');
                btn.disabled = false;
            });

        }

    }
}
