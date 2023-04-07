import { initAddCartAction } from "./lib";

window.addEventListener('DOMContentLoaded', (event) => {
    initPagination();
});

function initPagination() {
    let currentIndex = 1;
    const maxIndex = parseInt(document.querySelector('[data-paginate-max]').dataset.paginateMax);

    const elementPaginationBtn = document.querySelector('[data-paginate-more]');
    const elementPaginatedProducts = document.querySelector('[data-paginated-products]');

    paginate(currentIndex);

    elementPaginationBtn.addEventListener('click', (event) => {
        event.preventDefault();
        currentIndex++;
        paginate(currentIndex);
    })
    
    function paginate(index) {
        enableLoading();
        const section = 'index-collection'
        fetch(window.Shopify.routes.root + "?sections=" + section + "&page=" + index)
        .then((res) => {
            if(!res.ok) {
                throw new Error();
            }
            return res.json()
        })
        .then((data) => {
            elementPaginatedProducts.insertAdjacentHTML('beforeend', data[section]);
            moveChildNodes(section)
            .then(() => {
                disableLoading();
                initAddCartAction();
                if(currentIndex === maxIndex) {
                    elementPaginationBtn.classList.add('hidden');
                }
            })
        })
        .catch((error) => {
            console.error(error)
        })
    }

    function moveChildNodes(section) {
        return new Promise((resolve, reject) => {
            const sectionElement = document.getElementById('shopify-section-'+section);
            while (sectionElement.childNodes.length > 0) {
                elementPaginatedProducts.appendChild(sectionElement.childNodes[0]);
            }
            if(sectionElement.childNodes.length === 0) {
                sectionElement.remove()
                resolve();
            }
        })

    }

    function enableLoading() {
        elementPaginatedProducts.classList.add('opacity-75');
        elementPaginatedProducts.classList.add('select-none');
        elementPaginatedProducts.classList.add('pointer-events-none');
        elementPaginationBtn.disabled = true;
        elementPaginationBtn.querySelector('[data-paginate-state="default"]').classList.add('hidden')
        elementPaginationBtn.querySelector('[data-paginate-state="loading"]').classList.remove('hidden')
    }

    function disableLoading() {
        elementPaginatedProducts.classList.remove('opacity-75');
        elementPaginatedProducts.classList.remove('select-none');
        elementPaginatedProducts.classList.remove('pointer-events-none');
        elementPaginationBtn.disabled = false;
        elementPaginationBtn.querySelector('[data-paginate-state="default"]').classList.remove('hidden')
        elementPaginationBtn.querySelector('[data-paginate-state="loading"]').classList.add('hidden')
    }
}