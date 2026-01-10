// ====== Cart state and DOM refs ======
let cartItems = JSON.parse(localStorage.getItem("cart")) || [];
let agreed = false;
let pendingDeleteIndex = null;
let cartOpened = false;
let lastFocusedElement = null;

const wrapper = document.getElementById('cart-wrapper');
const checkout = document.getElementById('checkout');
const empty = document.getElementById('emptyCart');
const itemsDiv = document.getElementById('cartItems');
const totalDisp = document.getElementById('cartTotal');
const countDisp = document.getElementById('itemCount');
const savedDisp  = document.getElementById('youSaved');
const confirmOverlay = document.getElementById('confirmOverlay');
const confirmMessage = document.getElementById('confirmMessage');

// icons
function expandIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10V4h6v2H6v4H4zm16 0V4h-6v2h4v4h2zm0 10v-6h-2v4h-4v2h6zm-16 0v-6h2v4h4v2H4z"/></svg>`;
}
function shrinkIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15 14h4v4h-2v-2h-2v-2zm-6 0H5v4h2v-2h2v-2zm0-4H5V6h2v2h2v2zm6 0h4V6h-2v2h-2v2z"/></svg>`;
}

function setExpandedState(imgDiv, infoDiv, btn, expanded) {
    const isDesktop = window.matchMedia('(min-width: 640px)').matches;

    btn.setAttribute('aria-expanded', String(expanded));
    btn.innerHTML = expanded ? shrinkIcon() : expandIcon();

    if (isDesktop) {
        imgDiv.classList.toggle('sm:w-2', expanded);
        imgDiv.classList.toggle('sm:w-1/2', !expanded);
        infoDiv.classList.toggle('sm:w-full', expanded);
        infoDiv.classList.toggle('sm:w-1/2', !expanded);
        imgDiv.style.maxHeight = 'none';
        return;
    }

    if (expanded) {
        // Info expanded → collapse image
        imgDiv.classList.remove('p-2');
        imgDiv.classList.add('p-0');
        imgDiv.getBoundingClientRect();
        imgDiv.style.maxHeight = '2px';
    } else {
        // Info collapsed → expand image
        imgDiv.classList.add('p-2');
        imgDiv.classList.remove('p-0');
        imgDiv.getBoundingClientRect();
        imgDiv.style.maxHeight = imgDiv.scrollHeight + 'px';
    }
}

function applyAllExpandedState(expanded = false) {
    cartItems.forEach((item, i) => {
        const uid = `${item.id}-${i}`;
        const imgDiv = document.getElementById(`imageDiv-${uid}`);
        const infoDiv = document.getElementById(`infoDiv-${uid}`);
        const btn = document.querySelector(`[onclick="toggleImage('${uid}', this)"]`);
        if (!imgDiv || !infoDiv || !btn) return;

        setExpandedState(imgDiv, infoDiv, btn, expanded);
    });
}

function setCartOpen(open) {
    requestAnimationFrame(() => {
        if (open) {
            applyAllExpandedState();

            requestAnimationFrame(() => {
                wrapper.style.maxHeight = wrapper.scrollHeight + 'px';
                wrapper.style.opacity = '1';
                checkout.style.maxHeight = checkout.scrollHeight + 'px';
                checkout.style.opacity = '1';
            });
        } else {
            wrapper.style.maxHeight = '0px';
            wrapper.style.opacity = '0';
            checkout.style.maxHeight = '0px';
            checkout.style.opacity = '0';
        }
    });
}

function toggleImage(uid, btn) {
    const imgDiv = document.getElementById(`imageDiv-${uid}`);
    const infoDiv = document.getElementById(`infoDiv-${uid}`);
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    setExpandedState(imgDiv, infoDiv, btn, !expanded);
}

