/* ============================================================
   WOLLY LULLY — Clickable Prototype JS
   Shared across all prototype pages
   ============================================================ */

/* --- Cart State (localStorage) --- */
const CART_KEY = 'wl_proto_cart';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function cartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(i => i.id === item.id && i.size === item.size);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  saveCart(cart);
  updateCartBadge();
  showToast(`Added to cart — ${item.name} · ${item.size}`);
}

function removeFromCart(id, size) {
  saveCart(getCart().filter(i => !(i.id === id && i.size === size)));
  updateCartBadge();
  renderCartDrawer();
}

function updateQty(id, size, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id && i.size === size);
  if (item) {
    item.qty = Math.max(1, item.qty + delta);
    saveCart(cart);
    renderCartDrawer();
  }
}

/* --- Badge --- */
function updateCartBadge() {
  const count = cartCount();
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.classList.toggle('visible', count > 0);
  });
}

/* --- Toast --- */
function showToast(msg) {
  let t = document.getElementById('proto-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'proto-toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2800);
}

/* --- Cart Drawer --- */
function openCart() {
  renderCartDrawer();
  document.getElementById('cart-overlay')?.classList.add('open');
  document.getElementById('cart-drawer')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-overlay')?.classList.remove('open');
  document.getElementById('cart-drawer')?.classList.remove('open');
  document.body.style.overflow = '';
}

function renderCartDrawer() {
  const cart = getCart();
  const itemsEl = document.getElementById('cart-items-list');
  const emptyEl = document.getElementById('cart-empty');
  const footerEl = document.getElementById('cart-footer');
  const progressEl = document.getElementById('shipping-progress');
  if (!itemsEl) return;

  const FREE_SHIPPING_THRESHOLD = 300;
  const SHIPPING_COST = 9;
  const total = cartTotal();
  const remaining = FREE_SHIPPING_THRESHOLD - total;

  // Shipping progress bar
  if (progressEl) {
    const pct = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100);
    const msgEl = progressEl.querySelector('p');
    const fillEl = progressEl.querySelector('.progress-bar-fill');
    if (fillEl) fillEl.style.width = pct + '%';
    if (msgEl) {
      if (remaining > 0) {
        msgEl.innerHTML = `Add <strong>CHF ${remaining.toFixed(0)}</strong> more for free delivery 🎉`;
      } else {
        msgEl.innerHTML = `<strong>Free delivery unlocked!</strong> 🎉`;
      }
    }
  }

  if (cart.length === 0) {
    itemsEl.innerHTML = '';
    emptyEl?.style && (emptyEl.style.display = 'flex');
    footerEl?.style && (footerEl.style.display = 'none');
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (footerEl) footerEl.style.display = 'block';

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-image">
        ${item.image
          ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;display:block;">`
          : `<div class="img-placeholder img-${item.colour}">${item.name.split(' ')[0]}</div>`}
      </div>
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">${item.composition} · ${item.size} · ${item.fit}</div>
        <div class="cart-item-price">CHF ${(item.price * item.qty).toFixed(0)}</div>
        <div class="cart-item-controls">
          <div class="qty-controls">
            <button class="qty-btn" onclick="updateQty('${item.id}','${item.size}',-1)">−</button>
            <span class="qty-display">${item.qty}</span>
            <button class="qty-btn" onclick="updateQty('${item.id}','${item.size}',1)">+</button>
          </div>
          <button class="remove-item" onclick="removeFromCart('${item.id}','${item.size}')">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  // Totals
  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const subtotalEl = document.getElementById('cart-subtotal');
  const shippingEl = document.getElementById('cart-shipping');
  const totalEl = document.getElementById('cart-total');
  const vatEl = document.getElementById('cart-vat');
  if (subtotalEl) subtotalEl.textContent = `CHF ${total.toFixed(0)}`;
  if (shippingEl) shippingEl.textContent = shipping === 0 ? 'Free' : `CHF ${shipping}`;
  if (totalEl) totalEl.textContent = `CHF ${(total + shipping).toFixed(0)}`;
  if (vatEl) vatEl.textContent = `CHF ${((total + shipping) * 0.077 / 1.077).toFixed(2)}`;

  // Count in header
  const headerEl = document.querySelector('.cart-drawer-header h3');
  if (headerEl) headerEl.textContent = `Your Cart (${cartCount()} item${cartCount() !== 1 ? 's' : ''})`;
}

