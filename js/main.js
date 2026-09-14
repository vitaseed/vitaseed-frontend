const API_BASE = "https://vitaseed-backend.onrender.com";

/* ---------- CONTACT FORM ---------- */
async function submitContactForm(e) {
  e.preventDefault();

  const submitBtn = document.getElementById("contactSubmit");
  if (submitBtn) submitBtn.disabled = true;

  const name = (document.getElementById("contact-name") || document.getElementById("name") || {}).value || "";
  const email = (document.getElementById("contact-email") || document.getElementById("email") || {}).value || "";
  const message = (document.getElementById("contact-message") || document.getElementById("message") || {}).value || "";

  if (!name.trim() || !email.trim() || !message.trim()) {
    toast.warning("Please fill in all fields", "Validation Error", 3000);
    if (submitBtn) submitBtn.disabled = false;
    return;
  }

  if (!validateEmail(email.trim())) {
    toast.warning("Please enter a valid email address", "Invalid Email", 3000);
    if (submitBtn) submitBtn.disabled = false;
    return;
  }

  const payload = { name: name.trim(), email: email.trim(), message: message.trim() };

  console.log("Contact form: sending payload to", `${API_BASE}/api/contacts`);
  console.log("Payload:", payload);

  loading.show("Sending your message...");

  try {
    const res = await fetch(`${API_BASE}/api/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const ct = res.headers.get("content-type") || "";
      let serverMsg = `Server returned ${res.status} ${res.statusText}`;
      if (ct.includes("application/json")) {
        const errJson = await res.json().catch(() => null);
        console.error("Server responded with JSON error body:", errJson);
        if (errJson) serverMsg = errJson.error || errJson.message || JSON.stringify(errJson);
      } else {
        const txt = await res.text().catch(() => "");
        console.error("Server responded with text error body:", txt);
        if (txt) serverMsg = txt;
      }
      throw new Error(serverMsg);
    }

    loading.hide();
    toast.success("Thank you! We've received your enquiry and will respond soon.", "Message Sent", 4000);
    e.target.reset();
  } catch (err) {
    console.error("Contact submit failed (caught):", err);
    loading.hide();
    toast.error(err.message || "Failed to send message. Please try again.", "Send Failed", 4000);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

/* ---------- LOAD PRODUCTS ---------- */
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    if (!res.ok) throw new Error("Failed to load products");
    
    const products = await res.json();
    const container = document.getElementById("product-list");
    if (!container) return;

    container.innerHTML = "";

    if (!products || products.length === 0) {
      container.innerHTML = "<p class='loading'>No products available at the moment. Check back soon!</p>";
      return;
    }

    products.forEach(p => {
      const productHtml = `
        <div class="store-card">
          <div class="store-image">
            ${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" />` : '<span style="font-size: 3rem; color: var(--paper-deep);">🌱</span>'}
          </div>
          <div class="store-card-body">
            <h3>${escapeHtml(p.name)}</h3>
            <p class="price">₹${p.price}</p>
            <div class="store-card-row">
              <strong>Add to cart</strong>
              <button type="button" class="btn btn-small" data-add-product="${p.id}">+</button>
            </div>
          </div>
        </div>
      `;
      container.innerHTML += productHtml;
    });

    container.querySelectorAll("[data-add-product]").forEach(button => {
      button.addEventListener("click", () => {
        const product = products.find(item => String(item.id) === button.dataset.addProduct);
        if (product) addToCart(product);
      });
    });
  } catch (err) {
    console.error("Failed to load products", err);
    const container = document.getElementById("product-list");
    if (container) {
      container.innerHTML = '<p class="loading">Unable to load products. Please try again later.</p>';
    }
  }
}

/* ---------- PLACE ORDER ---------- */
async function orderNow(productId) {
  const order = { productId, quantity: 1 };

  loading.show("Processing order...");

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

    loading.hide();
    toast.success("Order placed successfully! We'll process it shortly.", "Order Confirmed", 3000);
  } catch (err) {
    console.error("Order failed:", err);
    loading.hide();
    toast.error(err.message || "Order failed. Please try again.", "Order Error", 4000);
  }
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (form) form.addEventListener("submit", submitContactForm);

  const productList = document.getElementById("product-list");
  if (productList) loadProducts();

  // Initialize storefront
  renderCart();
  initStorePage();
  initAuthPages();
  initProfilePage();
  initOrdersPage();

  // Setup cart and navigation
  document.querySelectorAll("[data-open-cart]").forEach(button => button.addEventListener("click", openCart));
  document.querySelectorAll("[data-close-cart]").forEach(button => button.addEventListener("click", closeCart));
  document.addEventListener("click", event => {
    const quantityButton = event.target.closest("[data-quantity]");
    if (quantityButton) changeCartQuantity(quantityButton.dataset.quantity, Number(quantityButton.dataset.amount));
  });
  document.querySelector("[data-checkout]")?.addEventListener("click", submitCheckout);
  document.querySelectorAll("[data-logout]").forEach(button => button.addEventListener("click", () => {
    localStorage.removeItem(USER_KEY);
    toast.info("You've been logged out", "Goodbye!", 2000);
    setTimeout(() => { window.location.href = "index.html"; }, 1000);
  }));
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
  toast.success(`Added "${product.name}" to your bag`, "Added to Cart", 2000);
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
  list.innerHTML = cart.length ? cart.map(item => `<div class="cart-item"><div><strong>${escapeHtml(item.name)}</strong><span>₹${item.price} each</span><div class="qty"><button type="button" data-quantity="${item.id}" data-amount="-1">−</button><span>${item.quantity}</span><button type="button" data-quantity="${item.id}" data-amount="1">+</button></div></div><button type="button" class="btn-ghost" onclick="changeCartQuantity('${item.id}', -${item.quantity})">Remove</button></div>`).join("") : "<p style='text-align: center; color: var(--muted);'>Your bag is empty</p>";
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
  container.innerHTML = products.length ? products.map(product => `<div class="store-card"><div class="store-image">${product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />` : '<span style="font-size: 3rem; color: var(--paper-deep);">🌱</span>'}</div><div class="store-card-body"><h3>${escapeHtml(product.name)}</h3><p class="price">₹${product.price}</p><div class="store-card-row"><strong style="flex: 1;"></strong><button type="button" class="btn btn-small" data-add-product="${product.id}">Add +</button></div></div></div>`).join("") : "<p style='text-align: center; color: var(--muted); grid-column: 1/-1;'>No products match your search</p>";
  container.querySelectorAll("[data-add-product]").forEach(button => button.addEventListener("click", () => { const product = products.find(item => String(item.id) === button.dataset.addProduct); if (product) addToCart(product); }));
}

async function initStorePage() {
  const container = document.getElementById("shop-product-list");
  if (!container) return;
  let products = [];
  try { products = await fetchProductsForStore(); } catch (error) { container.innerHTML = `<p style='color: var(--error); grid-column: 1/-1;'>${error.message}</p>`; return; }
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
  if (!cart.length) {
    toast.warning("Your bag is empty. Add some seeds first!", "Empty Cart", 2000);
    return;
  }
  const user = readStorage(USER_KEY, null);
  if (!user) { 
    toast.info("Please log in to continue checkout", "Login Required", 2000);
    setTimeout(() => { window.location.href = "login.html?return=shop.html"; }, 1000);
    return; 
  }
  const button = document.querySelector("[data-checkout]");
  if (button) button.disabled = true;
  
  loading.show("Processing your order...");
  
  try {
    for (const item of cart) {
      const response = await fetch(`${API_BASE}/api/orders`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ productId: item.id, quantity: item.quantity, userId: user.id }) 
      });
      if (!response.ok) throw new Error("Your order could not be sent.");
    }
    const orders = readStorage(USER_ORDERS_KEY, []);
    orders.unshift({ id: `local-${Date.now()}`, createdAt: new Date().toISOString(), status: "pending", items: cart, total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0) });
    writeStorage(USER_ORDERS_KEY, orders);
    saveCart([]);
    loading.hide();
    toast.success("Order confirmed! Check your profile for details.", "Order Placed", 4000);
    setTimeout(() => { window.location.href = "orders.html"; }, 2000);
  } catch (error) { 
    loading.hide();
    toast.error(error.message || "Checkout failed. Please try again.", "Checkout Error", 4000);
  } finally { 
    if (button) button.disabled = false; 
  }
}

