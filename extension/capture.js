(() => {
  if (location.hostname === '127.0.0.1' && location.port === '4173' && location.pathname !== '/capture-demo.html') return;
  const host = document.createElement('div');
  host.style.cssText = 'all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important';
  const root = host.attachShadow({mode:'closed'});
  root.innerHTML = `<style>
    [hidden]{display:none!important}button,textarea{font:inherit}button{cursor:pointer}
    .trigger,aside{pointer-events:auto;position:fixed;color:#202124;font:14px/1.55 system-ui,sans-serif}
    .trigger{background:#b2d5e5;border:1px solid #20212422;border-radius:9px;padding:7px 12px}
    aside{box-sizing:border-box;top:16px;right:16px;width:min(350px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;background:#fff;border:1px solid #ddd;border-radius:16px;padding:16px;box-shadow:0 14px 42px #0003}
    header{display:flex;align-items:center;justify-content:space-between}h2{font-size:16px;margin:0}
    blockquote{max-height:112px;overflow:auto;margin:14px 0;padding:10px;background:#f5f5f7;border-radius:8px;white-space:pre-wrap;overflow-wrap:anywhere}
    textarea{box-sizing:border-box;width:100%;min-height:80px;padding:8px;border:1px solid #ccc;border-radius:8px;margin:6px 0 10px;color:#202124;background:#fff}
    .save{background:#b2d5e5;border:0;border-radius:8px;padding:8px 12px}.close{border:0;background:none;font-size:20px}.error{margin:8px 0 0;color:#333}
  </style><button type="button" class="trigger" hidden>填写用途</button>
  <aside aria-label="网页摘录" hidden><header><h2>网页摘录</h2><button type="button" class="close" aria-label="关闭">×</button></header>
  <blockquote></blockquote><form><label for="intent">这段文字有什么用途？</label>
  <textarea id="intent" required maxlength="4000" placeholder="例如：用于验证缓存失效条件"></textarea>
  <button class="save">保存到画布</button><p class="error" role="alert"></p></form></aside>`;
  document.documentElement.append(host);
  const trigger = root.querySelector('.trigger');
  const panel = root.querySelector('aside');
  const field = root.querySelector('textarea');
  const status = root.querySelector('.error');
  const save = root.querySelector('.save');
  let quote = '';
  function updateSelection() {
    if (!panel.hidden) return;
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (!text || !selection.rangeCount) { trigger.hidden = true; return; }
    quote = text.slice(0,16000);
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    trigger.style.left = Math.max(8,Math.min(rect.right,innerWidth - 120)) + 'px';
    trigger.style.top = Math.max(8,Math.min(rect.bottom + 8,innerHeight - 46)) + 'px';
    trigger.hidden = false;
  }
  let timer;
  document.addEventListener('selectionchange', () => {
    clearTimeout(timer);
    timer = setTimeout(updateSelection, 150);
  });
  trigger.addEventListener('pointerdown', event => event.preventDefault());
  function openPanel() {
    if (!quote || !panel.hidden) return;
    trigger.hidden = true;
    panel.hidden = false;
    root.querySelector('blockquote').textContent = quote;
    status.textContent = '';
    field.focus();
  }
  trigger.addEventListener('click', openPanel);
  let pointerTimer;
  document.addEventListener('pointerup', event => {
    if (event.target === host || !panel.hidden) return;
    clearTimeout(pointerTimer);
    pointerTimer = setTimeout(() => {
      updateSelection();
      if (!trigger.hidden) openPanel();
    }, 80);
  });
  root.querySelector('.close').onclick = () => { if (!save.disabled) panel.hidden = true; };
  root.querySelector('form').onsubmit = async event => {
    event.preventDefault();
    const intent = field.value.trim();
    if (!intent) { status.textContent = '请填写用途。'; return; }
    save.disabled = true;
    status.textContent = '正在保存…';
    try {
      const result = await chrome.runtime.sendMessage({type:'capture',data:{quote,intent,source:document.title.slice(0,100)}});
      if (!result?.ok) throw new Error(result?.error || '保存失败，请重试。');
      panel.hidden = true;
      field.value = '';
    } catch (error) {
      status.textContent = error.message;
    } finally {
      save.disabled = false;
    }
  };
})();
