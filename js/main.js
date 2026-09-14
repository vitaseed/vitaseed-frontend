const API_BASE = "https://vitaseed-backend.onrender.com";

/* ---------- UTIL ---------- */
function setStatus(text, isError = false) {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? "crimson" : "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ---------- LOAD PRODUCTS ---------- */
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    const products = await res.json();

    const container = document.getElementById("product-list");
    if (!container) return;

    container.innerHTML = "";

    products.forEach(p => {
      container.innerHTML += `
        <div class="product-card">
          <h3>${p.name}</h3>
          <p>Price: ₹${p.price}</p>
          <button onclick="orderNow('${p.id}')">Order</button>
        </div>
      `;
    });
  } catch (err) {
    console.error("Failed to load products", err);
  }
}

/* ---------- PLACE ORDER ---------- */
async function orderNow(productId) {
  const order = { productId, quantity: 1 };

  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Order failed: ${res.status} ${res.statusText} ${txt}`);
    }

    const ct = res.headers.get("content-type") || "";
    let message = "Order placed successfully";
    if (res.status === 204 || !ct) {
      // no body
    } else if (ct.includes("application/json")) {
      const data = await res.json().catch(() => ({}));
      message = data.message || message;
    } else {
      message = await res.text().catch(() => message);
    }

    alert(message);
  } catch (err) {
    console.error("Order failed:", err);
    alert("Order failed. See console for details.");
  }
}

/* ---------- CONTACT FORM ---------- */
async function submitContactForm(e) {
  e.preventDefault();

  const submitBtn = document.getElementById("contactSubmit");
  if (submitBtn) submitBtn.disabled = true;
  setStatus("Sending...");

  const name = (document.getElementById("name") || {}).value || "";
  const email = (document.getElementById("email") || {}).value || "";
  const message = (document.getElementById("message") || {}).value || "";

  if (!name.trim() || !email.trim() || !message.trim()) {
    setStatus("All fields are required.", true);
    if (submitBtn) submitBtn.disabled = false;
    return;
  }
  if (!isValidEmail(email.trim())) {
    setStatus("Please enter a valid email address.", true);
    if (submitBtn) submitBtn.disabled = false;
    return;
  }

  const payload = { name: name.trim(), email: email.trim(), message: message.trim() };

  // --- DEBUG LOGGING ---
  console.log("Contact form: sending payload to", `${API_BASE}/api/contacts`);
  console.log("Payload:", payload);

  try {
    const res = await fetch(`${API_BASE}/api/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    // If server rejects request, attempt to read body for diagnostics
    if (!res.ok) {
      const ct = res.headers.get("content-type") || "";
      let serverMsg = `Server returned ${res.status} ${res.statusText}`;
      if (ct.includes("application/json")) {
        // try parse JSON error body
        const errJson = await res.json().catch(() => null);
        console.error("Server responded with JSON error body:", errJson);
        if (errJson) serverMsg = errJson.error || errJson.message || JSON.stringify(errJson);
      } else {
        const txt = await res.text().catch(() => "");
        console.error("Server responded with text error body:", txt);
        if (txt) serverMsg = txt;
      }
      // surface server message in UI and console
      setStatus(serverMsg, true);
      throw new Error(serverMsg);
    }

    // Success path: handle JSON, text or 204
    const ct = res.headers.get("content-type") || "";
    let successMessage = "Thanks! We've received your enquiry.";
    if (res.status === 204 || !ct) {
      // nothing to parse
    } else if (ct.includes("application/json")) {
      const data = await res.json().catch(() => null);
      console.log("Server success JSON:", data);
      if (data && data.message) successMessage = data.message;
    } else {
      const text = await res.text().catch(() => "");
      if (text) {
        console.log("Server success text:", text);
        successMessage = text;
      }
    }

    setStatus("Thanks! We've received your enquiry. Our team will respond soon.");
    e.target.reset();
  } catch (err) {
    console.error("Contact submit failed (caught):", err);
    // err.message was already set to server message when possible
    if (!document.getElementById("status").textContent) {
      setStatus(err.message || "Failed to send message. See console for details.", true);
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (form) form.addEventListener("submit", submitContactForm);

  const productList = document.getElementById("product-list");
  if (productList) loadProducts();
});

/* ---------- STOREFRONT EXPERIENCE ---------- */
const CART_KEY = "gami_cart";
const USER_KEY = "gami_user";
const USER_ORDERS_KEY = "gami_orders";

function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}

