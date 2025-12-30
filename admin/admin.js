const API_BASE = "https://vitaseed-backend.onrender.com";
const content = document.getElementById("adminContent");
const title = document.getElementById("sectionTitle");

let ADMIN_KEY = "";

/* ---------- UTIL ---------- */
function clearUI(text) {
  title.textContent = text;
  content.innerHTML = "<p>Loading...</p>";
}

function requireAdminKey() {
  if (!ADMIN_KEY) {
    ADMIN_KEY = prompt("Enter Admin Key");
  }

  if (!ADMIN_KEY) {
    alert("Admin key is required");
    throw new Error("Admin key missing");
  }

  return {
    "x-admin-key": ADMIN_KEY
  };
}

/* ---------- PRODUCTS (PUBLIC) ---------- */
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

/* ---------- ORDERS (ADMIN) ---------- */
async function loadOrders() {
  try {
    clearUI("Orders");

    const res = await fetch(`${API_BASE}/api/orders`, {
      headers: requireAdminKey()
    });

    if (!res.ok) throw new Error("Unauthorized");

    const data = await res.json();
    content.innerHTML = "";

    if (!data.length) {
      content.innerHTML = "<p>No orders yet.</p>";
      return;
    }

    data.forEach(o => {
      content.innerHTML += `
        <div class="card">
          <p><strong>Product:</strong> ${o.productName}</p>
          <p><strong>Qty:</strong> ${o.quantity}</p>
          <p><small>${o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}</small></p>
        </div>
      `;
    });

  } catch (err) {
    content.innerHTML = "<p style='color:red'>Unauthorized or server error</p>";
    ADMIN_KEY = ""; // reset on failure
  }
}

/* ---------- CONTACTS (ADMIN) ---------- */
async function loadContacts() {
  try {
    clearUI("Contact Enquiries");

    const res = await fetch(`${API_BASE}/api/contacts`, {
      headers: requireAdminKey()
    });

    if (!res.ok) throw new Error("Unauthorized");

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
          <small>${c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"}</small>
        </div>
      `;
    });

  } catch (err) {
    content.innerHTML = "<p style='color:red'>Unauthorized or server error</p>";
    ADMIN_KEY = ""; // reset on failure
  }
}