/* --- Header scroll --- */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

/* --- Mobile Nav Drawer --- */
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const navOverlay = document.getElementById('nav-overlay');
  const navDrawer = document.getElementById('nav-drawer');
  const closeBtn = document.getElementById('nav-close');

  function openNav() {
    navOverlay?.classList.add('open');
    navDrawer?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeNav() {
    navOverlay?.classList.remove('open');
    navDrawer?.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', openNav);
  closeBtn?.addEventListener('click', closeNav);
  navOverlay?.addEventListener('click', closeNav);
}

/* --- Sticky header on scroll --- */
function initStickyHeader() {
  window.addEventListener('scroll', () => {
    const h = document.querySelector('.site-header');
    if (h) h.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

/* --- Accordion (generic) --- */
function initAccordions() {
  document.querySelectorAll('.accordion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.nextElementSibling;
      const isOpen = btn.classList.contains('open');
      // Close all in same group
      btn.closest('.product-accordions')?.querySelectorAll('.accordion-btn').forEach(b => {
        b.classList.remove('open');
        b.nextElementSibling?.classList.remove('open');
      });
      if (!isOpen) {
        btn.classList.add('open');
        content?.classList.add('open');
      }
    });
  });
}

/* --- Filter accordion (mobile drawer) --- */
function initFilterAccordions() {
  document.querySelectorAll('.filter-accordion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.nextElementSibling;
      const arrow = btn.querySelector('.arrow');
      const isOpen = content?.classList.contains('open');
      content?.classList.toggle('open', !isOpen);
      if (arrow) arrow.textContent = isOpen ? '›' : '‹';
    });
  });
}

/* --- Size guide modal --- */
function initSizeGuide() {
  document.querySelectorAll('.size-guide-link').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('size-guide-modal')?.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });
  document.getElementById('size-guide-close')?.addEventListener('click', closeSizeGuide);
  document.getElementById('size-guide-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeSizeGuide();
  });
}
function closeSizeGuide() {
  document.getElementById('size-guide-modal')?.classList.remove('open');
  document.body.style.overflow = '';
}

/* --- Colour swatches --- */
function initColourSwatches() {
  document.querySelectorAll('.colour-swatches').forEach(group => {
    group.querySelectorAll('.swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        group.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        const label = swatch.closest('.pdp-info')?.querySelector('.selected-colour');
        if (label) label.textContent = swatch.dataset.colour;
      });
    });
  });
}

/* --- Size selector --- */
function initSizeSelector() {
  const sizeBtns = document.querySelectorAll('.size-btn:not(.out-of-stock)');
  const fitLabel = document.getElementById('fit-label');
  const fitLabels = {
    'XS': 'Slim Fit — close-cut, tailored',
    'S':  'Slim Fit — close-cut, tailored',
    'M':  'Classic Fit — true to standard sizing',
    'L':  'Classic Fit — true to standard sizing',
    'XL': 'Relaxed Fit — falls softly, generous through the body',
    'XXL':'Relaxed Fit — falls softly, generous through the body',
  };

  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const size = btn.dataset.size;
      if (fitLabel && fitLabels[size]) fitLabel.textContent = fitLabels[size];

      // Update sticky ATC meta
      const stickyMeta = document.querySelector('.sticky-atc-info .meta');
      if (stickyMeta) {
        const colourSwatch = document.querySelector('.swatch.active');
        const colour = colourSwatch?.dataset.colour || 'Navy';
        stickyMeta.textContent = `${colour} · Size ${size}`;
      }
      // Update ATC button text
      const atcBtn = document.getElementById('atc-btn');
      if (atcBtn) {
        const price = atcBtn.dataset.price;
        atcBtn.textContent = `ADD TO CART — CHF ${price}`;
        atcBtn.dataset.selectedSize = size;
      }
    });
  });
}

