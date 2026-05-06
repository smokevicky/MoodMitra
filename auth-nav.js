/**
 * auth-nav.js — Shared user session component for MoodMitra
 *
 * Usage: add <div id="userNav"></div> anywhere in the nav,
 * then include <script src="auth-nav.js"></script>.
 *
 * Automatically shows:
 *   • Logged-in: circular avatar (initials) + Dropdown with Name, Email & Sign out
 *   • Logged-out: Sign In link → login.html
 */

(async function () {
  const container = document.getElementById('userNav');
  if (!container) return;

  try {
    const res  = await fetch('/me');
    const data = await res.json();

    if (data.user) {
      const name     = data.user.name || 'User';
      const parts    = name.trim().split(' ');
      const initials = parts.map(w => w[0]).join('').toUpperCase().slice(0, 2);

      container.innerHTML = `
        <div class="mm-user-chip" id="mmUserChipBtn" title="${name}">
          <div class="mm-avatar">${initials}</div>
          
          <div class="mm-dropdown" id="mmUserDropdown">
            <div class="mm-dropdown-header">
              <div class="mm-dropdown-title">${name}</div>
              <div class="mm-dropdown-email">${data.user.email || 'active session'}</div>
            </div>
            <div class="mm-dropdown-divider"></div>
            
            <a href="index.html" class="mm-dropdown-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mm-logout-icon" style="color: #c8b4ff;">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>Homepage</span>
            </a>

            <button class="mm-dropdown-item destructive" onclick="mmLogout(event)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mm-logout-icon">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      `;

      // Set up dropdown click toggle
      const chipBtn = document.getElementById('mmUserChipBtn');
      const dropdown = document.getElementById('mmUserDropdown');
      if (chipBtn && dropdown) {
        chipBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdown.classList.toggle('show');
        });
        document.addEventListener('click', () => {
          dropdown.classList.remove('show');
        });
      }
    } else {
      container.innerHTML = `
        <a href="login.html" class="mm-signin-link">Sign In</a>
      `;
    }
  } catch (e) {
    // Fallback if server is not reachable
    container.innerHTML = `
      <a href="login.html" class="mm-signin-link">Sign In</a>
    `;
  }
})();

window.mmLogout = async function (e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  try { await fetch('/logout', { method: 'POST' }); } catch (_) {}
  window.location.href = 'login.html';
};

/* ─── Scoped styles (injected once) ──────────────────────────────────────── */
(function injectStyles() {
  if (document.getElementById('mm-auth-styles')) return;
  const style = document.createElement('style');
  style.id = 'mm-auth-styles';
  style.textContent = `
    .mm-user-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.03);
    }
    .mm-user-chip:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }
    .mm-avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #c8b4ff, #ffd4a8);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700;
      color: #12121c;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(200, 180, 255, 0.25);
    }
    
    /* Dropdown container */
    .mm-dropdown {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 240px;
      background: rgba(18, 18, 28, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
      opacity: 0;
      transform: translateY(-8px) scale(0.96);
      pointer-events: none;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 9999;
      padding: 8px 0;
    }
    
    .mm-dropdown.show {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }
    
    /* Support light mode theme or pages with light backgrounds */
    html.light .mm-dropdown,
    body.light-theme .mm-dropdown,
    [data-theme="light"] .mm-dropdown {
      background: rgba(255, 255, 255, 0.96);
      border-color: rgba(0, 0, 0, 0.08);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
    }
    
    .mm-dropdown-header {
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-align: left;
    }
    .mm-dropdown-title {
      font-size: 0.92rem;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    html.light .mm-dropdown-title,
    body.light-theme .mm-dropdown-title,
    [data-theme="light"] .mm-dropdown-title {
      color: #12121c;
    }
    .mm-dropdown-email {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    html.light .mm-dropdown-email,
    body.light-theme .mm-dropdown-email,
    [data-theme="light"] .mm-dropdown-email {
      color: rgba(0, 0, 0, 0.5);
    }
    
    .mm-dropdown-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.08);
      margin: 8px 0;
    }
    html.light .mm-dropdown-divider,
    body.light-theme .mm-dropdown-divider,
    [data-theme="light"] .mm-dropdown-divider {
      background: rgba(0, 0, 0, 0.06);
    }
    
    .mm-dropdown-item {
      width: calc(100% - 16px);
      margin: 2px 8px;
      padding: 10px 12px;
      background: none;
      border: none;
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.85);
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 500;
      text-align: left;
      text-decoration: none;
      box-sizing: border-box;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    html.light .mm-dropdown-item,
    body.light-theme .mm-dropdown-item,
    [data-theme="light"] .mm-dropdown-item {
      color: #12121c;
    }
    .mm-dropdown-item:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #ffffff;
      padding-left: 16px;
    }
    html.light .mm-dropdown-item:hover,
    body.light-theme .mm-dropdown-item:hover,
    [data-theme="light"] .mm-dropdown-item:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #12121c;
    }
    .mm-dropdown-item.destructive {
      color: #ff7b7b;
      font-weight: 600;
    }
    .mm-dropdown-item.destructive:hover {
      background: rgba(255, 123, 123, 0.1);
      color: #ff7b7b;
    }
    .mm-logout-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    
    .mm-signin-link {
      font-size: 0.85rem;
      font-weight: 600;
      padding: 8px 18px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(200,180,255,0.25), rgba(255,212,168,0.15));
      border: 1px solid rgba(200,180,255,0.4);
      color: inherit;
      text-decoration: none;
      transition: all 0.25s ease;
      white-space: nowrap;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }
    .mm-signin-link:hover {
      background: linear-gradient(135deg, rgba(200,180,255,0.35), rgba(255,212,168,0.25));
      transform: translateY(-1.5px);
      box-shadow: 0 4px 12px rgba(200, 180, 255, 0.2);
    }
  `;
  document.head.appendChild(style);
})();
