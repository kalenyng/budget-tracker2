// Custom dialog utilities to replace native alert/confirm/prompt

// ── Toast ────────────────────────────────────────────────────────────────────

export function showToast(message: string, type: 'success' | 'error' = 'success') {
  // Remove any existing toast
  const existing = document.getElementById('app-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'app-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--surface);
    border: 1px solid ${type === 'error' ? 'var(--red)' : 'var(--accent)'};
    border-left-width: 3px;
    color: var(--text);
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    padding: 12px 16px;
    border-radius: 4px;
    max-width: 320px;
    z-index: 9999;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    transform: translateX(120%);
    transition: transform 0.2s ease;
  `;

  document.body.appendChild(toast);
  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
    });
  });

  // Auto dismiss
  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────

export function showConfirm(
  title: string,
  message: string,
  confirmLabel = 'Confirm',
  danger = false
): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center;
      z-index: 9998;
    `;

    overlay.innerHTML = `
      <div style="
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 28px;
        max-width: 400px;
        width: 90%;
        font-family: 'DM Mono', monospace;
      ">
        <div style="font-size: 14px; font-weight: 500; color: var(--text); margin-bottom: 12px;">${title}</div>
        <div style="font-size: 12px; color: var(--text-dim); margin-bottom: 24px; line-height: 1.6;">${message}</div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button id="dialog-cancel" style="
            background: var(--surface2); border: 1px solid var(--border);
            color: var(--text-dim); font-family: 'DM Mono', monospace;
            font-size: 11px; padding: 8px 16px; cursor: pointer; border-radius: 4px;
          ">Cancel</button>
          <button id="dialog-confirm" style="
            background: ${danger ? 'var(--red)' : 'var(--accent)'};
            border: 1px solid ${danger ? 'var(--red)' : 'var(--accent)'};
            color: ${danger ? 'white' : '#0d0f0e'};
            font-family: 'DM Mono', monospace;
            font-size: 11px; padding: 8px 16px; cursor: pointer; border-radius: 4px; font-weight: 500;
          ">${confirmLabel}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#dialog-confirm')!.addEventListener('click', () => {
      overlay.remove();
      resolve(true);
    });
    overlay.querySelector('#dialog-cancel')!.addEventListener('click', () => {
      overlay.remove();
      resolve(false);
    });
    // Click outside to cancel
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { overlay.remove(); resolve(false); }
    });
  });
}

// ── Prompt Modal ──────────────────────────────────────────────────────────────

export function showPrompt(
  title: string,
  placeholder = '',
  confirmLabel = 'Add'
): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center;
      z-index: 9998;
    `;

    overlay.innerHTML = `
      <div style="
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 28px;
        max-width: 400px;
        width: 90%;
        font-family: 'DM Mono', monospace;
      ">
        <div style="font-size: 14px; font-weight: 500; color: var(--text); margin-bottom: 16px;">${title}</div>
        <input id="dialog-input" type="text" placeholder="${placeholder}" style="
          width: 100%; background: var(--surface2); border: 1px solid var(--border);
          color: var(--text); font-family: 'DM Mono', monospace; font-size: 12px;
          padding: 10px 12px; border-radius: 4px; outline: none; margin-bottom: 20px;
          box-sizing: border-box;
        ">
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button id="dialog-cancel" style="
            background: var(--surface2); border: 1px solid var(--border);
            color: var(--text-dim); font-family: 'DM Mono', monospace;
            font-size: 11px; padding: 8px 16px; cursor: pointer; border-radius: 4px;
          ">Cancel</button>
          <button id="dialog-confirm" style="
            background: var(--accent); border: 1px solid var(--accent);
            color: #0d0f0e; font-family: 'DM Mono', monospace;
            font-size: 11px; padding: 8px 16px; cursor: pointer; border-radius: 4px; font-weight: 500;
          ">${confirmLabel}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const input = overlay.querySelector('#dialog-input') as HTMLInputElement;
    input.focus();

    const confirm = () => {
      const val = input.value.trim();
      overlay.remove();
      resolve(val === '' ? null : val);
    };

    overlay.querySelector('#dialog-confirm')!.addEventListener('click', confirm);
    overlay.querySelector('#dialog-cancel')!.addEventListener('click', () => {
      overlay.remove();
      resolve(null);
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { overlay.remove(); resolve(null); }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirm();
      if (e.key === 'Escape') { overlay.remove(); resolve(null); }
    });
  });
}
