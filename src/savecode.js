// Save-code panel: copy your progress as a code and load it on another link,
// browser or device. Plain DOM (a real text box is needed to paste into).

import { exportSave, importSave, persist } from './save.js';

export function openSaveCode() {
  if (document.getElementById('gg-savecode')) return;
  persist();
  const wrap = document.createElement('div');
  wrap.id = 'gg-savecode';
  wrap.style.cssText = 'position:fixed;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;background:rgba(80,16,74,.6);font-family:"Comic Sans MS","Chalkboard SE","Segoe UI",sans-serif;user-select:text;-webkit-user-select:text;touch-action:auto;';
  const card = document.createElement('div');
  card.style.cssText = 'background:#fff;border:4px solid #a66ae0;border-radius:24px;padding:18px;width:min(92vw,420px);box-sizing:border-box;color:#8a3060;text-align:center;';
  card.innerHTML = `
    <div style="font-weight:900;font-size:22px;color:#ff5f9e">Your progress is saved</div>
    <p style="font-size:14px;margin:8px 0 10px;line-height:1.35">The game saves automatically on this device after every round, purchase and outfit change. To carry your progress to another link, browser or device, copy this code and load it there.</p>
    <textarea id="gg-code" spellcheck="false" style="width:100%;height:92px;box-sizing:border-box;border:2px solid #e8b8d8;border-radius:12px;padding:8px;font-size:12px;font-family:monospace;resize:none;user-select:text;-webkit-user-select:text"></textarea>
    <div id="gg-msg" style="min-height:20px;font-size:14px;font-weight:700;margin:6px 0"></div>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
      <button id="gg-copy">Copy my code</button>
      <button id="gg-load">Load a code</button>
      <button id="gg-close">Close</button>
    </div>`;
  wrap.appendChild(card);
  document.body.appendChild(wrap);
  const colors = { 'gg-copy': '#46c791', 'gg-load': '#a66ae0', 'gg-close': '#b9a8b8' };
  for (const [id, col] of Object.entries(colors)) {
    card.querySelector('#' + id).style.cssText = `background:${col};color:#fff;border:0;border-radius:22px;padding:11px 16px;font-weight:900;font-size:15px;font-family:inherit;cursor:pointer`;
  }
  const ta = card.querySelector('#gg-code');
  const msg = card.querySelector('#gg-msg');
  const mine = exportSave();
  ta.value = mine;
  const close = () => wrap.remove();
  card.querySelector('#gg-close').onclick = close;
  wrap.addEventListener('pointerdown', (e) => { if (e.target === wrap) close(); });
  card.querySelector('#gg-copy').onclick = async () => {
    ta.value = exportSave();
    ta.select();
    try { await navigator.clipboard.writeText(ta.value); msg.textContent = 'Copied! Paste it somewhere safe.'; }
    catch (e) { try { document.execCommand('copy'); msg.textContent = 'Copied!'; } catch (e2) { msg.textContent = 'Select the code and copy it.'; } }
    msg.style.color = '#2f9e57';
  };
  card.querySelector('#gg-load').onclick = () => {
    const code = ta.value.trim();
    if (!code || code === mine) {
      ta.value = '';
      ta.focus();
      msg.textContent = 'Paste a code in the box, then press Load a code again.';
      msg.style.color = '#a66ae0';
      return;
    }
    if (importSave(code)) {
      msg.textContent = 'Loaded! Restarting…';
      msg.style.color = '#2f9e57';
      setTimeout(() => window.location.reload(), 600);
    } else {
      msg.textContent = 'That code did not work. Check you copied all of it.';
      msg.style.color = '#d1274b';
    }
  };
}