/* --- Add to cart (PDP) --- */
function initAddToCart() {
  const atcBtn = document.getElementById('atc-btn');
  if (!atcBtn) return;

  atcBtn.addEventListener('click', () => {
    const size = atcBtn.dataset.selectedSize || document.querySelector('.size-btn.active')?.dataset.size;
    if (!size) {
      showToast('Please select a size first');
      document.querySelector('.size-btn')?.closest('.size-selector')?.classList.add('shake');
      return;
    }
    const colour = document.querySelector('.swatch.active')?.dataset.colour || 'Navy';
    addToCart({
      id:          atcBtn.dataset.id,
      name:        atcBtn.dataset.name,
      price:       parseFloat(atcBtn.dataset.price),
      size,
      colour:      colour.toLowerCase(),
      composition: atcBtn.dataset.composition,
      fit:         document.getElementById('fit-label')?.textContent || 'Classic Fit',
      image:       atcBtn.dataset.image || null,
    });
    openCart();
  });

  // Sticky ATC button
  const stickyAtcBtn = document.getElementById('sticky-atc-btn');
  if (stickyAtcBtn) {
    stickyAtcBtn.addEventListener('click', () => atcBtn.click());
  }
}

/* --- Sticky ATC on scroll (mobile) --- */
function initStickyATC() {
  const stickyBar = document.getElementById('sticky-atc');
  const atcForm = document.getElementById('atc-form');
  if (!stickyBar || !atcForm) return;

  function check() {
    if (window.innerWidth > 640) { stickyBar.classList.remove('visible'); return; }
    const rect = atcForm.getBoundingClientRect();
    stickyBar.classList.toggle('visible', rect.bottom < 0);
  }
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check, { passive: true });
}

/* --- Gallery thumbs --- */
function initGallery() {
  document.querySelectorAll('.pdp-thumb').forEach((thumb, i) => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.pdp-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      // Update main image label
      const main = document.querySelector('.pdp-gallery-main .img-placeholder');
      if (main) main.textContent = thumb.querySelector('.img-placeholder')?.textContent || '';
    });
  });
}

/* --- Checkout: payment option toggle --- */
function initPaymentOptions() {
  document.querySelectorAll('.payment-option:not(.payment-disabled) .payment-option-header input').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
      radio.closest('.payment-option').classList.add('selected');
    });
  });
}

/* --- Checkout: mobile order summary toggle --- */
function initOrderSummaryToggle() {
  const btn = document.getElementById('order-summary-toggle');
  const col = document.getElementById('order-summary-col');
  if (!btn || !col) return;

  btn.addEventListener('click', () => {
    const isOpen = col.classList.toggle('open');
    const arrow = btn.querySelector('.toggle-arrow');
    if (arrow) arrow.textContent = isOpen ? '▲' : '▼';
  });
}

