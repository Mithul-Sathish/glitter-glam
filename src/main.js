// Bootstrap: PIXI app, scene manager, resize handling, global tickers.

import { G } from './game.js';
import { updateTweens, tween, Ease } from './tween.js';
import { updateEffects, fxLayer, ambientSparkle } from './effects.js';
import { initSound, setSoundEnabled } from './sound.js';
import { save } from './save.js';
import { MenuScene } from './scenes/menu.js';

const app = new PIXI.Application({
  resizeTo: window,
  antialias: true,
  backgroundColor: 0xffd9ec,
  resolution: Math.min(window.devicePixelRatio || 1, 2),
  autoDensity: true,
});
document.getElementById('game').appendChild(app.view);
app.view.style.touchAction = 'none';

// UI scale: phones stay 1:1, big screens render everything larger.
function uiScale() {
  return Math.max(1, Math.min(2, Math.min(app.screen.width, app.screen.height) / 640));
}

function applyScale() {
  const S = uiScale();
  G.S = S;
  app.stage.scale.set(S);
  G.W = app.screen.width / S;
  G.H = app.screen.height / S;
  // keep PIXI.Text crisp under the stage scale
  try {
    PIXI.Text.defaultAutoResolution = false;
    PIXI.Text.defaultResolution = app.renderer.resolution * S;
  } catch (e) { /* older pixi builds */ }
}

G.app = app;
applyScale();

const sceneLayer = new PIXI.Container();
app.stage.addChild(sceneLayer);
app.stage.addChild(fxLayer);

setSoundEnabled(save.sound !== false);
initSound();

let current = null;
let switching = false;

function mount(SceneClass, params) {
  if (current) {
    if (current.dispose) current.dispose();
    current.root.destroy({ children: true });
    current = null;
  }
  applyScale();
  const scene = new SceneClass(params || {});
  scene.root = new PIXI.Container();
  sceneLayer.addChild(scene.root);
  scene.build(G.W, G.H);
  scene.builtW = G.W;
  scene.builtH = G.H;
  current = scene;
  G.scene = scene;
}

/** Sparkly circle-wipe transition between scenes. */
G.go = (SceneClass, params) => {
  if (switching) return;
  switching = true;
  const cover = new PIXI.Graphics();
  cover.beginFill(0xff8fc7);
  cover.drawRect(0, 0, 4000, 4000);
  cover.endFill();
  cover.alpha = 0;
  app.stage.addChild(cover);
  tween(cover, { alpha: 1 }, 220, {
    ease: Ease.quadIn,
    onDone: () => {
      mount(SceneClass, params);
      tween(cover, { alpha: 0 }, 300, {
        ease: Ease.quadOut,
        delay: 60,
        onDone: () => { cover.destroy(); switching = false; },
      });
    },
  });
};

// First scene, no transition.
mount(MenuScene, {});
// Hide the HTML splash.
const splash = document.getElementById('splash');
if (splash) splash.classList.add('hidden');

// ---------- main loop ----------
app.ticker.add(() => {
  // Cap the step so background-tab returns don't teleport everything, but keep
  // it generous enough that slow devices stay real-time instead of slow-motion.
  const ms = Math.min(100, app.ticker.deltaMS);
  updateTweens(ms);
  updateEffects(ms);
  if (current) {
    if (current.ambient) ambientSparkle(G.W, G.H);
    if (current.update) current.update(ms);
  }
});

// ---------- resize ----------
let resizeTimer = null;
function onResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    app.resize();
    applyScale();
    if (!current) return;
    if (Math.abs(G.W - current.builtW) < 4 && Math.abs(G.H - current.builtH) < 4) return;
    if (current.resizeMode === 'scale') {
      // Keep the running scene; letterbox-scale it into the new viewport.
      const s = Math.min(G.W / current.builtW, G.H / current.builtH);
      current.root.scale.set(s);
      current.root.x = (G.W - current.builtW * s) / 2;
      current.root.y = (G.H - current.builtH * s) / 2;
    } else {
      // Rebuild layout from scratch (menus and other stateless-ish scenes).
      const SceneClass = current.constructor;
      const params = current.params || {};
      mount(SceneClass, params);
    }
  }, 150);
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);
