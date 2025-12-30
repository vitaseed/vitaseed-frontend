const API_BASE = "https://vitaseed-backend.onrender.com";
const content = document.getElementById("adminContent");
const title = document.getElementById("sectionTitle");

/* ---------- UTIL ---------- */
function clearUI(text) {
  title.textContent = text;
  content.innerHTML = "<p>Loading...</p>";
}

/* ---------- PRODUCTS ---------- */
async function loadProducts() {
  clearUI("Products");

  const res = await fetch(`${API_BASE}/api/products`);
  const data = await res.json();

  content.innerHTML = "";

  if (!data.length) {
    content.innerHTML = "<p>No products found.</p>";
    return;
  }

  data.forEach(p => {
    content.innerHTML += `
      <div class="card">
        <h3>${p.name}</h3>
        <p>Price: ₹${p.price}</p>
      </div>
    `;
  });
}

/* ---------- ORDERS ---------- */
async function loadOrders() {
  clearUI("Orders");

  const res = await fetch(`${API_BASE}/api/orders`);
  const data = await res.json();

  content.innerHTML = "";

  if (!data.length) {
    content.innerHTML = "<p>No orders yet.</p>";
    return;
  }

  data.forEach(o => {
    content.innerHTML += `
      <div class="card">
        <p><strong>Product:</strong> ${o.productId}</p>
        <p><strong>Qty:</strong> ${o.quantity}</p>
        <p><small>${new Date(o.createdAt).toLocaleString()}</small></p>
      </div>
    `;
  });
}

/* ---------- CONTACTS ---------- */
async function loadContacts() {
  clearUI("Contact Enquiries");

  const res = await fetch(`${API_BASE}/api/contacts`);
  const data = await res.json();

  content.innerHTML = "";

  if (!data.length) {
    content.innerHTML = "<p>No enquiries.</p>";
    return;
  }

  data.forEach(c => {
    content.innerHTML += `
      <div class="card">
        <h4>${c.name}</h4>
        <p>${c.email}</p>
        <p>${c.message}</p>
        <small>${new Date(c.createdAt).toLocaleString()}</small>
      </div>
    `;
  });
}