document.addEventListener("DOMContentLoaded", () => {
    const inquireBtn = document.getElementById("checkoutBtn");
    const WA_PHONE   = "601137838185";

    if (inquireBtn) {
        inquireBtn.addEventListener("click", e => {
        e.preventDefault();
        if (!cartItems.length) return alert("Your cart is empty.");

        let msg = "Hello The8thArchive Team,\n\nI’m interested in the following posters:\n";
        cartItems.forEach(it => msg += `• ${it.title} × ${it.quantity}\n`);
        const total = cartItems.reduce((s, it) => s + it.price * it.quantity, 0).toFixed(2);
        msg += `\nTotal: RM ${total}\n\Looking forward to your confirmation. Thanks!`;

        const url = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`;
        window.open(url, "_blank");
        });
    }

    const completeOrderBtn = document.getElementById('completeOrder');
    if (completeOrderBtn) {
        completeOrderBtn.addEventListener('click', () => {
        const btn = document.getElementById('checkoutBtn');
        if (!btn) return;
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        btn.classList.add('ring-2', 'ring-green-400', 'ring-opacity-80');
        setTimeout(() => btn.classList.remove('ring-2', 'ring-green-400', 'ring-opacity-80'), 2000);
        });
    }

    // initial render
    renderCart();
});

function discountLabelText(item) {
    const dm = item && (item.discountMeta || (typeof item.discount !== 'undefined' ? { type: 'percent', value: item.discount } : null));
    if (!dm) return null;
    if (typeof dm === 'number') return `${dm}% OFF`;
    if (dm.type === 'percent') return `${dm.value}% OFF`;
    if (dm.type === 'fixed') return `RM ${dm.value} OFF`;
    return null;
}

function renderCart() {
    const hasItems = cartItems.length > 0;
    empty.classList.toggle('hidden', hasItems);
    wrapper.classList.toggle('hidden', !hasItems);
    checkout.classList.toggle('hidden', !hasItems);

    if (!hasItems) {
        setCartOpen(false);
        return;
    }

    let total = 0, count = 0, saved = 0;

    const lowStockItems = cartItems.filter(item => item.stock && item.stock <= 5);
    const banner = document.getElementById('lowStockBanner');
    if (lowStockItems.length > 0) {
        banner.classList.remove('hidden');
        const lowestStock = Math.min(...lowStockItems.map(item => item.stock));
        document.getElementById('stockCount').innerHTML = `Only <span class="text-red-500 font-bold">${lowestStock}</span> left in this drop.`;
    } else {
        banner.classList.add('hidden');
    }

    itemsDiv.innerHTML = cartItems.map((item, i) => {
        const uid = `${item.id}-${i}`;
        const unitPrice = Number(item.price) || 0;
        const unitOriginal = Number(item.originalPrice || unitPrice) || 0;
        const itemTotal    = unitPrice * item.quantity;
        const itemOriginal = unitOriginal * item.quantity;

        const desktopImg = item.img.replace("images/", "images/desktop/");
        const mobileImg  = item.img.replace("images/", "images/mobile/");

        total += itemTotal;
        count += item.quantity;
        saved += (itemOriginal - itemTotal);

        const discText = discountLabelText(item);
        const discHtml = discText
        ? `<a href="promotions.html" class="text-xs sm:text-sm text-green-400 hover:underline"><h3>${discText}</h3></a>`
        : `<span class="text-xs sm:text-sm text-gray-500">-</span>`;

        return `
        <div class="grid grid-cols-5 sm:grid-cols-11">
            <div class="col-start-1 col-end-4 sm:col-end-9 flex flex-col sm:flex-row">
                <figure id="imageDiv-${uid}" class="shrink-0 w-auto sm:h-auto sm:w-1/2 border-l border-gray-700 p-2 overflow-hidden transition-all duration-700 ease-in-out">
                    <picture>
                        <source srcset="${mobileImg}" media="(max-width: 768px)" type="image/webp">
                        <img src="${desktopImg}" alt="${item.title}" class="w-full object-cover" loading="lazy" decoding="async"/>
                    </picture>
                </figure>

                <figcaption id="infoDiv-${uid}" class="flex justify-between w-full h-auto sm:w-1/2 border-l border-gray-700 sm:border-none p-2 pl-4 sm:p-4 transition-all duration-700 ease-in-out">
                    <div class="flex flex-col sm:gap-1">
                        <h2 class="text-white font-semibold uppercase text-sm sm:text-lg" style="hyphens: auto; word-break: break-word; overflow-wrap: break-word;">
                            <a href="${item.link}?frame=${item.frame}" class="underline hover:text-gray-300 transition-all duration-200 ease-in-out">
                            ${item.title}
                            </a>
                        </h2>
                        <p class="mono text-xs text-gray-400 capitalize tracking-tightest sm:tracking-normal">${item.frame} · A2</p>
                        <p class="text-xs sm:text-sm text-gray-500 tracking-tightest sm:tracking-normal">RM ${unitOriginal} per print</p>
                    </div>
                    <div class="text-right">
                        <button onclick="toggleImage('${uid}', this)" class="expand-btn text-gray-400 text-sm" title="Expand Info Button" aria-label="Expand Info, Minimise Image" type="button" aria-expanded="false">
                            ${expandIcon()}
                        </button>
                    </div>
                </figcaption>
            </div>

            <dl class="col-span-2 sm:col-start-9 sm:col-end-12 py-2 sm:py-4 px-2 flex flex-col justify-between border-l border-r border-gray-700">
                <div class="flex flex-col">
                    <div class="flex justify-between items-center">
                        <dt class="text-xs sm:text-sm text-gray-400 uppercase">Price:</dt>
                        <dd class="text-xs sm:text-sm md:text-base text-white mono"><h2>RM ${itemTotal}</h2></dd>
                    </div>
                    ${discText 
                        ? `
                        <div class="flex justify-between items-center">
                            <a href="promotions.html" class="text-xs sm:text-sm text-green-400 hover:underline"><h3>${discText}</h3></a>
                            <h3 class="text-xs sm:text-sm text-gray-500 line-through">RM ${itemOriginal}</h3>
                        </div>
                        `
                        : ''
                    }
                </div>

                <div class="flex flex-grow flex-row justify-between items-end">
                    <dt class="text-xs sm:text-sm text-gray-400 uppercase"><p>Qty:</p></dt>
                    <dd class="qty-btn flex gap-2 sm:gap-3 items-center">
                        <button onclick="changeQty(${i}, -1)" type="button" class="mono border border-gray-700 px-2 sm:px-3 text-white text-xs" aria-label="Decrease quantity of ${item.title}">–</button>
                        <p class="mono text-white text-sm" id="item-qty-${i}">${item.quantity}</p>
                        <button onclick="changeQty(${i}, 1)" type="button" class="mono border border-gray-700 px-2 sm:px-3 text-white text-xs" aria-label="Increase quantity of ${item.title}">+</button>
                    </dd>
                </div>
            </dl>
        </div>
        `;
    }).join('');

    // ensure plus buttons states
    cartItems.forEach((_, i) => updatePlusButtonState(i));

    totalDisp.textContent = `RM ${total}`;
    countDisp.textContent = `${count} item(s)`;
    savedDisp.textContent  = `You saved RM ${saved}`;

    if (!cartOpened) {
        setTimeout(() => {
        setCartOpen(true);
        cartOpened = true;
        }, 150);
    }

    localStorage.setItem("cart", JSON.stringify(cartItems));
}

function updateQtyDisplay(index) {
    const item = cartItems[index];
    if (!item) return;

    // Update qty number
    const qtyElement = document.getElementById(`item-qty-${index}`);
    if (qtyElement) qtyElement.textContent = item.quantity;

    // Update item prices (find the right dl and its h2/h3)
    const uid = `${item.id}-${index}`;
    const infoFig = document.getElementById(`infoDiv-${uid}`);
    if (infoFig) {
        const dl = infoFig.parentElement.nextElementSibling;
        if (dl) {
        const priceH2 = dl.querySelector('h2'); // RM total
        const priceH3strike = dl.querySelector('h3.text-gray-500'); // original total
        const discountAnchorH3 = dl.querySelector('a > h3'); // discount h3 inside anchor (if present)

        const newTotal = (Number(item.price) || 0) * item.quantity;
        const newOriginalTotal = (Number(item.originalPrice || item.price) || 0) * item.quantity;

        if (priceH2) priceH2.textContent = `RM ${newTotal}`;
        if (priceH3strike) priceH3strike.textContent = `RM ${newOriginalTotal}`;

        const newDiscText = discountLabelText(item);
        if (discountAnchorH3) {
            discountAnchorH3.textContent = newDiscText || '-';
        } else if (newDiscText) {
            // if previously there was no anchor, add one (defensive)
            const container = dl.querySelector('div.flex');
            if (container) {
            const anchorHtml = `<a href="promotions.html" class="text-xs sm:text-sm text-green-400 hover:underline"><h3>${newDiscText}</h3></a>`;
            const strike = dl.querySelector('h3.text-gray-500');
            if (strike) strike.insertAdjacentHTML('beforebegin', anchorHtml);
            }
        }
        }
    }

    // Update totals
    let total = 0, count = 0, saved = 0;
    cartItems.forEach(it => {
        total += (Number(it.price) || 0) * it.quantity;
        count += it.quantity;
        saved += ((Number(it.originalPrice || it.price) || 0) * it.quantity) - ((Number(it.price) || 0) * it.quantity);
    });

    totalDisp.textContent = `RM ${total}`;
    countDisp.textContent = `${count} item(s)`;
    savedDisp.textContent  = `You saved RM ${saved}`;

    // Persist cart
    localStorage.setItem("cart", JSON.stringify(cartItems));
    }

// ====== Plus button enable/disable ======
function updatePlusButtonState(index) {
    const item = cartItems[index];
    if (!item) return;
    const uid = `${item.id}-${index}`;
    const dl = document.getElementById(`infoDiv-${uid}`).parentElement.nextElementSibling;
    const plus = dl ? dl.querySelector('button[aria-label*="Increase"]') : null;
    const isMax = item.stock != null && item.quantity >= item.stock;
    if (plus) {
        plus.disabled = isMax;
        plus.classList.toggle('cursor-not-allowed', isMax);
        plus.classList.toggle('text-gray-600', isMax);
        plus.classList.toggle('text-white', !isMax);
    }
}

function changeQty(index, delta) {
    const item = cartItems[index];
    if (!item || delta === 0) return;

    const newQty = item.quantity + delta;
    if (delta > 0 && item.stock != null && newQty > item.stock) return;

    if (newQty <= 0) {
        showConfirmOverlay(index, item.title);
        return;
    }

    item.quantity = newQty;
    updateQtyDisplay(index);
    updatePlusButtonState(index);
}

function showConfirmOverlay(index, title) {
    lastFocusedElement = document.activeElement;
    pendingDeleteIndex = index;
    confirmMessage.textContent = `Remove "${title}" from cart?`;
    confirmOverlay.classList.remove('hidden');
    confirmOverlay.focus();
    }
    function hideConfirmOverlay() {
    pendingDeleteIndex = null;
    confirmOverlay.classList.add('hidden');
    if (lastFocusedElement) lastFocusedElement.focus();
    }
    document.getElementById('confirmYes').onclick = () => {
    if (pendingDeleteIndex !== null) {
        cartItems.splice(pendingDeleteIndex, 1);
        updateCart();
        hideConfirmOverlay();
    }
};
document.getElementById('confirmNo').onclick = hideConfirmOverlay;
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !confirmOverlay.classList.contains("hidden")) hideConfirmOverlay();
});

function updateCart() {
    localStorage.setItem("cart", JSON.stringify(cartItems));
    renderCart();
}

// Keep cart sizing reasonable on resize
window.addEventListener('resize', () => {
    try {
        wrapper.style.maxHeight = wrapper.scrollHeight + 'px';
        checkout.style.maxHeight = checkout.scrollHeight + 'px';
    } catch (e) {}
});

document.addEventListener('DOMContentLoaded', renderCart);

function handleActiveState(e, state) {
    const qtyBtn = e.target.closest(".qty-btn button");
    const expandBtn = e.target.closest(".expand-btn");

    if (qtyBtn) qtyBtn.classList.toggle("active", state);
    if (expandBtn) expandBtn.classList.toggle("active-2", state);
}
document.body.addEventListener("pointerdown", e => handleActiveState(e, true));
document.body.addEventListener("pointerup", e => setTimeout(() => handleActiveState(e, false), 200));