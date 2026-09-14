const API_BASE = "https://vitaseed-backend.onrender.com";
const content = document.getElementById("adminContent");
const title = document.getElementById("sectionTitle");
let adminKey = sessionStorage.getItem("ADMIN_KEY") || "";

/* ---------- ADMIN HEADERS ---------- */
function getAdminHeaders() {
  if (!adminKey) {
    const enteredKey = prompt("🔐 Enter the backend Admin Key:\n\n(Ask your team lead if you don't have this)");
    if (!enteredKey) throw new Error("Admin key required to access this feature");
    adminKey = enteredKey.trim();
    sessionStorage.setItem("ADMIN_KEY", adminKey);
    console.log("✓ Admin key saved to session");
  }

  return {
    "x-admin-key": adminKey,
    "Content-Type": "application/json"
  };
}

/* ---------- UTIL ---------- */
function clearUI(text) {
  title.textContent = text;
  content.innerHTML = "<div class='loader'></div>";
}

async function getApiError(res) {
  const body = await res.json().catch(() => ({}));
  const error = body.error || body.message || `Request failed (${res.status})`;
  
  // Provide specific guidance for common errors
  if (res.status === 401) {
    return `${error}\n\n⚠️ Admin key is missing. Please enter a valid key.`;
  }
  if (res.status === 403) {
    return `${error}\n\n⚠️ Admin key is invalid or expired.\n\nSteps:\n1. Contact your team lead\n2. Click "Log out" and try again\n3. Enter the correct admin key`;
  }
  return error;
}

/* ================= PRODUCTS ================= */
async function loadProducts() {
  try {
    clearUI("Products");

    // Products are public; no admin key needed
    const res = await fetch(`${API_BASE}/api/products`);
    if (!res.ok) throw new Error(await getApiError(res));
    const data = await res.json();

    content.innerHTML = "";
    if (!data.length) {
      content.innerHTML = "<p>No products found.</p>";
      return;
    }

    data.forEach(p => {
      content.innerHTML += `
        <div class="card">
          ${p.image ? `<img src="${p.image}" alt="${p.name}" />` : ""}
          <h3>${p.name}</h3>
          <p>₹${p.price}</p>
          <p>Stock: ${p.stock ?? "-"}</p>
          <p>Status: ${p.isActive ? "Active" : "Inactive"}</p>
          <button onclick='openProductModal(${JSON.stringify(p)})'>Edit</button>
        </div>
      `;
    });
  } catch (err) {
    content.innerHTML = `<p class="admin-error">${err.message}</p>`;
    console.error("Load Products Error:", err);
  }
}

/* ================= ORDERS ================= */
async function loadOrders() {
  try {
    clearUI("Orders");

    const res = await fetch(`${API_BASE}/api/orders`, {
      headers: getAdminHeaders()
    });

    if (!res.ok) {
      const errMsg = await getApiError(res);
      throw new Error(errMsg);
    }

    const data = await res.json();
    content.innerHTML = "";

    if (!data.length) {
      content.innerHTML = "<p>No orders yet.</p>";
      return;
    }

    data.forEach(o => {
      content.innerHTML += `
        <div class="card">
          <p><strong>${o.productName || "Product"}</strong></p>
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
    content.innerHTML = `<p class="admin-error">
      <strong>⚠️ Error loading orders:</strong><br/>
      ${err.message.replace(/\n/g, "<br/>")}
    </p>`;
    console.error("Load Orders Error:", err);
  }
}

async function updateOrderStatus(orderId, status) {
  if (!confirm("Save changes?")) return;

  try {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: getAdminHeaders(),
      body: JSON.stringify({ status })
    });

    if (!res.ok) throw new Error(await getApiError(res));
    loadOrders();
  } catch (err) {
    alert(`❌ Failed to update order: ${err.message}`);
  }
}

/* ================= CONTACTS ================= */
async function loadContacts() {
  try {
    clearUI("Contacts");

    const res = await fetch(`${API_BASE}/api/contacts`, {
      headers: getAdminHeaders()
    });

    if (!res.ok) {
      const errMsg = await getApiError(res);
      throw new Error(errMsg);
    }

    const data = await res.json();
    content.innerHTML = "";

    if (!data.length) {
      content.innerHTML = "<p>No enquiries yet.</p>";
      return;
    }

    data.forEach(c => {
      content.innerHTML += `
        <div class="card">
          <h4>${c.name}</h4>
          <p><strong>${c.email}</strong></p>
          <p>${c.message}</p>
          <button onclick="deleteContact('${c.id}')">Delete</button>
        </div>
      `;
    });

  } catch (err) {
    content.innerHTML = `<p class="admin-error">
      <strong>⚠️ Error loading enquiries:</strong><br/>
      ${err.message.replace(/\n/g, "<br/>")}
    </p>`;
    console.error("Load Contacts Error:", err);
  }
}

async function deleteContact(id) {
  if (!confirm("Delete this enquiry?")) return;
  
  try {
    const res = await fetch(`${API_BASE}/api/contacts/${id}`, {
      method: "DELETE",
      headers: getAdminHeaders()
    });

    if (!res.ok) throw new Error(await getApiError(res));
    loadContacts();
  } catch (err) {
    alert(`❌ Failed to delete: ${err.message}`);
  }
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

  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: "PUT",
      headers: getAdminHeaders(),
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(await getApiError(res));
    
    closeProductModal();
    loadProducts();
    alert("✓ Product updated");
  } catch (err) {
    alert(`❌ Failed to save: ${err.message}`);
  }
}

loadProducts();

function logout() {
  adminKey = "";
  sessionStorage.removeItem("ADMIN_KEY");
  console.log("✓ Admin key cleared");
  location.reload();
}

window.addEventListener("click", function(e) {
  const modal = document.getElementById("productModal");
  if (e.target === modal) {
    closeProductModal();
  }
});

function openAddProductModal() {
  document.getElementById("addProductModal").classList.remove("hidden");
}

function closeAddProductModal() {
  document.getElementById("addProductModal").classList.add("hidden");
}

async function addProduct() {
  const name = document.getElementById("newName").value;
  const price = Number(document.getElementById("newPrice").value);
  const stock = Number(document.getElementById("newStock").value);
  const file = document.getElementById("newImage").files[0];

  if (!name || !price || !file) {
    alert("❌ Fill all required fields");
    return;
  }

  try {
    // Upload image
    const formData = new FormData();
    formData.append("image", file);

    const uploadRes = await fetch(`${API_BASE}/api/products/upload`, {
      method: "POST",
      headers: {
        "x-admin-key": getAdminHeaders()["x-admin-key"]
      },
      body: formData
    });

    if (!uploadRes.ok) throw new Error(await getApiError(uploadRes));

    const uploadData = await uploadRes.json();

    // Save product
    const res = await fetch(`${API_BASE}/api/products`, {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({
        name,
        price,
        stock,
        image: uploadData.url
      })
    });

    if (!res.ok) throw new Error(await getApiError(res));

    closeAddProductModal();
    loadProducts();
    alert("✓ Product added successfully");
  } catch (err) {
    alert(`❌ Failed to add product: ${err.message}`);
  }
}
