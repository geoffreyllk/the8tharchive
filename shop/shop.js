// sticky promotions toggle
const promoLink = document.getElementById('promo-link');
const promoSentinel = document.getElementById('promo-sentinel');

const promoObserver = new IntersectionObserver(
    ([entry]) => {
        if (entry.isIntersecting) {
            promoLink.classList.add('border-b', 'border-gray-700', 'hover:border-gray-400');
            promoLink.classList.remove('bg-black');
            promoLink.style.backgroundColor = '#0f0f0f';

        } else {
            promoLink.classList.remove('border-b', 'border-gray-700', 'hover:border-gray-400');
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

let cartNoticeTimeout;

function showCartNotice(message = "Item added to cart") {
    const notice = document.getElementById("cartNotice");
    notice.textContent = message;

    notice.classList.remove("show", "hide");
    notice.style.animation = "none";
    void notice.offsetWidth;
    notice.style.animation = null;
    notice.classList.add("show");

    clearTimeout(cartNoticeTimeout);
    cartNoticeTimeout = setTimeout(() => {
        notice.classList.remove("show");
        notice.classList.add("hide");
    }, 2000);
}

document.addEventListener("DOMContentLoaded", () => {
    const pathSegments = window.location.pathname.split('/');
    const posterId = pathSegments[pathSegments.length - 1];
    const urlParams = new URLSearchParams(window.location.search);
    const frameParam = urlParams.get("frame") || "unframed";

    let selectedFrame = frameParam;
    let currentSlide = 0;

    const cartCountEl = document.getElementById("cartCount");
    const addToCartBtn = document.getElementById("addToCartBtn");
    const plusBtn = document.querySelector(".qty-btn button:last-child");
    const minusBtn = document.querySelector(".qty-btn button:first-child");
    const qtyDisplay = document.querySelector(".qty-btn span");

    function updateCartCountDisplay() {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartContentEl = document.getElementById("cart-content");

        cartCountEl.textContent = totalItems;

        if (cartContentEl) {
            cartContentEl.style.animation = "none";
            void cartContentEl.offsetWidth;
            cartContentEl.style.animation = "revealTopToBottom 3s ease-out forwards";
        }
    }

    function enableHoverStyles() {
        addToCartBtn.classList.add("hover:bg-white", "hover:text-black", "hover:border-white");

        plusBtn.classList.add("hover:border-white");
        minusBtn.classList.add("hover:border-white");
    }

    function disableHoverStyles() {
        addToCartBtn.classList.remove("hover:bg-white", "hover:text-black", "hover:border-white");

        plusBtn.classList.remove("hover:border-white");
        minusBtn.classList.remove("hover:border-white");
    }

    function disableAddToCartUI(statusText = "Sold Out") {
        addToCartBtn.disabled = true;
        addToCartBtn.textContent = statusText;
        addToCartBtn.classList.add("cursor-not-allowed", "text-gray-200", "border-gray-600");

        plusBtn.disabled = true;
        plusBtn.classList.add("cursor-not-allowed", "border-gray-600", "text-gray-600");

        minusBtn.disabled = true;
        minusBtn.classList.add("cursor-not-allowed", "border-gray-600", "text-gray-600");

        disableHoverStyles();

        addToCartBtn.onclick = null;
    }


    function enableAddToCartUI() {
        addToCartBtn.disabled = false;
        addToCartBtn.textContent = "Add to Cart";
        addToCartBtn.classList.remove("cursor-not-allowed", "text-gray-200", "border-gray-600");

        plusBtn.disabled = false;
        plusBtn.classList.remove("cursor-not-allowed", "border-gray-600", "text-gray-600");

        minusBtn.disabled = false;
        minusBtn.classList.remove("cursor-not-allowed", "border-gray-600", "text-gray-600");

        if (document.documentElement.classList.contains("no-touch")) {
            enableHoverStyles();
        }
    }

    function updateQtyButtonStates(qty, maxQty) {
        const isNoTouch = document.documentElement.classList.contains("no-touch");

        // MINUS button logic
        minusBtn.disabled = qty <= 1;
        minusBtn.classList.toggle("cursor-not-allowed", qty <= 1);
        minusBtn.classList.toggle("border-gray-600", qty <= 1);
        minusBtn.classList.toggle("text-gray-600", qty <= 1);

        // PLUS button logic
        plusBtn.disabled = qty >= maxQty;
        plusBtn.classList.toggle("cursor-not-allowed", qty >= maxQty);
        plusBtn.classList.toggle("border-gray-600", qty >= maxQty);
        plusBtn.classList.toggle("text-gray-600", qty >= maxQty);

        if (isNoTouch) {
            if (!plusBtn.disabled) {
                plusBtn.classList.add("hover:border-white");
            } else {
                plusBtn.classList.remove("hover:border-white");
            }

            if (!minusBtn.disabled) {
                minusBtn.classList.add("hover:border-white");
            } else {
                minusBtn.classList.remove("hover:border-white");
            }
        }
    }

    function adjustQuantity(delta, stock, posterId) {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const totalInCart = cart
            .filter(item => item.id.startsWith(`${posterId}-`))
            .reduce((sum, item) => sum + item.quantity, 0);

        const currentQty = parseInt(qtyDisplay.textContent);
        const maxQty = stock - totalInCart;

        if (maxQty <= 0) {
            qtyDisplay.textContent = "0";
            disableAddToCartUI();
            return;
        }

        const newQty = currentQty + delta;
        if (newQty >= 1 && newQty <= maxQty) {
            qtyDisplay.textContent = newQty;
            updateQtyButtonStates(newQty, maxQty);
        }
    }

    function computePrice(priceInfo) {
        // returns { hasPrice, original, final, hasPromo, promoText, discountMeta }
        if (!priceInfo || priceInfo.original == null) return { hasPrice: false };

        const original = Number(priceInfo.original);
        const discount = priceInfo.discount;

        if (!discount) {
            return { hasPrice: true, original, final: original, hasPromo: false, promoText: null, discountMeta: null };
        }
        if (discount.type === "percent" && typeof discount.value === "number") {
            const pct = discount.value;
            const final = Math.max(0, Math.floor(original * (100 - pct) / 100));
            const promoText = `⚡${pct}% OFF`;
            return { hasPrice: true, original, final, hasPromo: true, promoText, discountMeta: { type: "percent", value: pct } };
        }
        if (discount.type === "fixed" && typeof discount.value === "number") {
            const off = Number(discount.value);
            const final = Math.max(0, Math.floor(original - off));
            const promoText = `⚡RM${off} OFF`;
            return { hasPrice: true, original, final, hasPromo: true, promoText, discountMeta: { type: "fixed", value: off } };
        }
        // fallback
        return { hasPrice: true, original, final: original, hasPromo: false, promoText: null, discountMeta: null };
        }

    function updateFrameSection(poster) {
        const priceLabel = document.getElementById("priceLabel");
        const originalPrice = document.getElementById("originalPrice");
        const frameDesc = document.getElementById("frameDesc");
        const promoLink = document.getElementById("promo-link");
        const discountLabel = document.getElementById("discount-label");

        function setFrame(option) {
            selectedFrame = option;
            document.querySelectorAll(".frameOptionBtn").forEach(btn =>
            btn.classList.toggle("active", btn.dataset.option === option)
            );

            const priceInfo = poster.price && poster.price[option] ? poster.price[option] : { original: null, discount: null };
            const p = computePrice(priceInfo);

            // Promo sentinel logic:
            // priority: poster.promo (explicit string) > computed promo from discount > hidden
            if (poster.promo) {
                promoLink.classList.remove("hidden");
                promoLink.href = `../promotions.html?ref=${encodeURIComponent(posterId)}`;
                promoLink.setAttribute("aria-label", poster.promo);
                promoLink.innerHTML = `<span>&#10033;</span><p class="hover:underline m-0">${poster.promo}</p><span>&#10033;</span>`;
            } else if (p.hasPromo) {
                promoLink.classList.remove("hidden");
                promoLink.href = `../promotions.html?ref=${encodeURIComponent(posterId)}`;
                promoLink.setAttribute("aria-label", p.promoText);
                promoLink.innerHTML = `<span>&#10033;</span><p class="hover:underline m-0">${p.promoText}</p><span>&#10033;</span>`;
            } else {
                promoLink.classList.add("hidden");
            }

            // Price rendering
            if (!p.hasPrice) {
                priceLabel.textContent = "RM —";
                originalPrice.classList.add("hidden");
                if (discountLabel) discountLabel.style.display = "none";
            } else if (!p.hasPromo || p.final === p.original) {
                priceLabel.textContent = `RM ${p.original}`;
                originalPrice.classList.add("hidden");
                if (discountLabel) discountLabel.style.display = "none";
            } else {
                priceLabel.textContent = `RM ${p.final}`;
                originalPrice.textContent = `RM ${p.original}`;
                originalPrice.classList.remove("hidden");
                if (discountLabel) {
                    discountLabel.textContent = p.promoText;
                    discountLabel.style.display = "inline-flex";
                }
            }

            frameDesc.textContent = {
            unframed: "Rolled poster in kraft tube — ready to frame or pin.",
            framed:   "Framed & sealed, ships flat in protective rigid box."
            }[option];

            // update quantity controls
            const cart = JSON.parse(localStorage.getItem("cart")) || [];
            const inCart = cart
            .filter(item => item.id.startsWith(`${posterId}-`))
            .reduce((sum, item) => sum + item.quantity, 0);

            const stockVal = (typeof poster.stock === "number") ? poster.stock : 10;
            updateQtyControls(stockVal, inCart);
        }

        // initialize and bind buttons
        setFrame(selectedFrame);
        document.querySelectorAll(".frameOptionBtn").forEach(btn =>
            btn.addEventListener("click", () => setFrame(btn.dataset.option))
        );
        }

    function updateQtyControls(stock, inCart) {
        const maxQty = stock - inCart;
        if (maxQty <= 0) {
            qtyDisplay.textContent = "0";
            disableAddToCartUI();
            return;
        }

        qtyDisplay.textContent = "1";
        updateQtyButtonStates(1, maxQty);

        minusBtn.onclick = () => adjustQuantity(-1, stock, posterId);
        plusBtn.onclick = () => adjustQuantity(1, stock, posterId);
    }

    function setupSlideshow(images) {
        const track = document.getElementById("slideTrack");
        const slideshow = document.querySelector(".slideshow");
        const counter = document.getElementById("slideCounter");

        track.innerHTML = images
            .map(img => `<img src="${img.src}" alt="${img.alt}" onerror="this.src='assets/placeholder-404.webp';" />`)
            .join("");

        let currentSlide = 0;
        const totalSlides = images.length;

        counter.textContent = `1 / ${totalSlides}`;
        track.style.transform = `translateX(0%)`;

        // Slide change logic
        window.changeSlide = (dir) => {
            currentSlide = (currentSlide + dir + totalSlides) % totalSlides;
            track.style.transform = `translateX(-${currentSlide * 100}%)`;
            counter.textContent = `${currentSlide + 1} / ${totalSlides}`;
        };

        // Auto slide
        let autoSlide = setInterval(() => changeSlide(1), 5000);

        // pause on hover
        slideshow.addEventListener("mouseenter", () => clearInterval(autoSlide));
        slideshow.addEventListener("mouseleave", () => {
            autoSlide = setInterval(() => changeSlide(1), 5000);
        });
    }

    function updateMetaTags(poster) {
        document.title = `${poster.title} | The8thArchive`;

        document.querySelector('meta[name="description"]').setAttribute('content', poster.metaDescription);

        document.querySelector('meta[property="og:title"]').setAttribute('content', poster.title + " | The8thArchive");
        document.querySelector('meta[property="og:description"]').setAttribute('content', poster.ogDescription);
        document.querySelector('meta[property="og:image"]').setAttribute('content', poster.images[0].src);
        document.querySelector('meta[property="og:image:alt"]').setAttribute('content', poster.title + " Limited Edition Poster");

        const canonical = `https://the8tharchive.com.my/shop/${posterId}.html`;
        document.querySelector('link[rel="canonical"]').setAttribute('href', canonical);

        document.querySelector('meta[property="og:url"]').setAttribute('content', canonical);

        let keywordsMeta = document.querySelector('meta[name="keywords"]');
        if (!keywordsMeta) {
            keywordsMeta = document.createElement('meta');
            keywordsMeta.name = "keywords";
            document.head.appendChild(keywordsMeta);
        }
        keywordsMeta.setAttribute('content', poster.keywords.join(', ') + ', automotive posters, limited edition art');
    }


    fetch("shop.json")
        .then(res => res.json())
        .then(data => {
            const poster = data[posterId];
            if (!poster) return;

            document.querySelector("h1").textContent = poster.title || "";
            document.querySelector("h2").textContent = poster.car || "";
            document.title = `${poster.title || "Shop"} — The8thArchive`;

            const posterDesc = document.getElementById("posterDesc");
            posterDesc.innerHTML = poster.description || "Description";
            const readMoreBtn = document.getElementById("readMoreBtn");

            function isClamped(el) {
                return el.scrollHeight > el.clientHeight;
            }

            // Only show "Read More" if clamped
            requestAnimationFrame(() => {
                if (isClamped(posterDesc)) {
                    readMoreBtn.classList.remove("hidden");
                } else {
                    readMoreBtn.classList.add("hidden");
                }
            });
            
            readMoreBtn.addEventListener("click", () => {
                posterDesc.classList.toggle("line-clamp-3");
                if (posterDesc.classList.contains("line-clamp-3")) {
                    readMoreBtn.textContent = "Read more";
                } else {
                    readMoreBtn.textContent = "Read less";
                }
            });                                        

            document.getElementById("stockText").textContent = (typeof poster.stock === "number") ? `Only ${poster.stock} left` : "N/A";

            const specEls = document.querySelectorAll(".specs .grid > div p:last-child");
            specEls[3].textContent = poster.release || "TBA";

            const edition = poster.edition;
            const editionInfoEl = document.getElementById("editionInfo");
            const limitedEditionEl = document.getElementById("limited-edition");

            let editionText = "Display Only";
            let showLimited = false;

            switch (true) {
                case typeof edition !== "number":
                    editionText = "Display Only";
                    break;
                case edition === 0:
                    editionText = "Open Release";
                    break;
                case edition === 1:
                    editionText = "1 of 1";
                    showLimited = true;
                    break;
                case edition > 1:
                    editionText = `1 of ${edition}`;
                    showLimited = true;
                    break;
            }

            specEls[4].textContent = editionText;
            editionInfoEl.textContent = showLimited ? `Limited Edition — ${editionText}` : "";
            limitedEditionEl.style.display = showLimited ? "block" : "none";

            const stock = poster.stock;
            if (typeof stock === "number") {
                if (stock <= 0) {
                    specEls[5].textContent = "Sold Out";
                } else if (stock <= 5) {
                    specEls[5].textContent = `Only ${stock} remaining`;
                } else if (stock <= 20) {
                    specEls[5].textContent = `Active`;
                } else if (stock === 999) {
                    specEls[5].textContent = "In Stock";
                } else {
                    specEls[5].textContent = `Available`;
                }
            } else {
                specEls[5].textContent = "N/A";
            }

            setupSlideshow(poster.images || []);
            updateFrameSection(poster);
            updateMetaTags(poster);

            const cart = JSON.parse(localStorage.getItem("cart")) || [];
            const inCart = cart
                .filter(item => item.id.startsWith(`${posterId}-`))
                .reduce((sum, item) => sum + item.quantity, 0);

            const posterStock = (typeof poster.stock === "number") ? poster.stock : Infinity;

            if (posterStock <= 0 || inCart >= posterStock) {
                qtyDisplay.textContent = "0";
                disableAddToCartUI("Sold Out");
            } else {
                qtyDisplay.textContent = "1";
                enableAddToCartUI();
            }
            updateQtyControls(posterStock, inCart);

            const rawStatus = (poster.status || "").toLowerCase();
            const normStatus = rawStatus.replace(/[\s\-_]+/g, "");

            if (normStatus.includes("coming")) {
                disableAddToCartUI("Coming Soon");
                addToCartBtn.onclick = null;
            } else if (normStatus.includes("display")) {
                disableAddToCartUI("Display Only");
            }

            addToCartBtn.addEventListener("click", () => {
                if (addToCartBtn.disabled) return;

                const priceInfo = (poster.price && poster.price[selectedFrame]) ? poster.price[selectedFrame] : null;
                const p = computePrice(priceInfo);

                if (!p.hasPrice) {
                    showCartNotice("Price unavailable — enquire for details");
                    return;
                }

                const quantity = parseInt(qtyDisplay.textContent, 10) || 1;
                const cartItemId = `${posterId}-${selectedFrame}`;

                let updatedCart = JSON.parse(localStorage.getItem("cart")) || [];
                const index = updatedCart.findIndex(item => item.id === cartItemId);

                const inCartTotal = updatedCart
                    .filter(item => item.id.startsWith(`${posterId}-`))
                    .reduce((sum, item) => sum + item.quantity, 0);

                const remaining = (typeof poster.stock === "number" && isFinite(poster.stock)) ? (poster.stock - inCartTotal) : Infinity;

                addToCartBtn.classList.add("clicked");
                setTimeout(() => addToCartBtn.classList.remove("clicked"), 1500);

                if (quantity > remaining || remaining <= 0) {
                    disableAddToCartUI("Sold Out");
                    return;
                }

                if (index !== -1) {
                    updatedCart[index].quantity = Math.min(updatedCart[index].quantity + quantity, poster.stock || updatedCart[index].quantity + quantity);
                } else {
                    updatedCart.push({
                    id: cartItemId,
                    title: poster.title,
                    frame: selectedFrame,
                    price: p.final,
                    originalPrice: p.original,
                    discountMeta: p.discountMeta,
                    quantity,
                    stock: poster.stock,
                    img: poster.img,
                    link: `./shop/${posterId}`
                    });
                }

                localStorage.setItem("cart", JSON.stringify(updatedCart));
                updateCartCountDisplay();
                qtyDisplay.textContent = "1";

                const latestCart = JSON.parse(localStorage.getItem("cart")) || [];
                const newInCart = latestCart
                    .filter(item => item.id.startsWith(`${posterId}-`))
                    .reduce((sum, item) => sum + item.quantity, 0);

                updateQtyControls(posterStock, newInCart);
                showCartNotice("Item added to cart");
                });

            updateCartCountDisplay();
        });
});