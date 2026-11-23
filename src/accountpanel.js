// Account panel: sign up, log in, log out. Plain DOM so real text boxes (and
// the browser's own password manager) work.

import { account, signIn, signOut, deleteAccount } from './online.js';

const FONT = '"Comic Sans MS","Chalkboard SE","Segoe UI",sans-serif';
const btn = (col) => `background:${col};color:#fff;border:0;border-radius:22px;padding:11px 16px;font-weight:900;font-size:15px;font-family:inherit;cursor:pointer`;
const input = 'width:100%;box-sizing:border-box;border:2px solid #e8b8d8;border-radius:12px;padding:10px;font-size:16px;font-family:inherit;margin-top:8px;user-select:text;-webkit-user-select:text';

export function openAccount(onChange = () => {}) {
  if (document.getElementById('gg-account')) return;
  const wrap = document.createElement('div');
  wrap.id = 'gg-account';
  wrap.style.cssText = `position:fixed;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;background:rgba(80,16,74,.6);font-family:${FONT};user-select:text;-webkit-user-select:text;touch-action:auto;overflow:auto;`;
  const card = document.createElement('div');
  card.style.cssText = 'background:#fff;border:4px solid #a66ae0;border-radius:24px;padding:18px;width:min(92vw,380px);box-sizing:border-box;color:#8a3060;text-align:center;margin:8px;';
  wrap.appendChild(card);
  document.body.appendChild(wrap);
  const close = () => wrap.remove();
  wrap.addEventListener('pointerdown', (e) => { if (e.target === wrap) close(); });
  // keep game keyboard shortcuts from firing while typing
  wrap.addEventListener('keydown', (e) => e.stopPropagation());

  const say = (text, color = '#d1274b') => { const m = card.querySelector('#gg-amsg'); if (m) { m.textContent = text; m.style.color = color; } };

  const renderSignedIn = () => {
    const me = account();
    card.innerHTML = `
      <div style="font-weight:900;font-size:22px;color:#ff5f9e">Hi, <span id="gg-aname"></span>!</div>
      <p style="font-size:14px;margin:8px 0 6px;line-height:1.35">Your progress is saved to your account, and your best scores count in the world rankings.</p>
      <div id="gg-amsg" style="min-height:20px;font-size:14px;font-weight:700;margin:6px 0"></div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button id="gg-out" style="${btn('#a66ae0')}">Log out</button>
        <button id="gg-aclose" style="${btn('#b9a8b8')}">Close</button>
      </div>
      <details style="margin-top:12px;font-size:13px;text-align:left">
        <summary style="cursor:pointer;color:#9a6ab0">Delete my account</summary>
        <p style="margin:6px 0">This removes your name, saved game and scores from the server for good. The game on this device stays.</p>
        <input id="gg-delpw" type="password" autocomplete="current-password" placeholder="Password" style="${input}">
        <button id="gg-del" style="${btn('#d1274b')};margin-top:8px">Delete account</button>
      </details>`;
    card.querySelector('#gg-aname').textContent = me.name;
    card.querySelector('#gg-aclose').onclick = close;
    card.querySelector('#gg-out').onclick = async () => { say('Logging out…', '#a66ae0'); await signOut(); onChange(); render(); };
    card.querySelector('#gg-del').onclick = async () => {
      try { await deleteAccount(card.querySelector('#gg-delpw').value); onChange(); render(); say('Account deleted.', '#2f9e57'); }
      catch (e) { say(e.message); }
    };
  };

  const renderSignedOut = () => {
    card.innerHTML = `
      <div style="font-weight:900;font-size:22px;color:#ff5f9e">Your account</div>
      <p style="font-size:14px;margin:8px 0 2px;line-height:1.35">Log in to keep your progress on any device and join the world rankings. Pick a nickname, not your real name.</p>
      <form id="gg-form" autocomplete="on">
        <input id="gg-name" name="username" autocomplete="username" maxlength="16" placeholder="Nickname" autocapitalize="off" spellcheck="false" style="${input}">
        <input id="gg-pw" name="password" type="password" autocomplete="current-password" maxlength="72" placeholder="Password (6 or more characters)" style="${input}">
        <div id="gg-amsg" style="min-height:20px;font-size:14px;font-weight:700;margin:8px 0"></div>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          <button id="gg-login" type="submit" style="${btn('#46c791')}">Log in</button>
          <button id="gg-signup" type="button" style="${btn('#a66ae0')}">Create account</button>
          <button id="gg-aclose" type="button" style="${btn('#b9a8b8')}">Close</button>
        </div>
      </form>
      <p style="font-size:12px;margin-top:10px;color:#9a6ab0;line-height:1.3">We only store your nickname, a scrambled password, your saved game and your scores. No email, and there is no password reset, so keep your password safe.</p>`;
    card.querySelector('#gg-aclose').onclick = close;
    const go = async (mode) => {
      const name = card.querySelector('#gg-name').value.trim();
      const pw = card.querySelector('#gg-pw').value;
      if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) return say('Nicknames are 3 to 16 letters, numbers or _');
      if (pw.length < 6) return say('Passwords need 6 or more characters');
      say(mode === 'register' ? 'Creating your account…' : 'Logging in…', '#a66ae0');
      try {
        const out = await signIn(mode, name, pw);
        if (out.restored) { say('Welcome back! Loading your saved game…', '#2f9e57'); setTimeout(() => location.reload(), 700); return; }
        onChange();
        render();
        say(mode === 'register' ? 'Account created!' : 'Logged in!', '#2f9e57');
      } catch (e) { say(e.message); }
    };
    card.querySelector('#gg-form').onsubmit = (e) => { e.preventDefault(); go('login'); };
    card.querySelector('#gg-signup').onclick = () => go('register');
    setTimeout(() => { const n = card.querySelector('#gg-name'); if (n) n.focus(); }, 50);
  };

  const render = () => (account() ? renderSignedIn() : renderSignedOut());
  render();
}
