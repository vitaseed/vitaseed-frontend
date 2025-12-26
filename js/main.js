document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();
    const status = document.getElementById("status");

    status.innerText = "Sending...";

    try {
      const res = await fetch(
        "https://vitaseed-backend.onrender.com/api/contact",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, message })
        }
      );

      const data = await res.json();

      if (data.success) {
        status.innerText = "Message sent successfully ✅";
        form.reset();
      } else {
        status.innerText = "Failed to send message ❌";
      }
    } catch (err) {
      status.innerText = "Server error ❌";
    }
  });
});
