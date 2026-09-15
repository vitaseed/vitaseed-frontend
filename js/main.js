const API_BASE = 'https://vitaseed-backend.onrender.com';
const CART_KEY = 'gami_cart';
const USER_KEY = 'gami_user';
const TOKEN_KEY = 'token';

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function getUser() { const u = localStorage.getItem(USER_KEY); return u ? JSON.parse(u) : null; }
function saveToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function saveUser(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); }
function getCart() { const c = localStorage.getItem(CART_KEY); return c ? JSON.parse(c) : []; }
function saveCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); renderCart(); }
function escapeHtml(v) { return String(v || '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x])); }

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  initStorePage();
  initProfilePage();
  initOrdersPage();
  setupEventListeners();
});

function setupEventListeners() {
  const contactForm = document.getElementById('contactForm');
  if (contactForm) contactForm.addEventListener('submit', submitContactForm);
  
  document.querySelectorAll('[data-open-cart]').forEach(btn => btn.addEventListener('click', openCart));
  document.querySelectorAll('[data-close-cart]').forEach(btn => btn.addEventListener('click', closeCart));
  document.querySelectorAll('[data-checkout]').forEach(btn => btn.addEventListener('click', submitCheckout));
  document.querySelectorAll('[data-logout]').forEach(btn => btn.addEventListener('click', logout));
  
  document.addEventListener('click', e => {
    const qtyBtn = e.target.closest('[data-quantity]');
    if (qtyBtn) changeCartQuantity(qtyBtn.dataset.quantity, Number(qtyBtn.dataset.amount));
  });
}

