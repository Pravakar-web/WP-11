document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const alertContainer = document.getElementById('alertContainer');
  const submitBtn = document.getElementById('submitBtn');

  // Toggle password visibility
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      togglePasswordBtn.innerHTML = isPassword
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    });
  }

  // Demo credential autofill helpers
  const demoChips = document.querySelectorAll('.demo-chip');
  demoChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const user = chip.getAttribute('data-user');
      const pass = chip.getAttribute('data-pass');
      if (user && pass) {
        usernameInput.value = user;
        passwordInput.value = pass;
        usernameInput.focus();
        hideAlert();
      }
    });
  });

  // Check URL query parameters for server-redirected messages
  const urlParams = new URLSearchParams(window.location.search);
  const errorMsg = urlParams.get('error');
  const successMsg = urlParams.get('success');

  if (errorMsg) {
    showAlert(decodeURIComponent(errorMsg), 'danger');
  } else if (successMsg) {
    showAlert(decodeURIComponent(successMsg), 'success');
  }

  // Handle Form Submission (Enhanced AJAX with Fallback)
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      // Basic client-side validation
      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      if (!username || !password) {
        e.preventDefault();
        showAlert('Please enter both username and password.', 'danger');
        return;
      }

      // If user submits with standard form behavior, let it submit naturally!
      // But we can also enhance it via AJAX for zero-flicker experience if desired:
      // Notice: In standard requirements, form POST sends name & password to server.
      // We allow standard form POST while showing a spinner during submission.
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="animate-spin" style="animation: spin 1s linear infinite; width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" stroke-width="4" stroke="currentColor" stroke-opacity="0.25"></circle>
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Validating against Database...
      `;
    });
  }

  function showAlert(message, type = 'danger') {
    if (!alertContainer) return;
    const icon = type === 'danger'
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;

    alertContainer.innerHTML = `
      <div class="alert alert-${type}">
        <span class="alert-icon">${icon}</span>
        <div>${escapeHtml(message)}</div>
      </div>
    `;
    alertContainer.style.display = 'block';
  }

  function hideAlert() {
    if (alertContainer) {
      alertContainer.innerHTML = '';
      alertContainer.style.display = 'none';
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
  }
});