/* --- Checkout: fill order summary from cart --- */
function renderOrderSummary() {
  const cart = getCart();
  const itemsEl = document.getElementById('order-items');
  if (!itemsEl) return;

  const FREE_SHIPPING = 300;
  const SHIPPING = 9;
  const subtotal = cartTotal();
  const shipping = subtotal >= FREE_SHIPPING ? 0 : SHIPPING;
  const total = subtotal + shipping;
  const vat = total * 0.077 / 1.077;

  if (cart.length === 0) {
    // Demo mode: show placeholder items
    itemsEl.innerHTML = `
      <div class="order-item">
        <div class="order-item-image" style="position:relative">
          <img src="imgs/products/navy-cashmere-crewneck-front.png" alt="Navy Cashmere Crewneck" style="width:100%;height:100%;object-fit:cover;display:block;">
          <span class="item-qty-badge">1</span>
        </div>
        <div class="order-item-details">
          <div class="order-item-name">Navy Cashmere Crewneck</div>
          <div class="order-item-meta">100% 2-ply cashmere · Size M · Classic Fit</div>
        </div>
        <div class="order-item-price">CHF 285</div>
      </div>
      <div class="order-item">
        <div class="order-item-image" style="position:relative">
          <img src="imgs/products/grey-cashmere-beanie-front.png" alt="Grey Cashmere Beanie" style="width:100%;height:100%;object-fit:cover;display:block;">
          <span class="item-qty-badge">1</span>
        </div>
        <div class="order-item-details">
          <div class="order-item-name">Grey Cashmere Beanie</div>
          <div class="order-item-meta">100% cashmere · One Size</div>
        </div>
        <div class="order-item-price">CHF 185</div>
      </div>
    `;
    // Static totals for demo
    setCheckoutTotals(470, 9, 479);
    return;
  }

  itemsEl.innerHTML = cart.map(item => `
    <div class="order-item">
      <div class="order-item-image" style="position:relative">
        <div class="img-placeholder img-${item.colour}">${item.colour.slice(0,3).toUpperCase()}</div>
        <span class="item-qty-badge">${item.qty}</span>
      </div>
      <div class="order-item-details">
        <div class="order-item-name">${item.name}</div>
        <div class="order-item-meta">${item.composition} · ${item.size} · ${item.fit.split('—')[0].trim()}</div>
      </div>
      <div class="order-item-price">CHF ${(item.price * item.qty).toFixed(0)}</div>
    </div>
  `).join('');

  setCheckoutTotals(subtotal, shipping, total);

  // Update pay button
  const payBtn = document.getElementById('pay-btn');
  if (payBtn) payBtn.textContent = `PAY SECURELY — CHF ${total.toFixed(0)}`;
}

function setCheckoutTotals(subtotal, shipping, total) {
  const vat = total * 0.077 / 1.077;
  const el = id => document.getElementById(id);
  if (el('co-subtotal')) el('co-subtotal').textContent = `CHF ${subtotal.toFixed(0)}`;
  if (el('co-shipping')) el('co-shipping').textContent = shipping === 0 ? 'Free' : `CHF ${shipping}`;
  if (el('co-vat')) el('co-vat').textContent = `CHF ${vat.toFixed(2)}`;
  if (el('co-total')) el('co-total').textContent = `CHF ${total.toFixed(0)}`;
  const payBtn = document.getElementById('pay-btn');
  if (payBtn) payBtn.textContent = `PAY SECURELY — CHF ${total.toFixed(0)}`;
}

