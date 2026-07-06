import { initAddCartAction, initCharityDonation, formatMoney, syncCartUI, setBtnState } from "./lib";
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
    var popover = document.getElementById('secure-popover');
    var triggers = document.querySelectorAll('[data-secure-action]');
    if (!popover || !triggers.length) return;

    var popperInstance = null;
    var activeTrigger = null;
    var showTimer = null;
    var hideTimer = null;

    function show(trigger) {
        clearTimeout(hideTimer);
        clearTimeout(showTimer);
        if (activeTrigger === trigger) return;
        activeTrigger = trigger;
        showTimer = setTimeout(function() {
            popover.classList.remove('hidden');
            // Force reflow so browser registers opacity:0 before transitioning
            popover.offsetHeight;
            popover.style.opacity = '1';
            if (!popperInstance) {
                popperInstance = Popper.createPopper(trigger, popover, {
                    placement: 'top',
                    strategy: 'fixed',
                    modifiers: [{ name: 'offset', options: { offset: [0, 12] } }]
                });
            } else {
                popperInstance.state.elements.reference = trigger;
                popperInstance.update();
            }
        }, 200);
    }

    function hide() {
        clearTimeout(showTimer);
        hideTimer = setTimeout(function() {
            popover.style.opacity = '0';
            setTimeout(function() {
                popover.classList.add('hidden');
                activeTrigger = null;
            }, 200);
        }, 250);
    }

    function cancelHide() {
        clearTimeout(hideTimer);
    }

    triggers.forEach(function(trigger) {
        trigger.addEventListener('mouseenter', function() { show(trigger); });
        trigger.addEventListener('mouseleave', function() { hide(); });
    });

    popover.addEventListener('mouseenter', function() { cancelHide(); });
    popover.addEventListener('mouseleave', function() { hide(); });
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
            var scrollbarW = window.innerWidth - document.documentElement.clientWidth;
            var scrollY = window.scrollY;
            document.body.style.top = '-' + scrollY + 'px';
            document.body.style.paddingRight = scrollbarW + 'px';
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            menuWrapperElement.classList.remove('invisible', 'pointer-events-none');
            menuDrawerElement.classList.remove('invisible', 'pointer-events-none');
            setTimeout(() => {
                menuWrapperElement.style.opacity = backdropOpacity;
                menuDrawerElement.style.transform = 'translateX(0%)';
            }, 20);
            menuWrapperElement.addEventListener('transitionend', () => {
            }, {once:true})
            menuOpen = true
        } else if(menuOpen === true) {
            menuWrapperElement.style.opacity = 0;
            menuDrawerElement.style.transform = 'translateX(-100%)';
            menuWrapperElement.addEventListener('transitionend', () => {
                menuWrapperElement.classList.add('invisible', 'pointer-events-none');
                menuDrawerElement.classList.add('invisible', 'pointer-events-none');
                var scrollY = parseInt(document.body.style.top || '0');
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
                window.scrollTo({ top: -scrollY, behavior: 'instant' });
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
            // Lock scroll + compensate (Material UI pattern)
            var scrollbarW = window.innerWidth - document.documentElement.clientWidth;
            var scrollY = window.scrollY;
            document.body.style.top = '-' + scrollY + 'px';
            document.body.style.paddingRight = scrollbarW + 'px';
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            drawerWrapperElement.classList.remove('invisible', 'pointer-events-none');
            drawerElement.classList.remove('invisible', 'pointer-events-none');
            setTimeout(() => {
                drawerWrapperElement.style.opacity = backdropOpacity;
                drawerElement.style.transform = 'translateX(0%)';
            }, 20);
            drawerWrapperElement.addEventListener('transitionend', () => {
                drawerElement.setAttribute('data-drawer-state', 'open')
            }, {once:true})
        } else if (open === false) {
            drawerWrapperElement.style.opacity = 0;
            drawerElement.style.transform = 'translateX(100%)';
            drawerWrapperElement.addEventListener('transitionend', () => {
                drawerWrapperElement.classList.add('invisible', 'pointer-events-none');
                drawerElement.classList.add('invisible', 'pointer-events-none');
                drawerElement.setAttribute('data-drawer-state', 'closed')
                // Restore scroll
                var scrollY = parseInt(document.body.style.top || '0');
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
                window.scrollTo({ top: -scrollY, behavior: 'instant' });
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

        var _cartRequests = {}; // per-line request IDs — prevents stale updates

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

            var reqId = Date.now() + '_' + line;
            _cartRequests[line] = reqId;

            const payload = { line: line, quantity: qty };

            var lineEl = document.querySelector('[data-cart-line="' + line + '"]');
            var qtyEl = lineEl ? lineEl.querySelector('[data-cart-line-qty]') : null;
            if (lineEl) {
                lineEl.style.transition = 'opacity 200ms';
                lineEl.style.opacity = '0.6';
            }
            if (qtyEl) {
                qtyEl.style.transition = 'transform 300ms ease-in-out';
                qtyEl.style.transform = 'scale(0.85)';
            }
            btn.classList.add('rz-cart-btn-loading');
            // Ring animation on the clicked button
            btn.classList.add('rz-cart-btn-loading');

            if (action === 'remove') {
                var charityArea = document.getElementById('cart-drawer-charity');
                if (charityArea) { charityArea.style.transition = 'opacity 200ms'; charityArea.style.opacity = '0.6'; }
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
                // Guard: skip if a newer request for this line has superseded us
                if (_cartRequests[line] !== reqId) return;

                syncCartUI(data, undefined, true);

                // Re-query lineEl — syncCartUI may have rebuilt the DOM
                var currentLineEl = document.querySelector('[data-cart-line="' + line + '"]');

                if (qty === 0) {
                    if (currentLineEl && currentLineEl.parentNode) {
                        currentLineEl.style.opacity = '0';
                        currentLineEl.style.transition = '';
                        currentLineEl.classList.add('hidden');
                    }
                } else {
                    var updatedItem = data.items[line - 1];
                    if (currentLineEl && currentLineEl.parentNode && updatedItem) {
                        var newQty = updatedItem.quantity;
                        var priceEl = currentLineEl.querySelector('[data-cart-line-price]');
                        var qtyElUpdate = currentLineEl.querySelector('[data-cart-line-qty]');
                        if (priceEl) priceEl.textContent = formatMoney(updatedItem.final_line_price);
                        if (qtyElUpdate) {
                            qtyElUpdate.textContent = newQty;
                            qtyElUpdate.style.transform = 'scale(1.15)';
                            setTimeout(function() { qtyElUpdate.style.transform = 'scale(1)'; }, 150);
                        }
                        currentLineEl.querySelectorAll('[data-cart-action]').forEach(function(b) {
                            b.dataset.cartItemQuantity = newQty;
                        });
                    }
                    if (currentLineEl && currentLineEl.parentNode) {
                        currentLineEl.style.opacity = '1';
                        setTimeout(function() { currentLineEl.style.transition = ''; }, 250);
                    }
                }

                var charityArea = document.getElementById('cart-drawer-charity');
                if (charityArea) { charityArea.style.opacity = '1'; charityArea.style.transition = ''; }

                // Ring completion on the button
                btn.classList.remove('rz-cart-btn-loading');
                btn.classList.add('rz-cart-btn-success');
                btn.disabled = false;
                setTimeout(function() { btn.classList.remove('rz-cart-btn-success'); }, 600);
            })
            .catch((error) => {
                console.error('[cart] cart/change.js FAILED:', error);
                btn.classList.remove('rz-cart-btn-loading');
                btn.classList.add('rz-cart-btn-error');
                btn.disabled = false;
                setTimeout(function() { btn.classList.remove('rz-cart-btn-error'); }, 600);
                // Re-query — DOM may have changed
                var currentLineEl = document.querySelector('[data-cart-line="' + line + '"]');
                if (currentLineEl && currentLineEl.parentNode) {
                    currentLineEl.style.opacity = '1';
                    currentLineEl.style.transition = '';
                }
                var currentQtyEl = currentLineEl ? currentLineEl.querySelector('[data-cart-line-qty]') : null;
                if (currentQtyEl) { currentQtyEl.style.transform = 'scale(1)'; currentQtyEl.style.transition = ''; }
            });

        }

    }
}
