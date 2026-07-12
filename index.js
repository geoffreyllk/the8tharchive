
function setViewportHeight() {
const vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('load', setViewportHeight);
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', setViewportHeight);

// sticky promotions toggle
const promoLink = document.getElementById('promo-link');
const promoSentinel = document.getElementById('promo-sentinel');

const promoObserver = new IntersectionObserver(
    ([entry]) => {
        if (entry.isIntersecting) {
            promoLink.classList.add('border-b', 'border-gray-700');
            promoLink.classList.remove('bg-black');
            promoLink.style.backgroundColor = '#0f0f0f';

        } else {
            promoLink.classList.remove('border-b', 'border-gray-700');
            promoLink.classList.add('bg-black');
            promoLink.style.backgroundColor = ''; 
        }
    },
    {
        root: null,
        threshold: 0,
    }
);

promoObserver.observe(promoSentinel);

function updatePromoBanner(posters) {
    const promoLink = document.getElementById('promo-link');
    if (!promoLink) return;
    
    // Find the most recent poster (highest order number)
    const mostRecent = posters.reduce((latest, current) => {
        return (current.order || 0) > (latest.order || 0) ? current : latest;
    }, { order: 0 });
    
    if (mostRecent.title) {
        promoLink.href = mostRecent.link || '#';
        promoLink.innerHTML = `
            <span>&#10033;</span>
            <p class="hover:underline m-0">New Arrival — ${mostRecent.title}</p>
            <span>&#10033;</span>
        `;
        promoLink.classList.remove('hidden');
    }
}

// filter toggle
const filterToggle = document.getElementById('filterToggle');
const filterDrawer = document.getElementById('filterDrawer');
const filterArrow = document.getElementById('filterArrow'); 
const drawerInner = document.getElementById('drawerInner');
let drawerOpen = false;

filterToggle.addEventListener('click', () => {
    drawerOpen = !drawerOpen;
    filterToggle.setAttribute('aria-expanded', drawerOpen.toString());

    if (drawerOpen) {
        const scrollHeight = drawerInner.scrollHeight;
        filterDrawer.style.maxHeight = scrollHeight + 'px';
        filterArrow.classList.add('rotate-180');
        drawerInner.classList.remove('opacity-0', 'translate-y-2');
        enableFilterFocus();
    } else {
        filterArrow.classList.remove('rotate-180');
        drawerInner.classList.add('opacity-0', 'translate-y-2');
        filterDrawer.style.maxHeight = drawerInner.scrollHeight + 'px';
        setTimeout(() => {
            filterDrawer.style.maxHeight = '0px';
        }, 100);
    }
});

filterDrawer.addEventListener('transitionend', () => {
    if (drawerOpen) {
        filterDrawer.style.maxHeight = 'none';
    }
});

const focusableFilterElements = document.querySelectorAll('.focusable-filter');

function disableFilterFocus() {
    focusableFilterElements.forEach(el => {
        el.setAttribute('tabindex', '-1');
        el.setAttribute('aria-hidden', 'true');
    });
}

function enableFilterFocus() {
    focusableFilterElements.forEach(el => {
        el.setAttribute('tabindex', '0');
        el.removeAttribute('aria-hidden');
    });
}

disableFilterFocus();

let originalPosters = [];
let currentSort = 'latest';
let activeFilters = new Set(['active', 'sold out', 'coming soon', 'display only']);
let showDetails = false;

const sortButtons = document.querySelectorAll('.sort-btn');
const filterButtons = document.querySelectorAll('.filter-btn');
const posterContainer = document.getElementById('poster-container');

const getStatusColor = status => ({
    'active': 'text-green-400',
    'sold out': 'text-red-400',
    'coming soon': 'text-purple-400',
    'display only': 'text-yellow-300',
}[status.toLowerCase()] || 'text-yellow-300');

function renderPoster(p, i, total) {
    if (!showDetails) {
        return `
            <a href="${p.link}" class="block w-full transition-transform duration-500 ease-in-out hover:scale-95">
                <img src="${p.img}" alt="Limited edition poster titled '${p.title}' featuring ${p.car}" class="poster-img rounded-none border border-gray-700 shadow-md shadow-black/40 w-full" loading="lazy" decoding="async"/>
            </a>
        `;
    }


    return `
        <article class="${i === total - 1 ? '' : 'border-b border-gray-800'} pb-10 sm:pb-22 sm:mb-22 opacity-0 translate-y-4 transition-all duration-500 ease-in-out animate-fadeInUp delay-[${i * 75}ms]" aria-labelledby="poster-title-${i}">
            <div class="flex flex-col md:flex-row justify-between gap-2 sm:gap-8 md:gap-12 ml-7 mr-4 sm:mx-10 items-stretch scroll-offset">
                <div class="flex justify-center w-full ${i % 2 ? 'md:order-2' : ''}">
                    <img src="${p.img}" alt="Limited edition poster titled '${p.title}' featuring ${p.car}" class="poster-img rounded-none border border-gray-700 shadow-md shadow-black/40" loading="lazy" decoding="async"/>
                </div>
                <div class="flex flex-col w-full space-y-6 justify-between text-gray-300 md:pl-0 ${i % 2 ? 'md:order-1' : ''}">
                    <div class="space-y-1 hidden sm:block">
                        <p class="text-xs uppercase tracking-tightest underline hover:line-through mono text-center text-gray-500 cursor-grab">handle with care</p>
                    </div>
                    <a href="${p.link}" class="relative w-full text-white p-6 border border-gray-800 opacity-90 transition-all duration-300 ease-in-out cursor-pointer hover:border-gray-400 hover:opacity-100 group">
                        <div class="pointer-events-none absolute top-0 left-0 w-2 h-2 border-t border-l border-gray-400" aria-hidden="true"></div>
                        <div class="pointer-events-none absolute top-0 right-0 w-2 h-2 border-t border-r border-gray-400" aria-hidden="true"></div>
                        <div class="pointer-events-none absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gray-400" aria-hidden="true"></div>
                        <div class="pointer-events-none absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gray-400" aria-hidden="true"></div>
                        <div class="space-y-1">
                            <h3 class="text-2xl md:text-3xl font-bold uppercase tracking-tight text-center text-white opacity-80 transition-opacity duration-300 group-hover:opacity-100">${p.title}</h3>
                            <p class="text-sm text-gray-400 uppercase text-center tracking-widest font-mono opacity-80 transition-opacity duration-300 group-hover:opacity-100">[ ${p.car} ]</p>
                        </div>
                    </a>
                    <div class="hidden sm:block space-y-4">
                        <dl class="text-sm space-y-2 text-gray-400">
                            <div class="flex justify-between">
                                <dt class="text-gray-500">EDITION:</dt>
                                <dd class="font-thin mono">${p.edition}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="${p.collection ? 'text-gray-500' : 'text-gray-700 line-through'}">COLLECTION:</dt>
                                <dd class="font-thin mono">${p.collection || '–'}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-500">DROP STATUS:</dt>
                                <dd class="${getStatusColor(p.status)} font-thin mono">${p.status}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-500">RELEASE:</dt>
                                <dd class="font-thin mono">${p.release}</dd>
                            </div>
                        </dl>
                        <div class="hidden sm:flex justify-end py-2 sm:py-4">
                            <a href="${p.link}" class="px-6 py-2 border border-gray-700 text-white hover:border-white hover:bg-white hover:text-black transition transition-all duration-300 ease-in-out uppercase text-sm font-mono tracking-wide"
                            aria-label="View details for poster ${p.title}">
                                View Artifact →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </article>


    `;
}

function renderPosters(posters) {
    if (posters.length === 0) {
        posterContainer.innerHTML = `<div class="text-center text-gray-500 italic py-16 text-sm mono">No posters match the current filter.</div>`;
        return;
    }

    if (!showDetails) {
        posterContainer.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 justify-items-center w-full">
                ${posters.map((p, i) => renderPoster(p, i, posters.length)).join('')}
            </div>
        `;
    } else {
        posterContainer.innerHTML = posters.map((p, i) => renderPoster(p, i, posters.length)).join('');
    }
}

function applyFilters() {
    const statusCounts = {
        'active': 0,
        'sold out': 0,
        'coming soon': 0,
        'display only': 0
    };

    originalPosters.forEach(p => {
        const s = p.status.toLowerCase();
        if (statusCounts[s] !== undefined) statusCounts[s]++;
    });

    filterButtons.forEach(btn => {
        const status = btn.dataset.status.toLowerCase();
        const isActive = activeFilters.has(status);

        btn.classList.toggle('active',
            status === 'all'
                ? activeFilters.size === 4
                : isActive
        );

        btn.setAttribute('aria-pressed',
            status === 'all'
                ? (activeFilters.size === 4).toString()
                : isActive.toString()
        );

        if (status !== 'all') {
            const label = status
                .replace('sold out', 'Sold Out')
                .replace('coming soon', 'Coming Soon')
                .replace('display only', 'Display Only')
                .replace('active', 'Active');
            btn.textContent = `${label} – ${statusCounts[status] || 0}`;
        } else {
            btn.textContent = 'All';
        }
    });

    if (activeFilters.size === 0) return renderPosters([]);

    let filtered = originalPosters.filter(p =>
        activeFilters.has(p.status.toLowerCase())
    );

    filtered.sort((a, b) => {
    const titleA = a.title.toLowerCase();
    const titleB = b.title.toLowerCase();
    
        switch (currentSort) {
            case 'az': return titleA.localeCompare(titleB);
            case 'za': return titleB.localeCompare(titleA);
            case 'oldest': return (a.order || 0) - (b.order || 0);
            case 'latest': default: return (b.order || 0) - (a.order || 0);
        }
    });

    renderPosters(filtered);

    // Update ARIA live region
    const ariaStatus = document.getElementById('ariaStatusMessage');
    ariaStatus.textContent = `Showing ${filtered.length} posters filtered by ${Array.from(activeFilters).join(', ')} and sorted by ${currentSort}`;
}

sortButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        currentSort = btn.dataset.sort;
        sortButtons.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        applyFilters();
    });
});

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const status = btn.dataset.status.toLowerCase();
        if (status === 'all') {
            activeFilters = activeFilters.size === 4
                ? new Set()
                : new Set(['active', 'sold out', 'coming soon', 'display only']);
        } else {
            activeFilters.has(status)
                ? activeFilters.delete(status)
                : activeFilters.add(status);
        }
        applyFilters();
    });
});

const toggleViewBtn = document.getElementById('toggleViewBtn');
if (toggleViewBtn) {
    toggleViewBtn.addEventListener('click', () => {
        showDetails = !showDetails;
        toggleViewBtn.textContent = showDetails ? 'Detail View' : 'Grid View';
        toggleViewBtn.classList.toggle('active');
        toggleViewBtn.setAttribute('aria-pressed', showDetails.toString());
        applyFilters();
    });
}

// Load JSON
fetch('posters.json')
    .then(res => res.json())
    .then(data => {
        originalPosters = data;
        applyFilters();
        updatePromoBanner(data);
    })
    .catch(err => console.error('Failed to load poster data:', err));