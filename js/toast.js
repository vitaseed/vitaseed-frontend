/* =========================
   Toast Notification System
   Replaces native alert() calls
    ========================= */

class Toast {
  constructor() {
    this.container = this.createContainer();
    this.toasts = [];
  }

  createContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  show(message, type = 'info', title = '', duration = 4000) {
    const toastEl = document.createElement('div');
    toastEl.className = `toast ${type}`;

    const iconMap = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };

    toastEl.innerHTML = `
      <div class="toast-icon">${iconMap[type] || '•'}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <p class="toast-message">${message}</p>
      </div>
      <button class="toast-close" aria-label="Close notification">×</button>
    `;

    const closeBtn = toastEl.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      this.remove(toastEl);
    });

    this.container.appendChild(toastEl);
    this.toasts.push(toastEl);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(toastEl);
      }, duration);
    }

    return toastEl;
  }

  success(message, title = 'Success', duration = 3000) {
    return this.show(message, 'success', title, duration);
  }

  error(message, title = 'Error', duration = 5000) {
    return this.show(message, 'error', title, duration);
  }

  info(message, title = 'Info', duration = 3000) {
    return this.show(message, 'info', title, duration);
  }

  warning(message, title = 'Warning', duration = 4000) {
    return this.show(message, 'warning', title, duration);
  }

  remove(toastEl) {
    toastEl.classList.add('removing');
    setTimeout(() => {
      toastEl.remove();
      this.toasts = this.toasts.filter(t => t !== toastEl);
    }, 300);
  }

  clear() {
    this.toasts.forEach(toastEl => {
      toastEl.classList.add('removing');
    });
    setTimeout(() => {
      this.toasts.forEach(toastEl => toastEl.remove());
      this.toasts = [];
    }, 300);
  }
}

// Create global toast instance
const toast = new Toast();

/* =========================
   Loading Overlay
    ========================= */

class LoadingOverlay {
  constructor() {
    this.overlay = this.createOverlay();
    this.isVisible = false;
  }

  createOverlay() {
    let overlay = document.querySelector('.loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div style="text-align: center;">
          <div class="spinner"></div>
          <p style="margin-top: 16px; color: var(--muted);">Loading...</p>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  show(message = 'Loading...') {
    const msgEl = this.overlay.querySelector('p');
    if (msgEl) msgEl.textContent = message;
    this.overlay.classList.add('active');
    this.isVisible = true;
  }

  hide() {
    this.overlay.classList.remove('active');
    this.isVisible = false;
  }

  toggle(show) {
    if (show) this.show();
    else this.hide();
  }
}

// Create global loading instance
const loading = new LoadingOverlay();

/* =========================
   API Error Handler
    ========================= */

function handleApiError(err, defaultMessage = 'Something went wrong') {
  console.error('API Error:', err);

  let message = defaultMessage;
  let title = 'Error';

  if (err.message) {
    message = err.message;
  } else if (typeof err === 'string') {
    message = err;
  }

  // Specific error handling
  if (message.includes('Invalid admin key')) {
    title = 'Authentication Failed';
  } else if (message.includes('404')) {
    title = 'Not Found';
  } else if (message.includes('500')) {
    title = 'Server Error';
  } else if (message.includes('CORS')) {
    title = 'Network Error';
    message = 'Unable to connect to the server. Please check your connection.';
  }

  toast.error(message, title);
}

/* =========================
   Form Validation Helper
    ========================= */

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm(formId, fields) {
  const form = document.getElementById(formId);
  if (!form) return false;

  let isValid = true;
  fields.forEach(field => {
    const el = form.querySelector(`[name="${field}"]`);
    if (!el || !el.value.trim()) {
      isValid = false;
      toast.warning(`${field} is required`, 'Validation Error', 3000);
    }
  });

  return isValid;
}

/* =========================
   Initialization
    ========================= */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize any page-specific functionality can hook into toast/loading systems
  console.log('🎯 Toast notification system initialized');
  console.log('📊 Loading overlay initialized');
  console.log('✓ Use toast.success(), toast.error(), toast.info(), toast.warning()');
  console.log('✓ Use loading.show(), loading.hide()');
});
