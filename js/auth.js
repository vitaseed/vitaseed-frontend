const API_BASE = 'https://vitaseed-backend.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value.trim();
      
      if (!email || !password) {
        toast.warning('Please fill all fields', 'Validation Error', 3000);
        return;
      }

      loading.show('Logging in...');
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Login failed');
        }

        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('gami_user', JSON.stringify(data.user));
        
        loading.hide();
        toast.success('Welcome back!', 'Logged In', 2000);
        setTimeout(() => {
          const returnPage = new URLSearchParams(window.location.search).get('return') || 'shop.html';
          window.location.href = returnPage;
        }, 1000);
      } catch (err) {
        loading.hide();
        toast.error(err.message || 'Login failed', 'Error', 4000);
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('registerName').value.trim();
      const email = document.getElementById('registerEmail').value.trim();
      const password = document.getElementById('registerPassword').value.trim();
      
      if (!name || !email || !password) {
        toast.warning('Please fill all fields', 'Validation Error', 3000);
        return;
      }

      if (password.length < 6) {
        toast.warning('Password must be at least 6 characters', 'Validation Error', 3000);
        return;
      }

      loading.show('Creating account...');
      try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Registration failed');
        }

        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('gami_user', JSON.stringify(data.user));
        
        loading.hide();
        toast.success('Account created! Welcome to The Gami Co.', 'Welcome!', 2000);
        setTimeout(() => window.location.href = 'shop.html', 1000);
      } catch (err) {
        loading.hide();
        toast.error(err.message || 'Registration failed', 'Error', 4000);
      }
    });
  }
});