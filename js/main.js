const API_BASE = "https://vitaseed-backend.onrender.com";

/* ---------- UTIL ---------- */
function setStatus(text, isError = false) {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? "crimson" : "";
}

function isValidEmail(email) {
  // Simple email regex (reasonable for client-side quick validation)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ---------- LOAD PRODUCTS (unchanged behavior) ---------- */
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

/* ---------- PLACE ORDER (robust response handling) ---------- */
async function orderNow(productId) {
  const order = {
    productId,
    quantity: 1
  };

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
      // nothing to parse
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

  // Basic client-side validation to prevent obvious 400s
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

  try {
    const res = await fetch(`${API_BASE}/api/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    // If server rejects request with 4xx/5xx it often includes a helpful message in the body
    if (!res.ok) {
      // attempt to read JSON or text for server-provided message
      const ct = res.headers.get("content-type") || "";
      let serverMsg = `Server responded ${res.status} ${res.statusText}`;
      if (ct.includes("application/json")) {
        const errJson = await res.json().catch(() => null);
        if (errJson && errJson.error) serverMsg = errJson.error;
        else if (errJson && errJson.message) serverMsg = errJson.message;
      } else {
        const txt = await res.text().catch(() => "");
        if (txt) serverMsg = txt;
      }
      throw new Error(serverMsg);
    }

    // Successful response: handle JSON, text, or 204
    const ct = res.headers.get("content-type") || "";
    let successMessage = "Message sent";
    if (res.status === 204 || !ct) {
      // 204 No Content — leave default message
    } else if (ct.includes("application/json")) {
      const data = await res.json().catch(() => null);
      if (data && data.message) successMessage = data.message;
    } else {
      const text = await res.text().catch(() => "");
      if (text) successMessage = text;
    }

    setStatus(successMessage);
    e.target.reset();
  } catch (err) {
    // Surface a friendly message but keep full details in console
    console.error("Contact submit failed:", err);
    setStatus(err.message || "Failed to send message. See console for details.", true);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // contact form hookup
  const form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", submitContactForm);
  }

  // load products if product list exists on page
  const productList = document.getElementById("product-list");
  if (productList) {
    loadProducts();
  }
});
