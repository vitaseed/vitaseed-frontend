const API_BASE = "https://vitaseed-backend.onrender.com";
const content = document.getElementById("adminContent");
const title = document.getElementById("sectionTitle");

/* ---------- ADMIN HEADERS ---------- */
function getAdminHeaders() {
  let key = localStorage.getItem("ADMIN_KEY");

  if (!key) {
    key = prompt("Enter Admin Key:");
    if (!key) throw new Error("Admin key required");
    key = key.trim();
    localStorage.setItem("ADMIN_KEY", key);
  }

  return {
    "x-admin-key": key,
    "Content-Type": "application/json"
  };
}

/* ---------- UTIL ---------- */
function clearUI(text) {
  title.textContent = text;
  content.innerHTML = "<p>Loading...</p>";
}

/* ================= PRODUCTS ================= */
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
        <p>₹${p.price}</p>
        <p>Stock: ${p.stock ?? "-"}</p>
        <p>Status: ${p.isActive ? "Active" : "Inactive"}</p>
        <button onclick='openProductModal(${JSON.stringify(p)})'>Edit</button>
      </div>
    `;
  });
}

/* ================= ORDERS ================= */
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
          <p><strong>${o.productName}</strong></p>
          <p>Qty: ${o.quantity}</p>

          <select onchange="updateOrderStatus('${o.id}', this.value)">
            <option value="pending" ${o.status === "pending" ? "selected" : ""}>Pending</option>
            <option value="confirmed" ${o.status === "confirmed" ? "selected" : ""}>Confirmed</option>
            <option value="cancelled" ${o.status === "cancelled" ? "selected" : ""}>Cancelled</option>
          </select>

          <small>${o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}</small>
        </div>
      `;
    });

  } catch (err) {
    localStorage.removeItem("ADMIN_KEY");
    content.innerHTML = "<p style='color:red'>Access denied</p>";
  }
}

async function updateOrderStatus(orderId, status) {
  await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
    method: "PATCH",
    headers: getAdminHeaders(),
    body: JSON.stringify({ status })
  });
}

/* ================= CONTACTS ================= */
async function loadContacts() {
  try {
    clearUI("Contacts");

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
          <button onclick="deleteContact('${c.id}')">Delete</button>
        </div>
      `;
    });

  } catch (err) {
    localStorage.removeItem("ADMIN_KEY");
    content.innerHTML = "<p style='color:red'>Access denied</p>";
  }
}

async function deleteContact(id) {
  await fetch(`${API_BASE}/api/contacts/${id}`, {
    method: "DELETE",
    headers: getAdminHeaders()
  });
  loadContacts();
}

/* ================= PRODUCT MODAL ================= */
function openProductModal(p) {
  document.getElementById("productModal").classList.remove("hidden");
  document.getElementById("pId").value = p.id;
  document.getElementById("pName").value = p.name;
  document.getElementById("pPrice").value = p.price;
  document.getElementById("pStock").value = p.stock ?? 0;
  document.getElementById("pActive").checked = !!p.isActive;
}

function closeProductModal() {
  document.getElementById("productModal").classList.add("hidden");
}

async function saveProduct() {
  const id = document.getElementById("pId").value;

  const body = {
    name: document.getElementById("pName").value,
    price: Number(document.getElementById("pPrice").value),
    stock: Number(document.getElementById("pStock").value),
    isActive: document.getElementById("pActive").checked
  };

  await fetch(`${API_BASE}/api/products/${id}`, {
    method: "PUT",
    headers: getAdminHeaders(),
    body: JSON.stringify(body)
  });

  closeProductModal();
  loadProducts();
}
