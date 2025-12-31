(function adminGate() {
  const key = prompt("Admin Access Key:");
  if (!key) {
    document.body.innerHTML = "<h2>Access Denied</h2>";
    throw new Error("No admin key");
  }

  // Must match backend ADMIN_KEY
  if (key !== "vitaseed_admin_123") {
    document.body.innerHTML = "<h2>Unauthorized</h2>";
    throw new Error("Invalid admin key");
  }
})();

const API_BASE = "https://vitaseed-backend.onrender.com";
const content = document.getElementById("adminContent");
const title = document.getElementById("sectionTitle");

// Persist admin key
let ADMIN_KEY = localStorage.getItem("ADMIN_KEY") || "";

/* ---------- UTIL ---------- */
function clearUI(text) {
  title.textContent = text;
  content.innerHTML = "<p>Loading...</p>";
}

function getAdminHeaders() {
  if (!ADMIN_KEY) {
    ADMIN_KEY = prompt("Enter Admin Key (case-sensitive):");

    if (!ADMIN_KEY) {
      throw new Error("Admin key required");
    }

    ADMIN_KEY = ADMIN_KEY.trim(); // 🔥 IMPORTANT
    localStorage.setItem("ADMIN_KEY", ADMIN_KEY);
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
      headers: getAdminHeaders()
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
          <p><small>${new Date(o.createdAt).toLocaleString()}</small></p>
        </div>
      `;
    });

  } catch (err) {
    localStorage.removeItem("ADMIN_KEY");
    ADMIN_KEY = "";
    content.innerHTML = "<p style='color:red'>Access denied</p>";
  }
}

/* ---------- CONTACTS (ADMIN) ---------- */
async function loadContacts() {
  try {
    clearUI("Contact Enquiries");

    const res = await fetch(`${API_BASE}/api/contacts`, {
      headers: getAdminHeaders()
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
          <small>${new Date(c.createdAt).toLocaleString()}</small>
        </div>
      `;
    });

  } catch (err) {
    localStorage.removeItem("ADMIN_KEY");
    ADMIN_KEY = "";
    content.innerHTML = "<p style='color:red'>Access denied</p>";
  }
}
