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

  // --- DEBUG LOGGING: show exactly what's being sent ---
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
    let successMessage = "Thanks! We’ve received your enquiry.";
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

    setStatus("Thanks! We’ve received your enquiry. Our team will respond soon.");
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