async function submitContactForm(e) {
  e.preventDefault();
  const name = document.getElementById('contact-name').value.trim();
  const email = document.getElementById('contact-email').value.trim();
  const message = document.getElementById('contact-message').value.trim();
  
  if (!name || !email || !message) {
    toast.warning('Please fill all fields', 'Validation Error', 3000);
    return;
  }

  loading.show('Sending message...');
  try {
    const res = await fetch(`${API_BASE}/api/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message })
    });
    if (!res.ok) throw new Error('Failed to send message');
    loading.hide();
    toast.success('Thank you! We will respond soon.', 'Message Sent', 4000);
    e.target.reset();
  } catch (err) {
    loading.hide();
    toast.error(err.message || 'Failed to send', 'Error', 4000);
  }
}

async function initStorePage() {
  const container = document.getElementById('shop-product-list');
  if (!container) return;
  
  let products = [];
  try {
    loading.show('Loading seeds...');
    const res = await fetch(`${API_BASE}/api/products`);
    if (!res.ok) throw new Error('Failed to load');
    products = await res.json();
    loading.hide();
  } catch (err) {
    loading.hide();
    toast.error('Unable to load products', 'Error', 4000);
    return;
  }
  
  const update = () => {
    const term = (document.getElementById('productSearch')?.value || '').toLowerCase();
    const sort = document.getElementById('productSort')?.value;
    const filtered = products.filter(p => p.name.toLowerCase().includes(term));
    const sorted = filtered.sort((a, b) => sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : 0);
    renderProducts(sorted, container);
  };
  
  document.getElementById('productSearch')?.addEventListener('input', update);
  document.getElementById('productSort')?.addEventListener('change', update);
  update();
}

function renderProducts(products, container) {
  container.innerHTML = products.map(p => `
    <div class="store-card">
      <div class="store-image">${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}"/>` : '🌱'}</div>
      <div class="store-card-body">
        <h3>${escapeHtml(p.name)}</h3>
        <p class="price">₹${p.price}</p>
        <div class="store-card-row">
          <strong>Add to cart</strong>
          <button type="button" class="btn btn-small" data-add-product="${p.id}">+</button>
        </div>
      </div>
    </div>
  `).join('');
  
  container.querySelectorAll('[data-add-product]').forEach(btn => {
    btn.addEventListener('click', () => {
      const product = products.find(p => p.id === parseInt(btn.dataset.addProduct));
      if (product) addToCart(product);
    });
  });
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) existing.quantity += 1;
  else cart.push({ ...product, quantity: 1 });
  saveCart(cart);
  toast.success(`Added "${product.name}" to cart`, 'Added', 2000);
  openCart();
}

function changeCartQuantity(id, amount) {
  const cart = getCart().map(i => i.id === parseInt(id) ? { ...i, quantity: i.quantity + amount } : i).filter(i => i.quantity > 0);
  saveCart(cart);
}

function updateCartCount() {
  const count = getCart().reduce((sum, i) => sum + i.quantity, 0);
  document.querySelectorAll('[data-cart-count]').forEach(el => el.textContent = count);
}

function renderCart() {
  updateCartCount();
  const list = document.querySelector('[data-cart-list]');
  if (!list) return;
  const cart = getCart();
  list.innerHTML = cart.length ? cart.map(i => `
    <div class="cart-item">
      <div>
        <strong>${escapeHtml(i.name)}</strong>
        <span>₹${i.price} each</span>
        <div class="qty">
          <button type="button" data-quantity="${i.id}" data-amount="-1">−</button>
          <span>${i.quantity}</span>
          <button type="button" data-quantity="${i.id}" data-amount="1">+</button>
        </div>
      </div>
      <strong>₹${i.price * i.quantity}</strong>
    </div>
  `).join('') : '<p style="padding:20px;text-align:center;color:var(--muted);">Your bag is empty</p>';
  
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalEl = document.querySelector('[data-cart-total]');
  if (totalEl) totalEl.textContent = `₹${total}`;
}

function openCart() {
  document.querySelector('.backdrop')?.classList.add('open');
  document.querySelector('.cart-drawer')?.classList.add('open');
}

function closeCart() {
  document.querySelector('.backdrop')?.classList.remove('open');
  document.querySelector('.cart-drawer')?.classList.remove('open');
}

async function submitCheckout() {
  const cart = getCart();
  if (!cart.length) { toast.warning('Your bag is empty', 'Empty Cart', 2000); return; }
  
  const token = getToken();
  if (!token) {
    toast.info('Please log in to checkout', 'Login Required', 2000);
    setTimeout(() => window.location.href = 'login.html?return=shop.html', 1000);
    return;
  }
  
  loading.show('Processing order...');
  try {
    for (const item of cart) {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId: item.id, quantity: item.quantity })
      });
      if (!res.ok) throw new Error('Order failed');
    }
    saveCart([]);
    loading.hide();
    toast.success('Order placed! Check your orders.', 'Success', 4000);
    closeCart();
    setTimeout(() => window.location.href = 'orders.html', 1500);
  } catch (err) {
    loading.hide();
    toast.error(err.message || 'Checkout failed', 'Error', 4000);
  }
}

function initProfilePage() {
  const form = document.getElementById('profileForm');
  if (!form) return;
  
  const user = getUser();
  if (!user) {
    setTimeout(() => window.location.href = 'login.html?return=profile.html', 500);
    return;
  }
  
  document.getElementById('profileTitle').textContent = `Hello, ${user.name.split(' ')[0]}`;
  document.getElementById('profileName').value = user.name;
  document.getElementById('profileEmail').value = user.email;
  
  form.addEventListener('submit', e => {
    e.preventDefault();
    const updatedUser = { ...user, name: document.getElementById('profileName').value.trim() };
    saveUser(updatedUser);
    toast.success('Profile updated', 'Success', 2000);
  });
}

function initOrdersPage() {
  const list = document.getElementById('ordersList');
  if (!list) return;
  
  const token = getToken();
  if (!token) {
    setTimeout(() => window.location.href = 'login.html?return=orders.html', 500);
    return;
  }
  
  loading.show('Loading orders...');
  fetch(`${API_BASE}/api/orders`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.ok ? r.json() : Promise.reject('Failed to load'))
    .then(orders => {
      loading.hide();
      list.innerHTML = orders.length ? orders.map(o => `
        <article class="order-card">
          <div>
            <h2 style="margin:0;font-size:1.1rem;">Order ${escapeHtml(o.id.toString().slice(0, 8))}</h2>
            <p style="margin:4px 0;color:var(--muted);font-size:.9rem;">${new Date(o.createdAt).toLocaleDateString()}</p>
          </div>
          <div class="order-meta">
            <span class="status">${o.status}</span>
            <strong>₹${o.total}</strong>
          </div>
        </article>
      `).join('') : '<p style="text-align:center;color:var(--muted);padding:40px;">No orders yet. <a href="shop.html">Start shopping</a></p>';
    })
    .catch(() => {
      loading.hide();
      toast.error('Failed to load orders', 'Error', 4000);
      list.innerHTML = '<p style="text-align:center;color:var(--error);">Unable to load orders</p>';
    });
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  toast.info('Logged out', 'Goodbye!', 2000);
  setTimeout(() => window.location.href = 'index.html', 1000);
}
