(function () {
  const currentScript = document.currentScript;

  function readCompanyId() {
    if (!currentScript) return '';
    return currentScript.getAttribute('data-company-id') || '';
  }

  function readBaseUrl() {
    if (!currentScript) return window.location.origin;

    try {
      return new URL(currentScript.src, window.location.href).origin;
    } catch (_err) {
      return window.location.origin;
    }
  }

  function getStateKey(companyId) {
    return `supportbee:launcher:${companyId}:open`;
  }

  function createStyles() {
    const style = document.createElement('style');
    style.setAttribute('data-supportbee-widget', 'styles');
    style.textContent = `
      .sb-widget-root { position: fixed; right: 20px; bottom: 20px; z-index: 2147483000; font-family: 'DM Sans', system-ui, sans-serif; }
      .sb-widget-launcher { width: 58px; height: 58px; border-radius: 999px; border: 1px solid rgba(245, 197, 24, 0.35); background: linear-gradient(180deg, #f5c518 0%, #e8b90e 100%); color: #111; display: flex; align-items: center; justify-content: center; box-shadow: 0 12px 30px rgba(245, 197, 24, 0.22), 0 12px 30px rgba(0, 0, 0, 0.35); cursor: pointer; transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease; }
      .sb-widget-launcher:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 14px 34px rgba(245, 197, 24, 0.28), 0 16px 34px rgba(0, 0, 0, 0.38); }
      .sb-widget-launcher svg { width: 24px; height: 24px; display: block; }
      .sb-widget-panel { position: fixed; right: 20px; bottom: 86px; width: min(400px, calc(100vw - 24px)); height: min(700px, calc(100vh - 110px)); border-radius: 18px; overflow: hidden; background: #101010; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.48); border: 1px solid rgba(255, 255, 255, 0.08); opacity: 0; transform: translateY(12px) scale(0.98); pointer-events: none; transition: opacity 180ms ease, transform 180ms ease; }
      .sb-widget-panel.sb-open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
      .sb-widget-panel iframe { width: 100%; height: 100%; border: 0; display: block; background: #0a0a0a; }
      .sb-widget-close { position: absolute; top: 10px; right: 10px; z-index: 2; width: 32px; height: 32px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14); background: rgba(17,17,17,0.85); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(0,0,0,0.28); }
      .sb-widget-close:hover { border-color: rgba(245, 197, 24, 0.35); color: #f5c518; }
      @media (max-width: 480px) {
        .sb-widget-root { right: 12px; bottom: 12px; }
        .sb-widget-launcher { width: 54px; height: 54px; }
        .sb-widget-panel { right: 12px; bottom: 74px; width: calc(100vw - 24px); height: min(620px, calc(100vh - 92px)); }
      }
    `;
    return style;
  }

  function createLauncherIcon() {
    return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 6.5C5 5.11929 6.11929 4 7.5 4H16.5C17.8807 4 19 5.11929 19 6.5V13.5C19 14.8807 17.8807 16 16.5 16H10.2L6.1 19.2C5.775 19.46 5.3 19.19 5.38 18.78L5.9 16H7.5C6.11929 16 5 14.8807 5 13.5V6.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M8 8.5H16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M8 11.5H13.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    `;
  }

  function buildWidgetUrl(baseUrl, companyId) {
    return `${baseUrl}/widget/${encodeURIComponent(companyId)}`;
  }

  function init() {
    const companyId = readCompanyId();
    if (!companyId) return;

    const baseUrl = readBaseUrl();
    const widgetUrl = buildWidgetUrl(baseUrl, companyId);
    const stateKey = getStateKey(companyId);
    const persistedOpen = localStorage.getItem(stateKey) === '1';
    const styles = createStyles();

    if (!document.querySelector('style[data-supportbee-widget="styles"]')) {
      document.head.appendChild(styles);
    }

    const root = document.createElement('div');
    root.className = 'sb-widget-root';

    const launcher = document.createElement('button');
    launcher.className = 'sb-widget-launcher';
    launcher.type = 'button';
    launcher.setAttribute('aria-label', 'Open SupportBee chat');
    launcher.innerHTML = createLauncherIcon();

    const panel = document.createElement('div');
    panel.className = 'sb-widget-panel';
    panel.innerHTML = `
      <button type="button" class="sb-widget-close" aria-label="Close SupportBee chat">×</button>
      <iframe title="SupportBee chat widget" src="${widgetUrl}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    `;

    function setOpen(open) {
      panel.classList.toggle('sb-open', open);
      localStorage.setItem(stateKey, open ? '1' : '0');
    }

    launcher.addEventListener('click', () => {
      setOpen(!panel.classList.contains('sb-open'));
    });

    panel.querySelector('.sb-widget-close').addEventListener('click', () => setOpen(false));

    root.appendChild(panel);
    root.appendChild(launcher);
    document.body.appendChild(root);

    setOpen(persistedOpen);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