function initAuthPages() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  if (registerForm) registerForm.addEventListener("submit", event => { 
    event.preventDefault(); 
    const name = document.getElementById("registerName")?.value.trim();
    const email = document.getElementById("registerEmail")?.value.trim();
    if (!name || !email || !validateEmail(email)) {
      toast.warning("Please fill in all fields with a valid email", "Validation Error", 2000);
      return;
    }
    writeStorage(USER_KEY, { name, email, id: `user-${Date.now()}` }); 
    toast.success("Account created! Welcome to The Gami Co.", "Welcome!", 2000);
    setTimeout(() => { window.location.href = "shop.html"; }, 1000);
  });
  if (loginForm) loginForm.addEventListener("submit", event => { 
    event.preventDefault(); 
    const user = readStorage(USER_KEY, null); 
    const email = document.getElementById("loginEmail")?.value.trim();
    if (!user || user.email !== email) { 
      toast.error("User not found or email incorrect. Please register first.", "Login Failed", 3000);
      return; 
    }
    const returnPage = new URLSearchParams(window.location.search).get("return") || "shop.html"; 
    toast.success("Welcome back!", "Logged In", 1500);
    setTimeout(() => { window.location.href = returnPage; }, 1000);
  });
}

function initProfilePage() {
  const form = document.getElementById("profileForm");
  if (!form) return;
  const user = readStorage(USER_KEY, null);
  if (!user) { 
    setTimeout(() => { window.location.href = "login.html?return=profile.html"; }, 500);
    return; 
  }
  document.getElementById("profileTitle").textContent = `Hello, ${user.name.split(" ")[0]}`;
  document.getElementById("profileName").value = user.name;
  document.getElementById("profileEmail").value = user.email;
  document.getElementById("profileNote").value = user.note || "";
  form.addEventListener("submit", event => { 
    event.preventDefault(); 
    writeStorage(USER_KEY, { ...user, name: document.getElementById("profileName").value.trim(), note: document.getElementById("profileNote").value.trim() }); 
    toast.success("Your profile has been updated", "Profile Saved", 2000);
  });
}

function initOrdersPage() {
  const list = document.getElementById("ordersList");
  if (!list) return;
  if (!readStorage(USER_KEY, null)) { 
    setTimeout(() => { window.location.href = "login.html?return=orders.html"; }, 500);
    return; 
  }
  const orders = readStorage(USER_ORDERS_KEY, []);
  list.innerHTML = orders.length ? orders.map(order => `<article class="order-card"><div><h2 style="font-size: 1.1rem; margin: 0 0 8px;">Order ${escapeHtml(order.id.slice(0, 8))}</h2><p style="margin: 0 0 6px;"><span class="status">${order.status}</span></p><small style="color: var(--muted);">${new Date(order.createdAt).toLocaleDateString()}</small></div><div class="order-meta"><strong>₹${order.total}</strong></div></article>`).join("") : "<p style='text-align: center; color: var(--muted); padding: 40px 20px;'>No orders yet. <a href='shop.html' style='color: var(--forest); font-weight: 700;'>Start shopping</a></p>";
}