function writeStorage(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

function getCart() { return readStorage(CART_KEY, []); }

function saveCart(cart) {
  writeStorage(CART_KEY, cart);
  renderCart();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function updateCartCount() {
  const count = getCart().reduce((total, item) => total + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach(element => { element.textContent = count; });
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  if (existing) existing.quantity += 1;
  else cart.push({ id: product.id, name: product.name, price: Number(product.price), image: product.image || "", quantity: 1 });
  saveCart(cart);
  openCart();
}

function changeCartQuantity(id, amount) {
  const cart = getCart().map(item => item.id === id ? { ...item, quantity: item.quantity + amount } : item).filter(item => item.quantity > 0);
  saveCart(cart);
}

function renderCart() {
  updateCartCount();
  const list = document.querySelector("[data-cart-list]");
  const totalElement = document.querySelector("[data-cart-total]");
  if (!list) return;
  const cart = getCart();
  list.innerHTML = cart.length ? cart.map(item => `<div class="cart-item"><div><strong>${escapeHtml(item.name)}</strong><span>₹${item.price} each</span><div class="qty"><button type="button" data-quantity="${item.id}" data-amount="-1">−</button><span>${item.quantity}</span><button type="button" data-quantity="${item.id}" data-amount="1">+</button></div></div><button type="button" onclick="changeCartQuantity('${item.id}', -${item.quantity})">Remove</button></div>`).join("") : "<p>Your cart is empty</p>";
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (totalElement) totalElement.textContent = `₹${total}`;
}

function openCart() { document.querySelector(".backdrop")?.classList.add("open"); document.querySelector(".cart-drawer")?.classList.add("open"); }
function closeCart() { document.querySelector(".backdrop")?.classList.remove("open"); document.querySelector(".cart-drawer")?.classList.remove("open"); }

async function fetchProductsForStore() {
  const response = await fetch(`${API_BASE}/api/products`);
  if (!response.ok) throw new Error("We could not load the collection.");
  return response.json();
}

function renderStoreProducts(products, container) {
  container.innerHTML = products.length ? products.map(product => `<article class="store-card"><div class="store-image">${product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />` : ""}</div><h3>${escapeHtml(product.name)}</h3><p class="price">₹${product.price}</p><button type="button" class="btn" data-add-product="${product.id}">Add to cart</button></article>`).join("") : "<p>No products available</p>";
  container.querySelectorAll("[data-add-product]").forEach(button => button.addEventListener("click", () => { const product = products.find(item => String(item.id) === button.dataset.addProduct); if (product) addToCart(product); }));
}

async function initStorePage() {
  const container = document.getElementById("shop-product-list");
  if (!container) return;
  let products = [];
  try { products = await fetchProductsForStore(); } catch (error) { container.innerHTML = `<p class="admin-error">${error.message}</p>`; return; }
  const update = () => {
    const term = (document.getElementById("productSearch")?.value || "").toLowerCase();
    const sort = document.getElementById("productSort")?.value;
    const visible = products.filter(product => product.name.toLowerCase().includes(term)).sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : 0);
    renderStoreProducts(visible, container);
  };
  document.getElementById("productSearch")?.addEventListener("input", update);
  document.getElementById("productSort")?.addEventListener("change", update);
  update();
}

async function submitCheckout() {
  const cart = getCart();
  if (!cart.length) return;
  const user = readStorage(USER_KEY, null);
  if (!user) { window.location.href = "login.html?return=shop.html"; return; }
  const button = document.querySelector("[data-checkout]");
  if (button) button.disabled = true;
  try {
    for (const item of cart) {
      const response = await fetch(`${API_BASE}/api/orders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: item.id, quantity: item.quantity, userId: user.id }) });
      if (!response.ok) throw new Error("Your order could not be sent.");
    }
    const orders = readStorage(USER_ORDERS_KEY, []);
    orders.unshift({ id: `local-${Date.now()}`, createdAt: new Date().toISOString(), status: "pending", items: cart, total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0) });
    writeStorage(USER_ORDERS_KEY, orders);
    saveCart([]);
    alert("Thanks. Your order has been sent for confirmation.");
  } catch (error) { alert(error.message); } finally { if (button) button.disabled = false; }
}

function initAuthPages() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  if (registerForm) registerForm.addEventListener("submit", event => { event.preventDefault(); writeStorage(USER_KEY, { name: document.getElementById("registerName").value.trim(), email: document.getElementById("registerEmail").value.trim(), id: `user-${Date.now()}` }); window.location.href = "shop.html"; });
  if (loginForm) loginForm.addEventListener("submit", event => { event.preventDefault(); const user = readStorage(USER_KEY, null); const email = document.getElementById("loginEmail").value.trim(); if (!user || user.email !== email) { alert("User not found or email incorrect"); return; } const returnPage = new URLSearchParams(window.location.search).get("return") || "shop.html"; window.location.href = returnPage; });
}

function initProfilePage() {
  const form = document.getElementById("profileForm");
  if (!form) return;
  const user = readStorage(USER_KEY, null);
  if (!user) { window.location.href = "login.html?return=profile.html"; return; }
  document.getElementById("profileTitle").textContent = `Hello, ${user.name.split(" ")[0]}`;
  document.getElementById("profileName").value = user.name;
  document.getElementById("profileEmail").value = user.email;
  document.getElementById("profileNote").value = user.note || "";
  form.addEventListener("submit", event => { event.preventDefault(); writeStorage(USER_KEY, { ...user, name: document.getElementById("profileName").value.trim(), note: document.getElementById("profileNote").value.trim() }); alert("Profile updated"); });
}

function initOrdersPage() {
  const list = document.getElementById("ordersList");
  if (!list) return;
  if (!readStorage(USER_KEY, null)) { window.location.href = "login.html?return=orders.html"; return; }
  const orders = readStorage(USER_ORDERS_KEY, []);
  list.innerHTML = orders.length ? orders.map(order => `<article class="order-card"><div><p class="eyebrow">${new Date(order.createdAt).toLocaleDateString()}</p><h2>Order ${escapeHtml(order.id.slice(0, 8))}</h2><p>Status: <strong>${order.status}</strong></p><p>Total: ₹${order.total}</p></div><button type="button" onclick="alert('Contact support for modifications')">Modify</button></article>`).join("") : "<p>No orders yet</p>";
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-open-cart]").forEach(button => button.addEventListener("click", openCart));
  document.querySelectorAll("[data-close-cart]").forEach(button => button.addEventListener("click", closeCart));
  document.addEventListener("click", event => { const quantityButton = event.target.closest("[data-quantity]"); if (quantityButton) changeCartQuantity(quantityButton.dataset.quantity, Number(quantityButton.dataset.amount)); });
  document.querySelector("[data-checkout]")?.addEventListener("click", submitCheckout);
  document.querySelectorAll("[data-logout]").forEach(button => button.addEventListener("click", () => { localStorage.removeItem(USER_KEY); window.location.href = "index.html"; }));
  renderCart(); initStorePage(); initAuthPages(); initProfilePage(); initOrdersPage();
});