/* --- Shop: filter & sort products --- */
function initShopFilters() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const allCards = Array.from(grid.querySelectorAll('.product-card'));
  const countEl = document.getElementById('results-count');
  const activeFiltersEl = document.getElementById('active-filters');
  const clearBtn = document.getElementById('clear-filters');

  const state = { price: '', colour: '', size: '', fit: '', style: '', material: '', sort: 'featured' };

  function applyFilters() {
    let visible = 0;
    const activeChips = [];

    allCards.forEach(card => {
      const d = card.dataset;
      let show = true;
      if (state.price && d.price !== state.price) show = false;
      if (state.colour && d.colour !== state.colour) show = false;
      if (state.size && !d.sizes.split(',').includes(state.size)) show = false;
      if (state.fit && d.fit !== state.fit) show = false;
      if (state.style && d.style !== state.style) show = false;
      if (state.material && d.material !== state.material) show = false;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (countEl) countEl.textContent = `${visible} of ${allCards.length} products`;

    // Active filter chips
    const chipLabels = { price: 'Price', colour: 'Colour', size: 'Size', fit: 'Fit', style: 'Style', material: 'Material' };
    if (activeFiltersEl) {
      activeFiltersEl.innerHTML = Object.entries(state)
        .filter(([k, v]) => v && k !== 'sort')
        .map(([k, v]) => `
          <span class="filter-chip">
            ${chipLabels[k]}: ${v}
            <button onclick="clearFilter('${k}')" title="Remove filter">×</button>
          </span>
        `).join('');
    }

    // Mobile filter badge
    const activeCount = Object.entries(state).filter(([k, v]) => v && k !== 'sort').length;
    document.querySelectorAll('.filter-badge').forEach(b => {
      b.textContent = activeCount;
      b.classList.toggle('visible', activeCount > 0);
    });
  }

  window.clearFilter = function(key) {
    state[key] = '';
    const sel = document.querySelector(`[data-filter="${key}"]`);
    if (sel) sel.value = '';
    // Mobile options
    document.querySelectorAll(`[data-filter-key="${key}"] .filter-option-btn`).forEach(b => b.classList.remove('active'));
    applyFilters();
  };

  // Desktop selects
  document.querySelectorAll('.filter-select[data-filter]').forEach(sel => {
    sel.addEventListener('change', () => {
      state[sel.dataset.filter] = sel.value;
      applyFilters();
    });
  });

  // Sort
  const sortSel = document.getElementById('sort-select');
  sortSel?.addEventListener('change', () => {
    state.sort = sortSel.value;
    const cards = Array.from(grid.querySelectorAll('.product-card'));
    if (state.sort === 'price-asc') {
      cards.sort((a, b) => parseFloat(a.dataset.priceNum) - parseFloat(b.dataset.priceNum));
    } else if (state.sort === 'price-desc') {
      cards.sort((a, b) => parseFloat(b.dataset.priceNum) - parseFloat(a.dataset.priceNum));
    } else {
      cards.sort((a, b) => parseFloat(a.dataset.order) - parseFloat(b.dataset.order));
    }
    cards.forEach(c => grid.appendChild(c));
  });

  // Clear all
  clearBtn?.addEventListener('click', () => {
    Object.keys(state).forEach(k => { if (k !== 'sort') state[k] = ''; });
    document.querySelectorAll('.filter-select').forEach(s => s.value = '');
    document.querySelectorAll('.filter-option-btn').forEach(b => b.classList.remove('active'));
    applyFilters();
  });

  // Mobile filter drawer toggle
  const filterToggle = document.getElementById('filter-toggle-btn');
  const filterDrawer = document.getElementById('filter-drawer');
  const filterOverlay = document.getElementById('filter-overlay');
  const filterClose = document.getElementById('filter-drawer-close');
  const showResultsBtn = document.getElementById('show-results-btn');

  filterToggle?.addEventListener('click', () => {
    filterDrawer?.classList.add('open');
    filterOverlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  function closeFilterDrawer() {
    filterDrawer?.classList.remove('open');
    filterOverlay?.classList.remove('open');
    document.body.style.overflow = '';
  }

  filterClose?.addEventListener('click', closeFilterDrawer);
  filterOverlay?.addEventListener('click', closeFilterDrawer);
  showResultsBtn?.addEventListener('click', closeFilterDrawer);

  // Mobile filter option buttons
  document.querySelectorAll('.filter-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.filterKey;
      const val = btn.dataset.value;
      const group = btn.closest('.filter-accordion-content');
      group?.querySelectorAll('.filter-option-btn').forEach(b => b.classList.remove('active'));
      if (state[key] === val) {
        state[key] = '';
      } else {
        btn.classList.add('active');
        state[key] = val;
      }
      applyFilters();
    });
  });

  applyFilters();
}

/* --- Init all --- */
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  initHeader();
  initStickyHeader();
  initMobileNav();
  initAccordions();
  initFilterAccordions();
  initSizeGuide();
  initColourSwatches();
  initSizeSelector();
  initAddToCart();
  initStickyATC();
  initGallery();
  initPaymentOptions();
  initOrderSummaryToggle();
  renderOrderSummary();
  initShopFilters();

  // Cart drawer open/close
  document.querySelectorAll('.cart-btn, #open-cart').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
  });
  document.getElementById('cart-overlay')?.addEventListener('click', closeCart);
  document.getElementById('cart-close')?.addEventListener('click', closeCart);

  // Checkout button in cart
  document.getElementById('cart-checkout-btn')?.addEventListener('click', () => {
    closeCart();
    window.location.href = 'checkout.html';
  });
});
