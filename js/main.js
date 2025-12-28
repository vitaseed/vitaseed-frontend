const API_BASE = "https://vitaseed-backend.onrender.com";

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

    const data = await res.json();
    alert(data.message || "Order placed successfully");
  } catch (err) {
    alert("Order failed");
  }
}

/* ---------- CONTACT FORM ---------- */
async function submitContactForm(e) {
  e.preventDefault();

  const payload = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    message: document.getElementById("message").value
  };

  try {
    const res = await fetch(`${API_BASE}/api/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    alert(data.message || "Message sent");
    e.target.reset();
  } catch (err) {
    alert("Failed to send message");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", submitContactForm);
  }
});
